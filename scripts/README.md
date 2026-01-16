# Scripts Directory

## Available Scripts

### `test-migrations.sh`

Automated testing of all database migrations.

**Usage:**
```bash
export DATABASE_URL='your_supabase_connection_string'
./scripts/test-migrations.sh
```

**What it does:**
- Runs all 3 migrations in order
- Validates tables exist
- Checks RLS policies
- Verifies functions created

---

### `validate-migrations.sql`

Detailed validation queries to check migration success.

**Usage:**
```bash
psql "$DATABASE_URL" -f scripts/validate-migrations.sql
```

**What it checks:**
- Table existence
- Row counts
- RLS status
- Functions
- Foreign keys
- Indexes
- Sample data

---

## Before Running Scripts

1. **Backup your database**
2. **Set DATABASE_URL environment variable**
3. **Have `psql` installed**

See `docs/TESTING_MIGRATIONS.md` for detailed instructions.
