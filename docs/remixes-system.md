# Système de Remixes - AudioCollab

## Concept

Un **remix** est simplement un projet qui a un `parent_project_id`.

```
Définition simple:
Remix = Project avec parent_project_id NOT NULL
```

## Architecture

### Vue `project_remixes`

Une vue SQL qui joint automatiquement:
- Le projet remix
- Le projet parent
- Les créateurs (remix + parent)
- Club et Challenge (si applicable)

```sql
SELECT * FROM project_remixes WHERE club_id = 'xxx'
```

Retourne tous les remixes d'un club avec toutes les infos nécessaires.

### Fonctions Helper

#### `get_remix_count(project_id)`
Compte combien de remixes un projet a généré.

```sql
SELECT get_remix_count('project-uuid')
```

#### `can_remix_project(project_id, user_id)`
Vérifie si un utilisateur peut remixer un projet:
- Mode public/remixable
- Propriétaire du projet
- Collaborateur du projet

```sql
SELECT can_remix_project('project-uuid', 'user-uuid')
```

## Où apparaissent les remixes?

### 1. Dans un Club
`/clubs/[slug]?tab=remixes`

Affiche tous les remixes des projets du club:
- Remixes de projets club
- Remixes de challenges du club
- Créés par des membres ou non

### 2. Dans un Projet
`/projects/[id]` - Section "Remixes de ce projet"

Affiche tous les forks directs de ce projet spécifique.

### 3. Dans un Profil Utilisateur
`/profile/[id]?tab=remixes`

Affiche tous les remixes créés par cet utilisateur.

### 4. Feed Global (futur)
`/explore?filter=remixes`

Tous les remixes publics de la plateforme.

## Flow de création d'un remix

### 1. Bouton "Remix this project"
Sur la page projet, si `can_remix_project()` retourne true:

```tsx
<button onClick={handleRemix}>
  🎛 Remix this project
</button>
```

### 2. Action de remix

```ts
async function remixProject(parentProjectId: string) {
  // 1. Dupliquer les stems du projet parent
  // 2. Créer un nouveau Project avec parent_project_id
  // 3. Copier les métadonnées (optionnel)
  // 4. Rediriger vers le nouveau projet
}
```

### 3. Résultat

Le nouveau projet apparaît:
- Dans "Mes projets"
- Dans "Remixes du club" (si kind = club)
- Dans la page du projet parent
- Avec un badge "Remix"

## UI/UX des remixes

### Badge Remix
```tsx
<span className="badge-remix">
  🎛 Remix
</span>
```

### Lien vers le parent
```tsx
<p className="text-sm text-gray-500">
  Remix de: <Link href={`/projects/${parentId}`}>{parentTitle}</Link>
</p>
```

### Carte de remix
```tsx
<RemixCard
  title="Midnight Drive (Lo-Fi Remix)"
  parentTitle="Midnight Drive"
  creator="NovaBeats"
  coverUrl="/covers/remix.jpg"
/>
```

## Types de remixes possibles

### 1. Remix de projet personnel
```
Personal Project → Remix → Personal Project (avec parent_id)
```

### 2. Remix de projet de club
```
Club Project → Remix → Autre projet club ou personnel
```

### 3. Remix de challenge
```
Challenge Project → Remix → Projet personnel ou club
```

### 4. Remix de remix (chaîne)
```
Original → Remix 1 → Remix 2 → Remix 3
```

Tous les remixes pointent vers leur parent direct.

## Permissions

### Qui peut remixer?

Un projet peut être remixé si:
1. `mode = 'public'` → Tout le monde
2. `mode = 'remixable'` → Tout le monde
3. `mode = 'private'` + propriétaire → Seulement toi
4. `mode = 'private'` + collaborateur → Seulement les collabs

### RLS Policy (déjà existante)

Les remixes héritent des policies des projects normaux.
Pas besoin de policies spécifiques.

## Migration 009

Ajoute:
- Index pour performance sur `parent_project_id`
- Vue `project_remixes` pour queries rapides
- Fonctions `get_remix_count()` et `can_remix_project()`

À exécuter dans Supabase SQL Editor:
```sql
-- Voir: supabase/migrations/009_add_remix_infrastructure.sql
```

## Prochaines étapes

1. ✅ Migration 009 créée
2. ✅ Page club avec onglet Remixes corrigée
3. 🔲 Composant ClubTabs pour afficher les remixes
4. 🔲 Bouton "Remix this project" sur page projet
5. 🔲 Server action `remixProject()`
6. 🔲 Composant liste des remixes d'un projet

## Exemples de requêtes

### Tous les remixes d'un club
```sql
SELECT * FROM project_remixes
WHERE club_id = 'club-uuid'
ORDER BY created_at DESC;
```

### Remixes d'un projet spécifique
```sql
SELECT * FROM project_remixes
WHERE parent_project_id = 'project-uuid'
ORDER BY created_at DESC;
```

### Remixes créés par un utilisateur
```sql
SELECT * FROM project_remixes
WHERE owner_id = 'user-uuid'
ORDER BY created_at DESC;
```

### Remix le plus populaire d'un projet
```sql
SELECT pr.*, COUNT(l.id) as like_count
FROM project_remixes pr
LEFT JOIN project_likes l ON l.project_id = pr.id
WHERE pr.parent_project_id = 'project-uuid'
GROUP BY pr.id
ORDER BY like_count DESC
LIMIT 1;
```
