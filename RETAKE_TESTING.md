# Guide de Test - Système de Retakes + Quick Swipe Comping

## Tests Automatiques ✅

### 1. Database Migrations
- ✅ Migration `20260110000000_create_comped_sections.sql` créée et appliquée
- ✅ Migration `20260110010000_add_retake_folder_state.sql` créée et appliquée
- ✅ Table `project_comped_sections` avec colonnes: id, track_id, take_id, start_time, end_time, created_at, updated_at
- ✅ Colonne `is_retake_folder_open` ajoutée à `project_tracks`
- ✅ RLS policies configurées
- ✅ Indexes créés

### 2. Server Actions
- ✅ `createCompedSection()` - Crée une section comped
- ✅ `getCompedSections()` - Récupère les sections d'un track
- ✅ `deleteCompedSection()` - Supprime une section
- ✅ `toggleRetakeFolder()` - Toggle l'état du folder

### 3. UI Components
- ✅ `RetakeActivateButton.tsx` - Bouton activation/désactivation
- ✅ `RetakeTrackHeader.tsx` - Header pour retakes
- ✅ `CompableWaveformRow.tsx` - Waveform avec swipe detection
- ✅ `CompedSectionOverlay.tsx` - Overlay visuel des sections

### 4. Integration
- ✅ StudioView.tsx intégré avec handlers
- ✅ Audio engine modifié (useTonePlayback.ts)
- ✅ TrackHeaderList.tsx render retakes sous originale
- ✅ Build successful

---

## Tests Manuels à Effectuer

### Test 1: Upload & Folder System
**Objectif:** Vérifier que le système de retakes fonctionne correctement

**Étapes:**
1. Ouvrir un projet dans le studio
2. Uploader un premier fichier audio sur une piste → devient "originale"
3. Vérifier que le badge retake n'apparaît PAS (car pas encore de retake)
4. Uploader un 2e fichier audio sur la même piste → devient "retake #1"
5. Vérifier que le badge "1" apparaît sur le bouton Stack (icône Layers)
6. Cliquer sur le bouton Stack
7. Vérifier que le folder s'expand et la retake apparaît dessous
8. Vérifier que le border coloré s'étend verticalement pour englober originale + retake
9. Uploader un 3e fichier → devient "retake #2"
10. Vérifier que le badge devient "2"

**Résultat attendu:**
- ✅ Premier upload = originale (pas de badge)
- ✅ Uploads suivants = retakes (badge avec chiffre)
- ✅ Folder collapse/expand fonctionne
- ✅ Border coloré englobe tout le groupe

---

### Test 2: Visual States (Colored/Grayed)
**Objectif:** Vérifier les états visuels des retakes

**Étapes:**
1. Avec le folder de retakes ouvert
2. Observer l'originale: colorée (couleur de la piste)
3. Observer les retakes: grisées (zinc-600, waveform pâle)
4. Hover sur une retake inactive
5. Vérifier l'opacity et les transitions

**Résultat attendu:**
- ✅ Originale = colorée par défaut
- ✅ Retakes inactives = grisées
- ✅ Transitions smooth (200ms)
- ✅ Opacity différenciée (100% vs 90%)

---

### Test 3: Bouton d'Activation Retake
**Objectif:** Activer une retake complète

**Étapes:**
1. Sur une retake, cliquer le bouton d'activation (icône Play)
2. Vérifier que le bouton devient Check + violet
3. Vérifier que la retake devient colorée
4. Vérifier que l'originale devient grisée
5. Lancer la lecture (Play)
6. Vérifier que c'est la retake qui joue (pas l'originale)
7. Cliquer à nouveau le bouton (désactivation)
8. Vérifier le retour à l'état normal

**Résultat attendu:**
- ✅ Bouton change d'état (Play → Check)
- ✅ Couleurs inversées (retake colorée, originale grisée)
- ✅ Audio joue la retake activée
- ✅ Désactivation ramène à l'originale
- ✅ Animations smooth (scale effects)

---

### Test 4: Swipe Zone Detection
**Objectif:** Vérifier la détection de zones (swipe vs commentaires)

**Étapes:**
1. Hover sur la partie SUPÉRIEURE d'une retake (au-dessus ligne centrale)
2. Vérifier que le curseur devient `col-resize`
3. Vérifier le gradient subtil qui apparaît
4. Hover sur la partie INFÉRIEURE de la retake (en-dessous ligne centrale)
5. Vérifier que le curseur reste `pointer`
6. Répéter sur l'originale (pas de col-resize car c'est pas une retake)

**Résultat attendu:**
- ✅ Zone supérieure retake = curseur col-resize + gradient
- ✅ Zone inférieure = curseur normal
- ✅ Originale = pas de zone swipe
- ✅ Transitions smooth entre zones

---

### Test 5: Quick Swipe Comping
**Objectif:** Créer des sections comped via swipe

**Étapes:**
1. Sur une retake inactive, hover la zone supérieure
2. Cliquer et dragger horizontalement (ex: de 2s à 5s)
3. Observer le preview en temps réel (border dashed, pulse)
4. Relâcher la souris
5. Vérifier qu'une section colorée apparaît sur la retake
6. Vérifier qu'une section grisée apparaît au même endroit sur l'originale
7. Créer une 2e section (ex: de 8s à 10s)
8. Vérifier les deux sections coexistent

**Résultat attendu:**
- ✅ Preview pendant drag (dashed border, pulse animation)
- ✅ Section créée et sauvegardée
- ✅ Retake: section colorée avec border + glow
- ✅ Originale: section grisée correspondante
- ✅ Delete button (X) apparaît au hover
- ✅ Multiple sections possibles
- ✅ Minimum 0.5s requis (clics accidentels ignorés)

