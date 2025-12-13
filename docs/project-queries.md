# Project Queries Reference

This document contains common SQL queries for the 3 types of projects: personal, club, and challenge.

## 1. Personal Projects (User Studio)

### Get all personal projects for a user
```sql
SELECT *
FROM projects
WHERE kind = 'personal'
  AND owner_id = :user_id
ORDER BY updated_at DESC;
```

### Supabase TypeScript
```typescript
const { data: personalProjects } = await supabase
  .from('projects')
  .select('*')
  .eq('kind', 'personal')
  .eq('owner_id', user.id)
  .order('updated_at', { ascending: false })
```

---

## 2. Club Projects (Collaborations)

### Get all projects for a specific club
```sql
SELECT *
FROM projects
WHERE kind = 'club'
  AND club_id = :club_id
ORDER BY created_at DESC;
```

### Supabase TypeScript
```typescript
const { data: clubProjects } = await supabase
  .from('projects')
  .select(`
    *,
    profiles:owner_id (
      display_name,
      avatar_url
    )
  `)
  .eq('kind', 'club')
  .eq('club_id', clubId)
  .order('created_at', { ascending: false })
```

### Get all remixable projects in a club
```sql
SELECT *
FROM projects
WHERE kind = 'club'
  AND club_id = :club_id
  AND mode = 'remixable'
ORDER BY created_at DESC;
```

---

## 3. Challenge Projects (Competition Entries)

### Get all entries for a specific challenge
```sql
SELECT *
FROM projects
WHERE kind = 'challenge'
  AND challenge_id = :challenge_id
ORDER BY created_at ASC;
```

### Supabase TypeScript
```typescript
const { data: challengeEntries } = await supabase
  .from('projects')
  .select(`
    *,
    profiles:owner_id (
      display_name,
      avatar_url
    )
  `)
  .eq('kind', 'challenge')
  .eq('challenge_id', challengeId)
  .order('created_at', { ascending: true })
```

### Get user's challenge participations
```sql
SELECT *
FROM projects
WHERE kind = 'challenge'
  AND owner_id = :user_id
ORDER BY created_at DESC;
```

### Check if user already participated in a challenge
```sql
SELECT EXISTS (
  SELECT 1
  FROM projects
  WHERE kind = 'challenge'
    AND challenge_id = :challenge_id
    AND owner_id = :user_id
) AS has_participated;
```

---

## 4. User Profile Views

### Get all projects by kind for user profile
```typescript
// Personal projects section
const { data: personal } = await supabase
  .from('projects')
  .select('*')
  .eq('kind', 'personal')
  .eq('owner_id', userId)
  .order('updated_at', { ascending: false })

// Challenge participations section (separate)
const { data: challenges } = await supabase
  .from('projects')
  .select(`
    *,
    club_challenges:challenge_id (
      title,
      status
    )
  `)
  .eq('kind', 'challenge')
  .eq('owner_id', userId)
  .order('created_at', { ascending: false })
```

---

## 5. Creating Projects

### Create personal project
```typescript
const { data, error } = await supabase
  .from('projects')
  .insert({
    kind: 'personal',
    owner_id: user.id,
    title: 'My New Track',
    description: 'Working on something new',
    mode: 'private',
    club_id: null,
    challenge_id: null
  })
  .select()
  .single()
```

### Create club project
```typescript
const { data, error } = await supabase
  .from('projects')
  .insert({
    kind: 'club',
    owner_id: user.id,
    club_id: clubId,
    challenge_id: null,
    title: 'R&B Collab',
    description: 'Looking for vocalists',
    mode: 'public'
  })
  .select()
  .single()
```

### Participate in challenge (create challenge project)
```typescript
// First get the challenge to get club_id
const { data: challenge } = await supabase
  .from('club_challenges')
  .select('club_id')
  .eq('id', challengeId)
  .single()

// Then create the challenge project
const { data: project, error } = await supabase
  .from('projects')
  .insert({
    kind: 'challenge',
    owner_id: user.id,
    club_id: challenge.club_id,
    challenge_id: challengeId,
    title: 'My Challenge Entry',
    mode: 'public'
  })
  .select()
  .single()
```

---

## 6. Validation Rules

### Database constraints ensure:
1. **Personal projects**: `club_id` and `challenge_id` must be NULL
2. **Club projects**: `club_id` must NOT be NULL, `challenge_id` must be NULL
3. **Challenge projects**: Both `club_id` and `challenge_id` must NOT be NULL

### TypeScript validation
```typescript
function validateProjectData(data: CreateProjectParams) {
  if (data.kind === 'personal') {
    if (data.club_id || data.challenge_id) {
      throw new Error('Personal projects cannot have club_id or challenge_id')
    }
  }

  if (data.kind === 'club') {
    if (!data.club_id || data.challenge_id) {
      throw new Error('Club projects must have club_id and no challenge_id')
    }
  }

  if (data.kind === 'challenge') {
    if (!data.club_id || !data.challenge_id) {
      throw new Error('Challenge projects must have both club_id and challenge_id')
    }
  }
}
```

---

## 7. UI Display Logic

### Projects page (`/projects`)
- Show only `kind = 'personal'`
- Separate section for `kind = 'challenge'` (read-only, link to challenge)

### Club page (`/clubs/[slug]/projects`)
- Show only `kind = 'club'` for this specific club
- Do NOT show challenge projects here

### Club page (`/clubs/[slug]/remixes`)
- Show only `kind = 'club'` AND `mode = 'remixable'` for this club

### Challenge page (`/clubs/[slug]/challenges/[id]`)
- Show only `kind = 'challenge'` for this specific challenge
- Order by creation date to see who participated first

### User profile
- **My Projects**: `kind = 'personal'` only
- **Challenge Entries**: `kind = 'challenge'` only (separate section)
- Club projects are not shown on profile (they belong to the club)
