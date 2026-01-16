#!/bin/bash

# AudioCollab - Test Database Migrations
# Usage: ./scripts/test-migrations.sh

set -e

echo "🧪 Testing AudioCollab Database Migrations"
echo "=========================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable not set"
    echo ""
    echo "Set it with your Supabase connection string:"
    echo "export DATABASE_URL='postgresql://postgres:[password]@[host]:5432/postgres'"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Run migrations in order
echo "📊 Running migrations..."
echo ""

echo "1️⃣  Running 001_versioning_schema.sql..."
psql "$DATABASE_URL" -f supabase/migrations/001_versioning_schema.sql
echo "   ✅ Schema migration complete"
echo ""

echo "2️⃣  Running 002_versioning_rls.sql..."
psql "$DATABASE_URL" -f supabase/migrations/002_versioning_rls.sql
echo "   ✅ RLS policies migration complete"
echo ""

echo "3️⃣  Running 003_migrate_from_takes.sql..."
psql "$DATABASE_URL" -f supabase/migrations/003_migrate_from_takes.sql
echo "   ✅ Data migration complete"
echo ""

# Run validation queries
echo "🔍 Running validation queries..."
echo ""

psql "$DATABASE_URL" << 'EOF'
-- Check tables exist
SELECT
    'file_storage' as table_name,
    COUNT(*) as row_count
FROM file_storage
UNION ALL
SELECT 'repositories', COUNT(*) FROM repositories
UNION ALL
SELECT 'branches', COUNT(*) FROM branches
UNION ALL
SELECT 'commits', COUNT(*) FROM commits
UNION ALL
SELECT 'stems', COUNT(*) FROM stems;

-- Check RLS is enabled
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('file_storage', 'repositories', 'branches', 'commits', 'stems')
ORDER BY tablename;

-- Check functions exist
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN ('get_commit_history', 'find_file_by_hash', 'cleanup_orphaned_files', 'user_has_project_access');
EOF

echo ""
echo "✅ All migrations completed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Review the output above"
echo "   2. Check row counts make sense"
echo "   3. Run manual tests in Supabase dashboard"
echo "   4. See docs/TESTING_MIGRATIONS.md for detailed tests"
echo ""