---

### Test 6: Audio Switching en Temps Réel
**Objectif:** Vérifier que l'audio switch correctement pendant la lecture

**Étapes:**
1. Créer 2 sections comped sur différentes retakes:
   - Section A: 0-3s sur retake #1
   - Section B: 6-9s sur retake #2
2. Lancer la lecture (Play)
3. Observer pendant la lecture:
   - 0-3s: écouter retake #1
   - 3-6s: écouter originale
   - 6-9s: écouter retake #2
   - 9s+: écouter originale
4. Vérifier qu'il n'y a PAS de coupures/glitches audio
5. Vérifier les animations visuelles (pulse sur sections actives)

**Résultat attendu:**
- ✅ Audio switch instantané aux timestamps corrects
- ✅ Pas de coupures audibles
- ✅ Synchronisation parfaite
- ✅ Transitions smooth entre sources
- ✅ VU meters reflètent la source active

---

### Test 7: Suppression de Sections
**Objectif:** Supprimer des sections comped

**Étapes:**
1. Hover une section comped sur une retake
2. Vérifier que le bouton X (rouge) apparaît
3. Cliquer le bouton X
4. Vérifier le toast "Section removed"
5. Vérifier que la section disparaît de la retake
6. Vérifier que la section grisée disparaît de l'originale
7. Lancer la lecture pour confirmer le retour à l'originale

**Résultat attendu:**
- ✅ Bouton X visible au hover
- ✅ Section supprimée immédiatement
- ✅ Audio retourne à l'originale
- ✅ Transitions smooth
- ✅ Toast notification

---

### Test 8: Persistence (Reload)
**Objectif:** Vérifier la persistence des données

**Étapes:**
1. Créer plusieurs sections comped
2. Toggle le folder de retakes (fermer)
3. Rafraîchir la page (F5)
4. Vérifier que le folder est toujours fermé
5. Ouvrir le folder
6. Vérifier que toutes les sections sont toujours là
7. Lancer la lecture pour confirmer l'audio

**Résultat attendu:**
- ✅ État du folder persisté
- ✅ Sections comped persistées
- ✅ Audio fonctionne après reload
- ✅ Aucune perte de données

---

### Test 9: Mode Read-Only
**Objectif:** Vérifier les restrictions en read-only

**Étapes:**
1. Ouvrir un projet en mode read-only (non-membre)
2. Vérifier qu'on peut voir les retakes
3. Vérifier qu'on peut voir les sections comped
4. Essayer de swipe sur une retake
5. Vérifier que rien ne se passe (disabled)
6. Hover les sections comped
7. Vérifier que le bouton X n'apparaît pas

**Résultat attendu:**
- ✅ Visualisation complète autorisée
- ✅ Swipe désactivé
- ✅ Pas de bouton de suppression
- ✅ Lecture audio fonctionne

---

### Test 10: Edge Cases
**Objectif:** Tester les cas limites

**Tests à effectuer:**
1. **Swipe trop court (< 0.5s):**
   - Swipe rapide → rien ne se crée

2. **Sections qui se chevauchent:**
   - Essayer de créer une section qui overlap une existante
   - Vérifier le comportement (merge ou erreur)

3. **Suppression du track:**
   - Supprimer un track avec sections comped
   - Vérifier cascade delete (pas d'erreurs)

4. **Nombreuses retakes (10+):**
   - Uploader 10+ retakes
   - Vérifier performance et scroll

5. **Audio très long (15+ minutes):**
   - Tester avec long audio
   - Vérifier precision du swipe

6. **Multiple tracks avec sections:**
   - Plusieurs tracks avec comping simultané
   - Vérifier pas de confusion entre tracks

**Résultat attendu:**
- ✅ Tous les edge cases gérés correctement
- ✅ Pas de crash ou erreurs console
- ✅ Performance acceptable

---

## Checklist Finale

### Fonctionnalités Core
- [ ] Upload retakes fonctionne
- [ ] Folder collapse/expand fonctionne
- [ ] Border coloré groupe bien tout
- [ ] Visual states corrects (coloré/grisé)
- [ ] Bouton activation retake fonctionne

### Quick Swipe Comping
- [ ] Swipe zone detection correcte
- [ ] Preview en temps réel
- [ ] Section créée et visible
- [ ] Section grisée sur originale
- [ ] Delete button fonctionne

### Audio Engine
- [ ] Audio switching temps réel
- [ ] Pas de coupures audibles
- [ ] Synchronisation parfaite
- [ ] VU meters corrects

### Polish & UX
- [ ] Toutes animations smooth
- [ ] Curseurs appropriés
- [ ] Hover effects corrects
- [ ] Toasts informatifs
- [ ] Performance acceptable

### Persistence
- [ ] Sections persistées après reload
- [ ] État folder persisté
- [ ] Aucune perte de données

### Mode Read-Only
- [ ] Visualisation OK
- [ ] Modifications bloquées
- [ ] Lecture audio OK

---

## Problèmes Connus / À Surveiller

1. **Performance:** Avec 10+ retakes chargées simultanément
2. **Memory:** Tous les audio en mémoire (original + retakes)
3. **Sync:** Désynchronisation possible si network lag
4. **Mobile:** Swipe gesture peut conflicter avec scroll

---

## Prochaines Améliorations (Hors Scope)

- [ ] Crossfade entre sections
- [ ] Pitch shift / time stretch des sections
- [ ] Export "bounced" track (sections aplaties)
- [ ] Playlists de takes (A/B testing rapide)
- [ ] Annotations sur sections ("best chorus", etc.)
- [ ] Undo/Redo pour sections
