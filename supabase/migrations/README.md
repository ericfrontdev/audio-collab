# Database Migrations: Git for Music

## Overview

Ces migrations transforment l'app "audio-collab" en système de versioning Git-like pour l'audio.

**Changements principaux:**
- ❌ Suppression: `takes`, `tracks`, `mixer_settings`
- ✅ Ajout: `repositories`, `branches`, `commits`, `stems`, `file_storage`
- ✅ Deduplication: Fichiers stockés une seule fois via hash
- ✅ Git-like: commit, branch, merge, tags

## Order d'exécution

**IMPORTANT:** Exécuter dans l'ordre exact:

### 1. Schema (nouvelles tables)
```bash
psql $DATABASE_URL -f 001_versioning_schema.sql
```

Crée:
- `file_storage` (deduplication layer)
- `repositories` (1 par projet)
- `branches` (main, experimental, etc.)
- `commits` (Git-like commits)
- `stems` (fichiers audio/MIDI versionnés)
- `tags` (version markers)
- `merges` (conflict resolution)

### 2. Security (RLS policies)
```bash
psql $DATABASE_URL -f 002_versioning_rls.sql
```

Configure:
- Row Level Security policies
- Storage bucket policies
- User access control

### 3. Migration (données existantes)
```bash
psql $DATABASE_URL -f 003_migrate_from_takes.sql
```

Migre:
- Projets → Repositories
- Tracks → Commits avec stems
- Takes → Commits chronologiques
- Comments → Référence commits
- Supprime anciennes tables

## Backup avant migration

**CRITIQUE:** Faire un backup avant:

```bash
# Dump complet
pg_dump $DATABASE_URL > backup_before_migration.sql

# Ou via Supabase Dashboard
# Settings → Database → Backups → Create backup
```

## Vérification post-migration

```sql
-- Vérifier counts
SELECT
    (SELECT COUNT(*) FROM repositories) as repos,
    (SELECT COUNT(*) FROM branches) as branches,
    (SELECT COUNT(*) FROM commits) as commits,
    (SELECT COUNT(*) FROM stems) as stems,
    (SELECT COUNT(*) FROM file_storage) as files;

-- Vérifier deduplication
SELECT
    file_hash,
    reference_count,
    file_size_bytes
FROM file_storage
WHERE reference_count > 1
ORDER BY reference_count DESC
LIMIT 10;

-- Vérifier branches
SELECT
    b.name,
    r.project_id,
    b.head_commit_id,
    (SELECT COUNT(*) FROM commits WHERE branch_id = b.id) as commit_count
FROM branches b
JOIN repositories r ON b.repository_id = r.id;
```

## Rollback (si problème)

```bash
# Restore le backup
psql $DATABASE_URL < backup_before_migration.sql
```

## Deduplication en action

**Exemple:**
```
Commit 1: kick.wav (5MB) → file_storage (hash: abc123)
Commit 2: kick.wav (inchangé) → réutilise file_storage (hash: abc123)
Commit 3: kick.wav (modifié) → nouveau file_storage (hash: def456)

Stockage: 10MB au lieu de 15MB (33% économie)
```

## Cleanup des fichiers orphelins

Fichiers avec `reference_count = 0` (plus utilisés):

```sql
-- Voir les orphelins
SELECT * FROM file_storage WHERE reference_count = 0;

-- Cleanup manuel
SELECT cleanup_orphaned_files();

-- Ou via cron (recommandé)
-- Supabase Dashboard → Database → Cron Jobs
-- Schedule: daily at 3am
-- Query: SELECT cleanup_orphaned_files();
```

## Storage Supabase

**Structure:**
```
Bucket: audio-commits/
  projects/
    {project_id}/
      commits/
        {commit_id}/
          {file_hash}.wav
          {file_hash}.mid
```

**Config bucket:**
- Public: ❌ (private)
- File size limit: 50MB par fichier
- Allowed MIME types: audio/*, application/json

## API Changes needed

**Frontend/Plugin devra utiliser:**

**Anciennes routes (deprecated):**
```
❌ GET /api/tracks
❌ POST /api/tracks/{id}/takes
❌ GET /api/takes/{id}
```

**Nouvelles routes (à créer):**
```
✅ GET /api/repositories/{id}/branches
✅ GET /api/branches/{id}/commits
✅ POST /api/commits (create commit avec stems)
✅ GET /api/commits/{id}/stems
✅ POST /api/branches/{id}/merge
```

## Prochaines étapes

1. ✅ Exécuter migrations
2. ⬜ Créer API routes pour versioning
3. ⬜ Mettre à jour web app (UI Git-like)
4. ⬜ Créer plugin JUCE
5. ⬜ Tester avec vrais projets

## Questions / Problèmes

Si erreurs pendant migration:
1. Check les logs PostgreSQL
2. Vérifier que toutes les foreign keys sont valides
3. Rollback et retry

**Support:** eric@yourapp.com
