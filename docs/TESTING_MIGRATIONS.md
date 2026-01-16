# Testing Database Migrations

## Prerequisites

1. **Supabase Project** (dev environment recommended)
2. **Database connection string**
3. **psql CLI** installed (`brew install postgresql` on Mac)

---

## Quick Test (Automated)

```bash
# Set your Supabase connection string
export DATABASE_URL='postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT].supabase.co:5432/postgres'

# Run migrations
./scripts/test-migrations.sh
```

This will:
- Run all 3 migrations in order
- Validate tables exist
- Check RLS is enabled
- Verify functions are created

---

## Manual Testing (Detailed)

### Step 1: Backup Current DB

**CRITICAL:** Always backup before migrations!

```bash
# Via Supabase Dashboard:
# Settings → Database → Backups → Create backup

# Or via CLI:
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql
```

### Step 2: Run Migrations

```bash
# Migration 1: Schema
psql "$DATABASE_URL" -f supabase/migrations/001_versioning_schema.sql

# Migration 2: RLS
psql "$DATABASE_URL" -f supabase/migrations/002_versioning_rls.sql

# Migration 3: Data migration (if you have existing data)
psql "$DATABASE_URL" -f supabase/migrations/003_migrate_from_takes.sql
```

### Step 3: Validation Queries

**Check all tables exist:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN (
        'file_storage',
        'repositories',
        'branches',
        'commits',
        'stems',
        'tags',
        'merges'
    );
```

Expected: 7 rows

**Check repositories:**
```sql
SELECT
    r.id,
    p.name as project_name,
    r.default_branch,
    (SELECT COUNT(*) FROM branches WHERE repository_id = r.id) as branch_count,
    (SELECT COUNT(*) FROM commits WHERE repository_id = r.id) as commit_count
FROM repositories r
JOIN projects p ON r.project_id = p.id;
```

**Check branches:**
```sql
SELECT
    b.name,
    b.head_commit_id,
    r.id as repo_id,
    (SELECT COUNT(*) FROM commits WHERE branch_id = b.id) as commit_count
FROM branches b
JOIN repositories r ON b.repository_id = r.id;
```

**Check file deduplication:**
```sql
SELECT
    file_hash,
    reference_count,
    file_size_bytes / 1024 / 1024 as size_mb,
    created_at
FROM file_storage
WHERE reference_count > 1
ORDER BY reference_count DESC;
```

Expected: Files with same hash have reference_count > 1

**Check functions exist:**
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN (
        'get_commit_history',
        'find_file_by_hash',
        'cleanup_orphaned_files',
        'user_has_project_access',
        'update_repository_timestamp',
        'update_commit_stats',
        'update_file_reference_count'
    );
```

Expected: 7 functions

**Check RLS is enabled:**
```sql
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('file_storage', 'repositories', 'branches', 'commits', 'stems')
ORDER BY tablename;
```

Expected: All tables have `rowsecurity = true`

---

## Test Scenarios

### Scenario 1: Create Manual Commit

```sql
-- Create a test repository
INSERT INTO repositories (project_id, default_branch)
SELECT id, 'main'
FROM projects
LIMIT 1
RETURNING id;

-- Note the repository id, then create a branch
INSERT INTO branches (repository_id, name, created_by)
VALUES (
    '[REPO_ID]',
    'main',
    auth.uid()
)
RETURNING id;

-- Note the branch id, then create a commit
INSERT INTO commits (repository_id, branch_id, author_id, message)
VALUES (
    '[REPO_ID]',
    '[BRANCH_ID]',
    auth.uid(),
    'Test commit'
)
RETURNING id;

-- Create a stem for this commit
INSERT INTO stems (commit_id, track_name, stem_type, fx_settings)
VALUES (
    '[COMMIT_ID]',
    'Test Track',
    'audio',
    '{"eq": {"low": 0, "mid": 2, "high": 3}}'::jsonb
);
```

### Scenario 2: Test Deduplication

```sql
-- Create two file_storage entries with same hash
INSERT INTO file_storage (file_hash, storage_url, storage_path, file_size_bytes, file_format, mime_type)
VALUES (
    'test_hash_123',
    'https://example.com/audio.wav',
    'test/audio.wav',
    1000000,
    'wav',
    'audio/wav'
)
ON CONFLICT (file_hash) DO NOTHING
RETURNING id;

-- Try to insert again with same hash (should skip due to UNIQUE constraint)
INSERT INTO file_storage (file_hash, storage_url, storage_path, file_size_bytes, file_format, mime_type)
VALUES (
    'test_hash_123',
    'https://example.com/audio2.wav',
    'test/audio2.wav',
    1000000,
    'wav',
    'audio/wav'
)
ON CONFLICT (file_hash) DO NOTHING;

-- Check only one entry exists
SELECT COUNT(*) FROM file_storage WHERE file_hash = 'test_hash_123';
-- Expected: 1
```

### Scenario 3: Test get_commit_history Function

```sql
-- Get history of a branch
SELECT *
FROM get_commit_history('[BRANCH_ID]', 10);
```

### Scenario 4: Test RLS Policies

```sql
-- As authenticated user, try to read repositories
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims.sub TO '[USER_ID]';

SELECT * FROM repositories;

-- Should only see repos for projects user has access to
```

---

## Common Issues & Solutions

### Issue 1: "relation already exists"

**Solution:** Tables were already created. Either:
- Drop tables manually
- Or use fresh Supabase project for testing

### Issue 2: "function user_has_project_access does not exist"

**Solution:** Run migrations in order (001, 002, 003)

### Issue 3: Migration 003 fails on empty DB

**Solution:** Normal if no existing `takes` or `tracks`. The migration handles this gracefully.

### Issue 4: Permission denied

**Solution:** Check your DATABASE_URL has correct credentials

---

## Rollback (if needed)

```sql
-- Drop all versioning tables
DROP TABLE IF EXISTS merges CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS stems CASCADE;
DROP TABLE IF EXISTS commits CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS repositories CASCADE;
DROP TABLE IF EXISTS file_storage CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_commit_history;
DROP FUNCTION IF EXISTS find_file_by_hash;
DROP FUNCTION IF EXISTS cleanup_orphaned_files;
DROP FUNCTION IF EXISTS user_has_project_access;
DROP FUNCTION IF EXISTS update_repository_timestamp;
DROP FUNCTION IF EXISTS update_commit_stats;
DROP FUNCTION IF EXISTS update_file_reference_count;

-- Restore from backup
psql "$DATABASE_URL" < backup_20260115.sql
```

---

## Success Criteria

✅ All migrations run without errors
✅ 7 tables created
✅ 7 functions created
✅ RLS enabled on all tables
✅ Can create manual test commit
✅ Deduplication works (same hash = one entry)
✅ get_commit_history returns results
✅ RLS policies restrict access correctly

---

## Next Steps After Testing

1. Mark task as done in `TASKS.md`
2. Document any issues found
3. Move to next task: API routes
4. Keep backup file for safety

---

**Last updated:** 2026-01-15
