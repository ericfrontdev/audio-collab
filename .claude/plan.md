# Plan d'implémentation: Réorganisation des pistes par Drag & Drop

## Objectif
Permettre le réarrangement des pistes par drag & drop dans la vue timeline et la vue mixer, avec synchronisation bidirectionnelle.

## Décisions techniques basées sur les préférences utilisateur

✅ **Librairie**: @dnd-kit (moderne, accessible, flexible)
✅ **Zone draggable**: Icône grip (⋮⋮) sur le côté gauche de chaque piste
✅ **Feedback visuel**:
- Piste devient transparente pendant le drag
- Border bottom mauve épais (4-5px) apparaît sous la piste cible pour indiquer où déposer

## Architecture actuelle (découverte)

### Base de données
- Table: `project_tracks`
- Colonne: `order_index` (INTEGER, default 0)
- Index composite: `(project_id, order_index)` pour performance
- Chargement: Trié par `order_index ASC`

### État des pistes
- Stocké dans: `StudioView.tsx` → `tracks: TrackWithDetails[]`
- Rendu dans:
  - `TrackHeaderList.tsx` → liste verticale (timeline)
  - `MixerView.tsx` → liste horizontale (mixer channels)

### Pas de librairie DnD installée
- Aucun conflit avec des libs existantes
- Drag natif existant: uniquement pour upload de fichiers

## Plan d'implémentation

### Phase 1: Installation et configuration de @dnd-kit

**Fichier: package.json**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Packages requis:
- `@dnd-kit/core` - Fonctionnalités de base
- `@dnd-kit/sortable` - Composants pour listes réordonnables
- `@dnd-kit/utilities` - Helpers CSS et utilitaires

---

### Phase 2: Création de l'action serveur pour sauvegarder l'ordre

**Fichier: app/actions/studio.ts**

Nouvelle fonction à créer:
```typescript
export async function reorderTracks(
  projectId: string,
  trackIds: string[]
): Promise<{ success: boolean; error?: string }>
```

**Logique:**
1. Vérifier l'authentification (comme `updateMixerSettings`)
2. Vérifier les permissions (owner ou club member)
3. Mettre à jour l'`order_index` de chaque piste:
   - trackIds[0] → order_index: 0
   - trackIds[1] → order_index: 1
   - etc.
4. Utiliser une transaction Supabase pour atomicité
5. Pas de revalidatePath (mise à jour optimiste côté client)

**Permissions:** Réutiliser le pattern existant (owner_id ou club_member)

---

### Phase 3: Wrapper DnD pour TrackHeaderList (Timeline View)

**Fichier: components/studio/TrackHeaderList.tsx**

**Changements:**
1. Importer les hooks @dnd-kit:
   ```typescript
   import { DndContext, closestCenter, DragEndEvent, DragOverlay } from '@dnd-kit/core'
   import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
   ```

2. Wrapper le contenu avec `DndContext` et `SortableContext`:
   ```tsx
   <DndContext
     collisionDetection={closestCenter}
     onDragEnd={handleDragEnd}
   >
     <SortableContext
       items={tracks.map(t => t.id)}
       strategy={verticalListSortingStrategy}
     >
       {tracks.map(track => <TrackHeader ... />)}
     </SortableContext>
   </DndContext>
   ```

3. Handler `onDragEnd`:
   - Calculer le nouvel ordre avec `arrayMove`
   - Appeler callback parent `onTracksReorder`
   - Mise à jour optimiste de l'état local

**Nouveau prop requis:**
- `onTracksReorder: (newTrackIds: string[]) => void`

---

### Phase 4: Rendre TrackHeader draggable

**Fichier: components/studio/TrackHeader.tsx**

**Changements:**
1. Importer `useSortable`:
   ```typescript
   import { useSortable } from '@dnd-kit/sortable'
   import { CSS } from '@dnd-kit/utilities'
   import { GripVertical } from 'lucide-react'
   ```

2. Utiliser le hook:
   ```typescript
   const {
     attributes,
     listeners,
     setNodeRef,
     transform,
     transition,
     isDragging
   } = useSortable({ id: trackId })
   ```

3. Appliquer les styles de transformation:
   ```typescript
   const style = {
     transform: CSS.Transform.toString(transform),
     transition,
     opacity: isDragging ? 0.4 : 1,
   }
   ```

4. Ajouter l'icône grip sur le côté gauche:
   ```tsx
   <div ref={setNodeRef} style={style}>
     {/* Grip icon - draggable handle */}
     <button
       {...attributes}
       {...listeners}
       className="cursor-grab active:cursor-grabbing"
     >
       <GripVertical className="w-4 h-4 text-zinc-600" />
     </button>
     {/* Rest of track header */}
   </div>
   ```

**Placement du grip:**
- Tout à gauche, avant la bande de couleur
- Visible au hover
- 16x16px ou similaire

---

### Phase 5: Styling du drop indicator

**Fichier: components/studio/TrackHeader.tsx**

**Utiliser `isOver` de @dnd-kit:**
```typescript
const { isOver } = useSortable({ id: trackId })
```

**CSS conditionnel:**
```tsx
<div className={`
  ${isOver ? 'border-b-4 border-b-[#9363f7]' : ''}
