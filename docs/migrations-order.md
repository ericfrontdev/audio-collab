# Ordre d'exécution des migrations

## ⚠️ IMPORTANT: Ordre d'exécution

Les migrations doivent être exécutées dans cet ordre précis:

### Migrations déjà exécutées ✅
- ✅ 001_init_schema.sql
- ✅ 002_add_admin_role.sql
- ✅ 003_remove_username.sql
- ✅ 004_create_clubs.sql
- ✅ 005_update_clubs_admin_only.sql
- ✅ 006_add_project_kind.sql
- ✅ 008_fix_club_members_recursion.sql

### Migrations à exécuter maintenant

#### 1. Migration 007 (REQUIS AVANT 009)
**Fichier**: `supabase/migrations/007_create_multitrack_system.sql`

**Ajoute**:
- Colonnes `parent_project_id`, `cover_url`, `mixdown_url`, `status` à `projects`
- Table `project_stems` (multipiste audio)
- Table `project_timeline_comments` (commentaires sur la timeline)
- Table `project_discussions` (discussions de projet)
- Table `project_discussion_messages` (messages de discussion)
- Table `project_collaborators` (collaborateurs)
- Table `project_versions` (versions de projets)
- Toutes les RLS policies associées

**Pourquoi en premier?**
La migration 009 dépend des colonnes ajoutées par la migration 007 (notamment `parent_project_id` et `cover_url`).

#### 2. Migration 009 (APRÈS 007)
**Fichier**: `supabase/migrations/009_add_remix_infrastructure.sql`

**Ajoute**:
- Index sur `parent_project_id` pour performance
- Vue SQL `project_remixes` (joint projets + parents + créateurs)
- Fonction `get_remix_count(project_id)`
- Fonction `can_remix_project(project_id, user_id)`

**Pourquoi après 007?**
Utilise les colonnes `parent_project_id`, `cover_url`, `mixdown_url` ajoutées par la migration 007.

## Comment exécuter

### Dans Supabase Dashboard

1. Va sur **SQL Editor**
2. Crée une nouvelle requête
3. Copie le contenu de `007_create_multitrack_system.sql`
4. Clique sur **Run**
5. Vérifie qu'il n'y a pas d'erreurs
6. Répète pour `009_add_remix_infrastructure.sql`

### Vérification

Après avoir exécuté les deux migrations, vérifie que tout fonctionne:

```sql
-- Vérifier que les colonnes existent
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'projects'
AND column_name IN ('parent_project_id', 'cover_url', 'mixdown_url', 'status');

-- Devrait retourner 4 lignes

-- Vérifier que la vue existe
SELECT * FROM project_remixes LIMIT 1;

-- Devrait fonctionner (même si vide)

-- Vérifier que les fonctions existent
SELECT get_remix_count('00000000-0000-0000-0000-000000000000');
-- Devrait retourner 0

SELECT can_remix_project('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');
-- Devrait retourner false
```

## Si tu as déjà des projets

Si tu as créé des projets avant d'exécuter la migration 007, ils auront automatiquement:
- `parent_project_id = null` (projets originaux, pas des remixes)
- `cover_url = null`
- `mixdown_url = null`
- `status = 'in_progress'`

C'est parfait et normal!

## Notes

- Migration 004_drop_clubs.sql n'a probablement pas été exécutée (c'était juste pour drop les tables clubs lors du développement)
- Les migrations utilisent `IF NOT EXISTS` et `IF EXISTS` pour être idempotentes
- Tu peux les ré-exécuter sans problème si nécessaire
