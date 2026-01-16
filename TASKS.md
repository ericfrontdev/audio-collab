# AudioCollab - Tasks Tracker

**Target:** MVP Launch en 6 semaines
**Status:** Not started

---

## Semaine 1: Foundation & DB (5 jours)

### Database
- [ ] Tester migration `001_versioning_schema.sql` sur dev DB
- [ ] Tester migration `002_versioning_rls.sql` sur dev DB
- [ ] Tester migration `003_migrate_from_takes.sql` sur dev DB
- [ ] Créer 2-3 commits test manuellement (via SQL)
- [ ] Vérifier deduplication fonctionne (hash matching)
- [ ] Valider RLS policies (test avec différents users)

### API Routes
- [ ] POST `/api/commits` - Créer commit avec stems + metadata
- [ ] GET `/api/commits/:id` - Récupérer un commit
- [ ] GET `/api/repositories/:id/commits` - History d'un repo
- [ ] POST `/api/branches` - Créer une branche
- [ ] GET `/api/branches/:id/commits` - Commits d'une branche
- [ ] POST `/api/repositories/:id/clone` - Download stems ZIP

---

## Semaine 2: Audio Engine + FX (5 jours)

### FX Chain Tone.js
- [ ] Ajouter `Tone.EQ3` à `TrackPlayer` interface
- [ ] Ajouter `Tone.Compressor` à `TrackPlayer` interface
- [ ] Ajouter `Tone.Reverb` à `TrackPlayer` interface
- [ ] Créer signal chain: player → volume → eq → comp → reverb → pan
- [ ] Implémenter `executeEQChange(trackId, low, mid, high)`
- [ ] Implémenter `executeCompressorChange(trackId, threshold, ratio)`
- [ ] Implémenter `executeReverbChange(trackId, wet, decay)`
- [ ] Tester FX avec fichiers audio existants

### Upload Dry Stems
- [ ] Modifier upload pour accepter dry stems
- [ ] Calculer hash SHA-256 du fichier
- [ ] Vérifier si file existe (deduplication)
- [ ] Upload vers Supabase Storage si nouveau
- [ ] Créer entry `file_storage` avec hash
- [ ] Créer entry `stem` avec `audio_file_id` + `fx_settings`
- [ ] Tester upload + retrieve

---

## Semaine 3: UI Versioning (5 jours)

### Commit UI
- [ ] Ajouter commit button dans studio header
- [ ] Créer modal commit (message input)
- [ ] Liste stems à commiter (checkboxes)
- [ ] Progress indicator upload
- [ ] Success/error toast messages
- [ ] Refresh UI après commit réussi

### History Panel
- [ ] Créer composant `HistoryPanel` (sidebar collapsible)
- [ ] Fetch commits pour branch actuelle
- [ ] Display liste chronologique (timestamp, message, author)
- [ ] Click commit → preview stems
- [ ] Restore button par commit
- [ ] Confirmation dialog restore

### Branch UI
- [ ] Créer `BranchSelector` dropdown (header)
- [ ] Liste branches du repo
- [ ] "Create new branch" modal
- [ ] Switch branch → reload commits
- [ ] Indicateur branch actuelle

---

## Semaine 4: FX UI + Integration (5 jours)

### FX Controls Mixer
- [ ] Ajouter section FX expandable par channel
- [ ] EQ sliders: low/mid/high (-12 to +12 dB)
- [ ] Compressor: threshold slider, ratio dropdown
- [ ] Reverb: decay slider, wet slider
- [ ] On/Off toggle par effet
- [ ] Visual feedback active FX
- [ ] Save FX state dans mixer store

### FX Integration Commits
- [ ] Lire `fx_settings` depuis commit
- [ ] Appliquer settings au load commit
- [ ] Sauver `fx_settings` lors du commit
- [ ] Test roundtrip: commit → restore → FX identiques
- [ ] (Optionnel) Presets FX basiques

---

## Semaine 5: Diff Viewer + Polish (5 jours)

### Waveform Diff
- [ ] Créer composant `DiffViewer`
- [ ] Load 2 commits (A vs B)
- [ ] Canvas overlay waveforms (rouge/bleu 50% opacity)
- [ ] Toggle visibility A/B
- [ ] Opacity sliders
- [ ] Sync playback A/B
- [ ] Switch rapide entre versions

### Clone Project
- [ ] Endpoint download ZIP de stems
- [ ] Include tous les stems du commit
- [ ] Include `metadata.json` (FX settings)
- [ ] Include `README.txt` (instructions)
- [ ] Progress indicator download
- [ ] Test avec projet multi-stems

---

## Semaine 6: Testing + Beta Launch (5 jours)

### Bug Fixes & Testing
- [ ] Test flow complet: upload → commit → history → restore
- [ ] Test branches: create → switch → commit
- [ ] Test FX: edit → commit → restore
- [ ] Test diff viewer avec 2 commits
- [ ] Test clone download
- [ ] Performance check (10+ tracks)
- [ ] Mobile responsive basique

### Documentation
- [ ] Guide utilisateur (how to use versioning)
- [ ] FAQ
- [ ] Video demo (3-5 min screencast)

### Beta Launch
- [ ] Landing page update (mention versioning)
- [ ] Beta signup form
- [ ] Email/posts pour recruit testers
- [ ] Setup feedback channel (Discord/email)
- [ ] Onboarding flow nouveaux users
- [ ] Monitor errors/crashes

---

## Tâche en cours

**Aucune** - Prêt à commencer

---

## Notes

**Branching convention:**
- `feature/task-name` (ex: `feature/test-db-migrations`)
- `fix/bug-name` (pour bugs)

**PR convention:**
- Title: "[Feature] Description courte"
- Description: Quoi, pourquoi, comment tester

**Review process:**
- Claude crée PR
- Eric review + feedback
- Claude fix si besoin
- Eric merge

---

**Created:** 2026-01-15
**Last updated:** 2026-01-15