`}>
```

**Couleur:** `#9363f7` (mauve primary du projet)
**Épaisseur:** 4px comme demandé

---

### Phase 6: Wrapper DnD pour MixerView (Mixer Channels)

**Fichier: components/studio/MixerView.tsx**

**Changements similaires à TrackHeaderList:**
1. Wrapper avec `DndContext` et `SortableContext`
2. Utiliser `horizontalListSortingStrategy` au lieu de vertical
3. Handler `onDragEnd` identique
4. Même callback `onTracksReorder`

```tsx
<DndContext
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={tracks.map(t => t.id)}
    strategy={horizontalListSortingStrategy}
  >
    <div className="flex h-full">
      {tracks.map(track => <MixerChannel ... />)}
    </div>
  </SortableContext>
</DndContext>
```

---

### Phase 7: Rendre MixerChannel draggable

**Fichier: components/studio/MixerChannel.tsx**

**Changements identiques à TrackHeader:**
1. Import `useSortable`
2. Appliquer transform/transition
3. Ajouter grip icon en haut du channel
4. Drop indicator: border-bottom sur le header

**Placement du grip dans mixer:**
- En haut du channel, dans la zone du nom
- Côté gauche, avant le nom de piste

---

### Phase 8: Gestion de l'état dans StudioView

**Fichier: components/studio/StudioView.tsx**

**Nouvelle fonction handler:**
```typescript
const handleTracksReorder = useCallback(async (newTrackIds: string[]) => {
  // 1. Mise à jour optimiste de l'état local
  const reorderedTracks = newTrackIds.map(id =>
    tracks.find(t => t.id === id)!
  )
  setTracks(reorderedTracks)

  // 2. Sauvegarde en base de données
  const result = await reorderTracks(projectId, newTrackIds)

  // 3. Si échec, recharger depuis DB
  if (!result.success) {
    toast.error('Failed to reorder tracks')
    await loadStudioData() // Rollback
  }
}, [tracks, projectId])
```

**Passer le handler:**
- À `TrackHeaderList` via `onTracksReorder`
- À `MixerView` via `onTracksReorder`

---

### Phase 9: CSS custom pour le drag overlay (optionnel)

**Fichier: components/ui/globals.css**

Ajouter des classes pour améliorer le feedback visuel:
```css
.dragging-track {
  opacity: 0.4;
  cursor: grabbing;
}

.drop-indicator {
  border-bottom: 4px solid #9363f7;
  box-shadow: 0 2px 8px rgba(147, 99, 247, 0.4);
}
```

---

## Ordre d'implémentation recommandé

1. ✅ **Installer @dnd-kit** (3 packages)
2. ✅ **Créer action serveur** `reorderTracks()` dans `studio.ts`
3. ✅ **Timeline d'abord:**
   - Wrapper TrackHeaderList avec DnD
   - Rendre TrackHeader draggable avec grip
   - Tester uniquement timeline
4. ✅ **Mixer ensuite:**
   - Wrapper MixerView avec DnD
   - Rendre MixerChannel draggable avec grip
   - Tester uniquement mixer
5. ✅ **Synchronisation:**
   - Handler dans StudioView
   - Tester que changer l'ordre dans timeline → se reflète dans mixer
   - Tester que changer l'ordre dans mixer → se reflète dans timeline
6. ✅ **Polish:**
   - Ajuster les styles de drop indicator
   - Vérifier l'accessibilité clavier
   - Tester edge cases (1 piste, beaucoup de pistes)

---

## Considérations importantes

### Performance
- @dnd-kit est optimisé (pas de re-renders inutiles)
- Mise à jour optimiste = UX instantanée
- Sauvegarde DB asynchrone en arrière-plan

### Accessibilité
- @dnd-kit supporte le clavier nativement
- Utilisateurs peuvent réorganiser avec Tab + Espace + flèches

### Edge cases
- **1 seule piste:** Pas de drag possible (désactiver le grip?)
- **Nouveau projet vide:** Pas de pistes à réorganiser
- **Échec de sauvegarde:** Rollback vers l'ordre DB

### Conflits potentiels
- **File upload drag:** Différent contexte (global vs piste)
- **Fader/Pan drag:** Événements séparés (mouseDown dans zones spécifiques)
- **Context menu:** Clic droit sur grip devrait ouvrir menu contextuel aussi

---

## Critères de succès

✅ Drag & drop fonctionne dans timeline
✅ Drag & drop fonctionne dans mixer
✅ L'ordre se synchronise entre les deux vues
✅ L'ordre persiste après refresh de la page
✅ Feedback visuel clair (transparence + border)
✅ Pas de conflit avec les autres interactions
✅ Support clavier (accessibilité)
✅ Performance fluide même avec 20+ pistes

---

## Estimation

- **Phase 1-2:** 15 min (installation + action serveur)
- **Phase 3-5:** 45 min (timeline drag & drop)
- **Phase 6-7:** 30 min (mixer drag & drop)
- **Phase 8:** 20 min (état + synchronisation)
- **Phase 9:** 10 min (polish)

**Total estimé:** ~2 heures

---

## Prêt à implémenter?

Une fois approuvé, je procéderai phase par phase avec des commits clairs pour chaque étape.
