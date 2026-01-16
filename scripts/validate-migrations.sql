-- AudioCollab - Validate Database Migrations
-- Run this after migrations to check everything is correct

\echo '🧪 Validating AudioCollab Database Migrations'
\echo '=============================================='
\echo ''

\echo '📊 1. Checking tables exist...'
SELECT
    table_name,
    CASE
        WHEN table_name IN ('file_storage', 'repositories', 'branches', 'commits', 'stems', 'tags', 'merges')
        THEN '✅'
        ELSE '❌'
    END as status
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
    )
ORDER BY table_name;

\echo ''
\echo '📊 2. Checking row counts...'
SELECT 'file_storage' as table_name, COUNT(*) as rows FROM file_storage
UNION ALL SELECT 'repositories', COUNT(*) FROM repositories
UNION ALL SELECT 'branches', COUNT(*) FROM branches
UNION ALL SELECT 'commits', COUNT(*) FROM commits
UNION ALL SELECT 'stems', COUNT(*) FROM stems
UNION ALL SELECT 'tags', COUNT(*) FROM tags
UNION ALL SELECT 'merges', COUNT(*) FROM merges
ORDER BY table_name;

\echo ''
\echo '🔒 3. Checking RLS is enabled...'
SELECT
    tablename,
    CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('file_storage', 'repositories', 'branches', 'commits', 'stems', 'tags', 'merges')
ORDER BY tablename;

\echo ''
\echo '⚙️  4. Checking functions exist...'
SELECT
    routine_name,
    routine_type,
    '✅' as status
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
    )
ORDER BY routine_name;

\echo ''
\echo '🔗 5. Checking foreign keys...'
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('repositories', 'branches', 'commits', 'stems', 'tags', 'merges')
ORDER BY tc.table_name, tc.constraint_name;

\echo ''
\echo '📇 6. Checking indexes...'
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('file_storage', 'repositories', 'branches', 'commits', 'stems')
ORDER BY tablename, indexname;

\echo ''
\echo '🔍 7. Sample repository data...'
SELECT
    r.id,
    p.name as project_name,
    r.default_branch,
    (SELECT COUNT(*) FROM branches WHERE repository_id = r.id) as branches,
    (SELECT COUNT(*) FROM commits WHERE repository_id = r.id) as commits
FROM repositories r
LEFT JOIN projects p ON r.project_id = p.id
LIMIT 5;

\echo ''
\echo '🌲 8. Sample branch data...'
SELECT
    b.id,
    b.name,
    b.head_commit_id,
    (SELECT COUNT(*) FROM commits WHERE branch_id = b.id) as commit_count
FROM branches b
LIMIT 5;

\echo ''
\echo '💾 9. File storage deduplication check...'
SELECT
    file_hash,
    reference_count,
    file_size_bytes / 1024 / 1024 as size_mb
FROM file_storage
WHERE reference_count > 1
ORDER BY reference_count DESC
LIMIT 5;

\echo ''
\echo '✅ Validation complete!'
\echo ''
\echo 'Review the output above to ensure:'
\echo '  - All 7 tables exist'
\echo '  - All 7 functions exist'
\echo '  - RLS is enabled on all tables'
\echo '  - Foreign keys are properly set'
\echo '  - Indexes are created'
\echo ''
