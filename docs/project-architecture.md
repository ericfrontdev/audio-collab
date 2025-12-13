# Project Architecture - Kind-based Separation

## 📊 Vision Globale

Nous avons **3 familles de projets** qui ne se mélangent JAMAIS dans l'UI:

### 1. 🏠 Projets Personnels (`kind = 'personal'`)
- **Où**: Studio perso de l'utilisateur
- **Pas liés** à un club
- **Pas liés** à un challenge
- **Visibles**: Page `/projects` de l'utilisateur

### 2. 🎸 Projets de Club (`kind = 'club'`)
- **Où**: Collaborations dans un club
- **Liés** à un club spécifique
- **Pas liés** à un challenge
- **Visibles**: Page du club `/clubs/[slug]/projects`

### 3. 🏆 Projets de Challenge (`kind = 'challenge'`)
- **Où**: Participations à des compétitions
- **Liés** à un challenge spécifique
- **Liés** au club du challenge (pour contexte)
- **Visibles**:
  - Page du challenge `/clubs/[slug]/challenges/[id]`
  - Section "Mes participations" dans le profil

---

## 🗄️ Modèle de Données

### Table `projects`

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES profiles(id),

  -- Type de projet (JAMAIS mélangés dans l'UI)
  kind TEXT NOT NULL CHECK (kind IN ('personal', 'club', 'challenge')),

  -- Informations du projet
  title TEXT NOT NULL,
  description TEXT,

  -- Références (selon le kind)
  club_id UUID REFERENCES clubs(id),
  challenge_id UUID REFERENCES club_challenges(id),

  -- Métadonnées musicales
  bpm INTEGER,
  key TEXT,
  mode TEXT CHECK (mode IN ('private', 'public', 'remixable')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Contraintes d'intégrité

```sql
-- Projet personnel: pas de club_id ni challenge_id
CHECK (kind != 'personal' OR (club_id IS NULL AND challenge_id IS NULL))

-- Projet de club: doit avoir club_id, pas de challenge_id
CHECK (kind != 'club' OR (club_id IS NOT NULL AND challenge_id IS NULL))

-- Projet de challenge: doit avoir les deux
CHECK (kind != 'challenge' OR (club_id IS NOT NULL AND challenge_id IS NOT NULL))
```

---

## 🎯 Règles par Type de Projet

### Projet Personnel
```typescript
{
  kind: 'personal',
  club_id: null,
  challenge_id: null,
  // ... autres champs
}
```
- L'utilisateur travaille seul dans son studio
- Peut être private, public, ou remixable
- Affiché dans `/projects` (Mon Studio)

### Projet de Club
```typescript
{
  kind: 'club',
  club_id: '<uuid-du-club>',
  challenge_id: null,
  // ... autres champs
}
```
- Collaboration dans le style du club
- Affiché dans `/clubs/[slug]/projects`
- Si `mode = 'remixable'`, aussi dans `/clubs/[slug]/remixes`

### Projet de Challenge
```typescript
{
  kind: 'challenge',
  challenge_id: '<uuid-du-challenge>',
  club_id: '<uuid-du-club>', // hérité du challenge
  // ... autres champs
}
```
- Participation à une compétition
- Affiché dans `/clubs/[slug]/challenges/[id]`
- Affiché dans section "Mes participations" du profil
- **N'apparaît PAS** dans la liste normale des projets du club

---

## 🖥️ Interface Utilisateur

### 1. Page "Mon Studio" (`/projects`)

```
┌─────────────────────────────────────┐
│ 📁 Mes Projets Personnels           │
├─────────────────────────────────────┤
│ WHERE kind = 'personal'             │
│   AND owner_id = current_user       │
├─────────────────────────────────────┤
│ [Liste des projets personnels]      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🏆 Mes Participations aux Challenges│
├─────────────────────────────────────┤
│ WHERE kind = 'challenge'            │
│   AND owner_id = current_user       │
├─────────────────────────────────────┤
│ [Liste avec lien vers challenge]    │
└─────────────────────────────────────┘
```

### 2. Page d'un Club (`/clubs/[slug]`)

**Onglet "Projects"**:
```sql
SELECT * FROM projects
WHERE kind = 'club'
  AND club_id = :club_id
ORDER BY created_at DESC;
```

**Onglet "Remixes"**:
```sql
SELECT * FROM projects
WHERE kind = 'club'
  AND club_id = :club_id
  AND mode = 'remixable'
ORDER BY created_at DESC;
```

**Onglet "Challenges"**:
Liste des challenges, chaque challenge affiche ses entrées

### 3. Page d'un Challenge (`/clubs/[slug]/challenges/[id]`)

```sql
SELECT * FROM projects
WHERE kind = 'challenge'
  AND challenge_id = :challenge_id
ORDER BY created_at ASC;  -- Premier arrivé, premier affiché
```

---

## 🔄 Flow: Participer à un Challenge

### Étape 1: Utilisateur clique "Participer"

```typescript
// 1. Récupérer les infos du challenge
const { data: challenge } = await supabase
  .from('club_challenges')
  .select('id, club_id, title')
  .eq('id', challengeId)
  .single()

// 2. Créer le projet de challenge
const { data: project } = await supabase
  .from('projects')
  .insert({
    kind: 'challenge',
    challenge_id: challenge.id,
    club_id: challenge.club_id,
    owner_id: user.id,
    title: `Entry for ${challenge.title}`,
    mode: 'public'
  })
  .select()
  .single()

// 3. Rediriger vers le projet
redirect(`/${locale}/projects/${project.id}`)
```

### Étape 2: Utilisateur travaille sur son projet

L'utilisateur édite son projet normalement dans le studio.

### Étape 3: Projet visible dans le challenge

Le projet apparaît automatiquement dans:
- ✅ La page du challenge
- ✅ Section "Mes participations" du profil
- ❌ La liste normale des projets du club (car `kind = 'challenge'` ≠ `kind = 'club'`)

---

## ✅ Avantages de cette Architecture

### 1. Séparation Claire
- Pas de mélange dans les listes
- Chaque type a son propre espace
- Facile à filtrer et afficher

### 2. Intégrité des Données
- Contraintes SQL garantissent la cohérence
- Impossible de créer un projet mal formé
- Type guards TypeScript pour sécurité supplémentaire

### 3. UX Simple
- L'utilisateur comprend où trouver quoi
- Projets persos ≠ projets de club ≠ participations challenges
- Pas de confusion

### 4. Évolutivité
- Facile d'ajouter de nouveaux `kind` si besoin
- Queries optimisées avec index sur `kind`
- Code maintenable et extensible

---

## 🚀 Prochaines Étapes

1. ✅ Exécuter migration `006_add_project_kind.sql`
2. ⏳ Mettre à jour les actions de création de projet
3. ⏳ Séparer les listes dans l'UI (profil, club, challenges)
4. ⏳ Créer le flow "Participer à un challenge"
5. ⏳ Tester tous les scénarios

---

## 📝 Notes Importantes

- **Ne JAMAIS** afficher des projets de différents `kind` dans la même liste
- **Toujours** filtrer par `kind` dans les requêtes
- **Valider** le `kind` côté serveur lors de la création
- **Utiliser** les type guards TypeScript pour la sécurité du code
