# AudioCollab - Roadmap MVP

## Objectif: Launch Web MVP en 4-6 semaines

**Target:** 20-30 producteurs PRO en beta
**Pricing:** $15/mois
**Goal:** Valider concept + demande pour plugin

---

## Semaine 1: Foundation & DB

### Jour 1-2: Database Setup
- [ ] Tester migrations sur dev DB
- [ ] Vérifier deduplication fonctionne
- [ ] Créer quelques commits test manuellement
- [ ] Valider RLS policies

**Deliverable:** DB versioning fonctionnelle

### Jour 3-5: API Routes
- [ ] POST `/api/commits` (créer commit avec stems + metadata)
- [ ] GET `/api/commits/:id` (récupérer commit)
- [ ] GET `/api/repositories/:id/commits` (history)
- [ ] POST `/api/branches` (créer branch)
- [ ] GET `/api/branches/:id/commits` (commits d'une branch)
- [ ] POST `/api/repositories/:id/clone` (download stems ZIP)

**Deliverable:** API versioning complète

**Estimation:** 5 jours
**Bloquant pour:** Semaine 2-3

---

## Semaine 2: Audio Engine + FX

### Jour 1-3: FX Chain Tone.js
- [ ] Ajouter Tone.EQ3 à TrackPlayer
- [ ] Ajouter Tone.Compressor à TrackPlayer
- [ ] Ajouter Tone.Reverb à TrackPlayer
- [ ] Signal chain: player → volume → eq → comp → reverb → pan
- [ ] executeEQChange()
- [ ] executeCompressorChange()
- [ ] executeReverbChange()
- [ ] Tester avec audio existant

**Deliverable:** Audio engine avec 3 FX

### Jour 4-5: Upload Dry Stems
- [ ] Modifier upload pour accepter dry stems
- [ ] Calculer hash SHA-256 (deduplication)
- [ ] Check si file existe déjà (find_file_by_hash)
- [ ] Upload vers Supabase Storage si nouveau
- [ ] Créer file_storage entry
- [ ] Sauver FX metadata avec stem

**Deliverable:** Upload dry + metadata fonctionnel

**Estimation:** 5 jours
**Dépend de:** Semaine 1 (API)

---

## Semaine 3: UI Versioning

### Jour 1-2: Commit UI
- [ ] Commit button dans studio header
- [ ] Modal commit (message input)
- [ ] Liste des stems à commiter (checkboxes)
- [ ] Progress indicator upload
- [ ] Success/error messages
- [ ] Refresh UI après commit

**Deliverable:** User peut commiter depuis web

### Jour 3-4: History Panel
- [ ] Sidebar collapsible (History)
- [ ] Liste commits chronologique
- [ ] Afficher: timestamp, message, author
- [ ] Click commit → load stems preview
- [ ] Restore button par commit
- [ ] Confirmation dialog restore

**Deliverable:** User voit history et restore

### Jour 5: Branch UI
- [ ] Branch selector (dropdown header)
- [ ] Liste branches existantes
- [ ] Create new branch modal
- [ ] Switch branch (reload commits)
- [ ] Indicateur branch actuelle

**Deliverable:** User peut créer/switch branches

**Estimation:** 5 jours
**Dépend de:** Semaine 1 (API)

---

## Semaine 4: FX UI + Integration

### Jour 1-3: FX Controls Mixer
- [ ] Expandable FX section par channel
- [ ] EQ sliders (low, mid, high) -12 to +12 dB
- [ ] Compressor controls (threshold, ratio)
- [ ] Reverb controls (decay, wet)
- [ ] On/Off toggles par effet
- [ ] Visual feedback (meters, etc.)
- [ ] Save FX state dans store

**Deliverable:** User peut éditer FX dans mixer

### Jour 4-5: FX Integration avec Commits
- [ ] Lire FX metadata depuis commit
- [ ] Appliquer FX settings au load commit
- [ ] Sauver FX settings lors du commit
- [ ] Test: commit → restore → FX identiques
- [ ] Presets FX optionnels (vocal boost, kick punch, etc.)

**Deliverable:** FX persistent entre commits

**Estimation:** 5 jours
**Dépend de:** Semaine 2 (FX Engine)

---

## Semaine 5: Diff Viewer + Polish

### Jour 1-3: Waveform Diff
- [ ] Composant DiffViewer
- [ ] Load 2 commits (A vs B)
- [ ] Overlay waveforms (rouge/bleu 50% opacity)
- [ ] Toggle visibility A/B
- [ ] Sync playback A/B
- [ ] Switch rapide entre versions

**Deliverable:** User peut comparer 2 commits visuellement

### Jour 4-5: Clone Project
- [ ] Download ZIP de stems (dry ou wet)
- [ ] Progress indicator
- [ ] Include metadata.json (FX settings)
- [ ] README dans ZIP (instructions)

**Deliverable:** User peut télécharger projet complet

**Estimation:** 5 jours
**Dépend de:** Semaine 3 (UI History)

---

## Semaine 6: Testing + Beta Launch

### Jour 1-2: Bug Fixes
- [ ] Tester tous les flows end-to-end
- [ ] Fix bugs critiques
- [ ] Performance checks (gros projets)
- [ ] Mobile responsive (basique)

### Jour 3: Documentation
- [ ] Guide utilisateur (comment utiliser versioning)
- [ ] FAQ
- [ ] Video demo (3-5 min)

### Jour 4-5: Beta Launch
- [ ] Landing page update (mention versioning)
- [ ] Email à liste (si existante)
- [ ] Posts communautés producteurs (Reddit, Discord)
- [ ] Recruit 20-30 beta testers
- [ ] Setup feedback channels (Discord, email)

**Deliverable:** Beta live avec vrais users

**Estimation:** 5 jours

---

## Milestones

### ✅ Milestone 1 (Fin Semaine 2)
- DB migrations complètes
- API versioning fonctionnelle
- Audio engine avec FX

### ✅ Milestone 2 (Fin Semaine 4)
- User peut commiter
- User voit history
- User peut créer branches
- FX éditables et persistent

### ✅ Milestone 3 (Fin Semaine 6)
- Diff viewer marche
- Clone project marche
- Beta lancée avec 20+ users

---

## Risques & Mitigations

### Risque 1: Deduplication complexe
**Impact:** Moyen
**Mitigation:** Start sans deduplication, ajouter après si besoin

### Risque 2: Performance FX chain (10+ tracks)
**Impact:** Élevé
**Mitigation:** Option "performance mode" (disable FX)

### Risque 3: Bugs audio engine race conditions
**Impact:** Critique
**Mitigation:** Fix existant (await load → then apply settings)

### Risque 4: Upload gros fichiers lent
**Impact:** Moyen
**Mitigation:** Chunked upload, progress indicator clair

### Risque 5: Pas assez de beta testers
**Impact:** Critique
**Mitigation:** Offering early adopter discount ($10/mois instead of $15)

---

## Success Criteria MVP

### Minimum (launch beta)
- [ ] 5+ commits fonctionnels sur projet test
- [ ] 2+ branches créées et switch sans bug
- [ ] FX appliqués et sauvés correctement
- [ ] Diff viewer affiche 2 commits
- [ ] Clone download fonctionne

### Target (validation concept)
- [ ] 20+ beta users signups
- [ ] 10+ users actifs (1+ commit par semaine)
- [ ] 5+ users disent "je veux le plugin"
- [ ] 0 bugs critiques reportés
- [ ] Feedback positif général

### Stretch (traction réelle)
- [ ] 50+ beta signups
- [ ] $300+ MRR (20 users × $15)
- [ ] 3+ testimonials utilisables marketing
- [ ] Demandes features claires pour Phase 2

---

## Après le MVP (Phase 2 décision)

### Si validation positive:
→ Start plugin JUCE (4-6 mois)

### Si validation mitigée:
→ Iterate web features basé sur feedback
→ Re-test avant plugin

### Si validation négative:
→ Pivot ou stop

---

## Notes Importantes

**Scope creep:**
- Ne PAS ajouter features non listées
- Ne PAS perfectionner avant feedback
- Launch > Perfect

**Communication:**
- Updates hebdo aux beta testers
- Transparent sur bugs/limitations
- Ask for feedback constantly

**Metrics tracking:**
- Commits created per user
- Active users weekly
- Churn rate
- Feature requests frequency

---

**Created:** 2026-01-15
**Target Launch:** 2026-02-26 (6 semaines)
**Status:** Not started
