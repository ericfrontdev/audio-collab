# Supabase Storage Setup

## Configuration des buckets pour AudioCollab

### 1. Buckets à créer dans Supabase

Aller dans **Storage** dans le dashboard Supabase et créer les buckets suivants:

#### **Bucket: `stems`**
- **Public**: Non (privé)
- **File size limit**: 100 MB
- **Allowed MIME types**: `audio/wav`, `audio/mpeg`, `audio/mp3`, `audio/flac`, `audio/ogg`

#### **Bucket: `mixdowns`**
- **Public**: Oui (public)
- **File size limit**: 50 MB
- **Allowed MIME types**: `audio/wav`, `audio/mpeg`, `audio/mp3`

#### **Bucket: `project-covers`**
- **Public**: Oui (public)
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

#### **Bucket: `avatars`** (si pas déjà créé)
- **Public**: Oui (public)
- **File size limit**: 2 MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

---

## 2. Storage Policies (RLS)

### Bucket: `stems`

**SELECT (Read)**
```sql
-- Les stems sont visibles si le projet est visible
CREATE POLICY "Users can view stems of visible projects"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'stems'
  AND (
    -- Extract project_id from path: stems/PROJECT_ID/STEM_ID.wav
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND (
        projects.mode IN ('public', 'remixable')
        OR projects.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators
          WHERE project_collaborators.project_id = projects.id
          AND project_collaborators.user_id = auth.uid()
        )
      )
    )
  )
);
```

**INSERT (Upload)**
```sql
-- Les owners et collaborateurs peuvent uploader des stems
CREATE POLICY "Project owners and collaborators can upload stems"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'stems'
  AND auth.role() = 'authenticated'
  AND (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = (storage.foldername(name))[1]::uuid
      AND (
        projects.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators
          WHERE project_collaborators.project_id = projects.id
          AND project_collaborators.user_id = auth.uid()
        )
      )
    )
  )
);
```

**DELETE**
```sql
-- Seul le créateur du stem peut le supprimer
CREATE POLICY "Stem creator can delete their stems"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'stems'
  AND (
    -- Vérifier que le stem dans la DB appartient à l'utilisateur
    EXISTS (
      SELECT 1 FROM project_stems
      WHERE project_stems.file_url LIKE '%' || name
      AND project_stems.created_by = auth.uid()
    )
  )
);
```

---

### Bucket: `mixdowns`

**SELECT (Public read)**
```sql
CREATE POLICY "Mixdowns are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'mixdowns');
```

**INSERT**
```sql
CREATE POLICY "Project owners can upload mixdowns"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'mixdowns'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = (storage.foldername(name))[1]::uuid
    AND projects.owner_id = auth.uid()
  )
);
```

**DELETE**
```sql
CREATE POLICY "Project owners can delete mixdowns"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'mixdowns'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = (storage.foldername(name))[1]::uuid
    AND projects.owner_id = auth.uid()
  )
);
```

---

### Bucket: `project-covers`

**SELECT (Public read)**
```sql
CREATE POLICY "Project covers are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-covers');
```

**INSERT**
```sql
CREATE POLICY "Project owners can upload covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-covers'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = (storage.foldername(name))[1]::uuid
    AND projects.owner_id = auth.uid()
  )
);
```

**UPDATE**
```sql
CREATE POLICY "Project owners can update covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-covers'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = (storage.foldername(name))[1]::uuid
    AND projects.owner_id = auth.uid()
  )
);
```

**DELETE**
```sql
CREATE POLICY "Project owners can delete covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-covers'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = (storage.foldername(name))[1]::uuid
    AND projects.owner_id = auth.uid()
  )
);
```

---

## 3. Structure des chemins de fichiers

### Stems
```
stems/
  {project_id}/
    {stem_id}.wav
    {stem_id}.mp3
```

Exemple:
```
stems/123e4567-e89b-12d3-a456-426614174000/abc123.wav
```

### Mixdowns
```
mixdowns/
  {project_id}/
    {version_id}.mp3
    master.mp3
```

### Covers
```
project-covers/
  {project_id}/
    cover.jpg
```

---

## 4. Utilisation dans le code

### Upload un stem

```typescript
import { createClient } from '@/lib/supabase/client'

async function uploadStem(projectId: string, file: File, stemId: string) {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const filePath = `${projectId}/${stemId}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('stems')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error

  // Get public URL (signed URL for private buckets)
  const { data: urlData } = await supabase.storage
    .from('stems')
    .createSignedUrl(filePath, 60 * 60 * 24 * 7) // 7 days

  return urlData?.signedUrl
}
```

### Upload une cover

```typescript
async function uploadProjectCover(projectId: string, file: File) {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const filePath = `${projectId}/cover.${fileExt}`

  const { data, error } = await supabase.storage
    .from('project-covers')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true // Remplace si existe
    })

  if (error) throw error

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('project-covers')
    .getPublicUrl(filePath)

  return publicUrl
}
```

### Supprimer un stem

```typescript
async function deleteStem(filePath: string) {
  const supabase = createClient()

  const { error } = await supabase.storage
    .from('stems')
    .remove([filePath])

  if (error) throw error
}
```

---

## 5. Checklist de configuration

- [ ] Créer bucket `stems` (privé, 100MB)
- [ ] Créer bucket `mixdowns` (public, 50MB)
- [ ] Créer bucket `project-covers` (public, 5MB)
- [ ] Appliquer toutes les RLS policies pour `stems`
- [ ] Appliquer toutes les RLS policies pour `mixdowns`
- [ ] Appliquer toutes les RLS policies pour `project-covers`
- [ ] Tester upload stem
- [ ] Tester download stem avec signed URL
- [ ] Tester upload cover
- [ ] Tester suppression

---

## Notes importantes

1. **Stems = privés** → Utilisez `createSignedUrl()` pour les URLs temporaires
2. **Covers/Mixdowns = publics** → Utilisez `getPublicUrl()`
3. **Limits de taille** → Configurer dans Supabase dashboard
4. **MIME types** → Limiter aux formats audio/image appropriés
5. **Nommage** → Toujours utiliser `{project_id}/{file_id}.ext` pour faciliter les policies RLS
