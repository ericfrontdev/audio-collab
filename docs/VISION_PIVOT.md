# AudioCollab - Vision & Stratégie

## TL;DR

**AudioCollab = Git for Music pour producteurs PRO**

- **Plugin JUCE** (core product) - Commit/branch depuis le DAW
- **Web App** (support tool) - Preview, review, collaboration
- **Target:** Producteurs PRO avec Ableton/Logic/FL Studio
- **Pricing:** $15/mois (plugin + web included)

---

## 1. Marché Cible

### ✅ Producteurs PRO (focus principal)

**Pourquoi:**
- Pain point intense (versioning chaos quotidien)
- Willingness to pay élevée ($15/mois facile)
- Usage quotidien (rétention forte)
- Peu de concurrence (problème non résolu)

**Déjà dépensé:**
- DAW: $200-600
- VSTs: $1000-5000+
- Hardware: $2000+
- Samples: $10-30/mois

### ❌ Producteurs débutants (pas le focus)

**Pourquoi pas:**
- Pain point faible (pas encore de projets complexes)
- Marché price-sensitive
- Churn élevé (hobbystes)
- Concurrence forte (BandLab gratuit, 100M users)

---

## 2. Architecture Produit

### Plugin JUCE (Core - $15/mois)

**Rôle:** Outil de production principal

**Features:**
- Multi-instance (Master/Slave sync sur chaque piste DAW)
- Capture audio/MIDI par piste
- Commit depuis DAW (zero friction)
- Branch workflow
- Pull changes des collaborateurs
- Notifications in-DAW

**Formats:**
- VST3 (Windows + Mac)
- AU (Mac - Logic Pro)
- AAX (Pro Tools - Phase 3)

### Web App (Included)

**Rôle:** Preview, review, collaboration

**Features:**
- Studio interface magnifique (ton UI actuelle)
- Quick preview (30 sec vs 5 min d'ouvrir DAW)
- Rough mix avec FX web (EQ/Comp/Reverb)
- Diff viewer visuel
- Comments sur waveform (timestamps)
- Project chat realtime
- Invitations & permissions
- History/branches visualization

**Pour qui:**
- Producteurs (quick checks sans ouvrir DAW)
- Artistes/managers (review sans DAW)
- Clients (approve versions)

---

## 3. Système de Versioning

### Database Schema

**Tables principales:**
- `repositories` (1 par projet)
- `branches` (main, experimental, etc.)
- `commits` (Git-like avec parent commits)
- `stems` (audio/MIDI versionnés)
- `file_storage` (deduplication via SHA-256 hash)
- `tags` (v1.0, final-mix, etc.)
- `merges` (conflict resolution)

**Deduplication:**
- Même fichier audio dans plusieurs commits = stocké 1x
- Économie: 40-60% de storage

### Workflow Git-like

```
main branch
  ├─ commit 1: "Initial structure"
  ├─ commit 2: "Added vocals"
  └─ commit 3: "Fixed bass"
       └─ branch: experimental-drop
           └─ commit 4: "New drop variation"
```

**Features:**
- Clone project (download/import projet complet)
- Commits (avec message, auto-push)
- Branches (essayer variations)
- Merge (combiner changements)
- Diff (comparer versions)
- Tags (marquer versions importantes)
- History (timeline complète)

---

## 4. Waveform Diff - Comparaison Visuelle

### Approche: Overlay avec transparence

**Principe:**
```
Commit A (rouge, 50% opacity)
Commit B (bleu, 50% opacity)

Superposés sur canvas:
- Parties identiques → violet (rouge + bleu mixés)
- Différences → rouge ou bleu visibles
```

**Exemple visuel:**
```
Vocals commit A: ▂▃▅▇█▇▅▃▂  (rouge)
Vocals commit B: ▂▃▅▆▇▆▅▃▂  (bleu)

Overlay result:  ▂▃▅██▅▃▂  (violet = identique)
                    ↑ Peak différent visible
```

### Changements détectables visuellement

**Volume/Amplitude:**
- Commit A: pic à 0.8
- Commit B: pic à 0.6
- Diff: Rouge dépasse le bleu

**Notes ajoutées/supprimées:**
- Commit A: silence à 2:30
- Commit B: son nouveau à 2:30
- Diff: Bleu apparaît dans le silence

**Timing décalé:**
- Commit A: kick à 1.000s
- Commit B: kick à 1.050s
- Diff: Deux pics légèrement décalés

**Traitement audio:**
- Commit A: compressé (dynamique réduite)
- Commit B: non compressé (pics plus hauts)
- Diff: Forme générale différente

### Implementation technique

```typescript
// Canvas setup
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

// Load waveform data
const waveformA = await fetchWaveform(commitA)
const waveformB = await fetchWaveform(commitB)

// Draw commit A (rouge)
ctx.globalAlpha = 0.5
ctx.fillStyle = '#ef4444'
drawWaveform(ctx, waveformA)

// Draw commit B (bleu) par-dessus
ctx.fillStyle = '#3b82f6'
drawWaveform(ctx, waveformB)

// Résultat: overlay automatique
// Régions identiques = violet
// Régions différentes = rouge ou bleu visibles
```

### Features UI

**Contrôles:**
- Toggle visibility (show/hide commit A ou B)
- Opacity sliders (ajuster transparence)
- Solo mode (voir un commit seul)
- Sync playback (jouer les deux versions)

**Playback synchronisé:**
```typescript
// Player A/B comparison
const playerA = new Tone.Player(commitA.audioUrl)
const playerB = new Tone.Player(commitB.audioUrl)

// Switch entre versions
[Switch A] [Switch B] [A/B Toggle]

// Ou jouer les deux en même temps (gauche/droite)
playerA.connect(new Tone.Panner(-1)) // Left
playerB.connect(new Tone.Panner(1))  // Right
```

**Timeline markers:**
- Annotations sur changements détectés
- "Volume increased at 1:32"
- "New instrument at 2:15"
- Clickable pour jump to timestamp

### Alternatives considérées (pas retenues)

**❌ Diff numérique (comme Git):**
```
- Line 234: kick_sample_old.wav
+ Line 234: kick_sample_new.wav
```
Pas utile pour audio (binaire)

**❌ Spectral analysis:**
Trop complexe pour MVP, peut-être Phase 3

**❌ Audio subtraction (A - B):**
```javascript
const diff = audioA.map((sample, i) => sample - audioB[i])
```
Intéressant mais peu intuitif visuellement

**✅ Overlay waveform = Simple, visuel, efficace**

---

## 5. Audio & FX Workflow

### Choix: Dry stems + metadata FX

**Ce qu'on commit:**
```json
{
  "stems": [
    {
      "name": "vocals",
      "audio_file": "vocals_dry.wav",
      "fx_settings": {
        "eq": { "low": 0, "mid": 2, "high": 3 },
        "compressor": { "threshold": -24, "ratio": 4 },
        "reverb": { "decay": 2.5, "wet": 0.4 }
      }
    }
  ]
}
```

**Dans le web:**
- Tone.js applique FX en temps réel
- Éditable (quick iterations)
- Approximation (pas plugins pro, mais OK pour rough mix)

**Plugin "Pull":**
- `[Pull dry]` → stems sans FX
- `[Pull with FX]` → backend render on-demand avec FX appliqués

**Avantages:**
- ✅ Fichiers petits (stems dry)
- ✅ Iteration rapide (éditer FX dans web)
- ✅ Flexible (dry ou wet selon besoin)
- ✅ Deduplication efficace

---

## 5. Features Sociales

### ✅ Garder (essentielles pour collaboration)

**Project-scoped:**
- Project chat realtime
- Activity feed du projet
- Comments sur commits (waveform timestamps)
- Invitations & permissions
- Notifications (commits, mentions, etc.)

**User-level:**
- User profiles (simple, portfolio)
- DM entre collaborateurs
- Project discovery (trouver projets publics)

### ❌ Couper pour MVP

**Trop "social network":**
- Feed principal global (posts style Instagram)
- Clubs/communautés par genre (style subreddit)
- Following/followers
- Likes/reactions
- Stories

**Pourquoi:**
- Dilue le focus (versioning = core value)
- Maintenance lourde (modération)
- Pas critique pour collaboration projet
- Peut ajouter Phase 2 si demandé

---

## 6. Comparaison avec Concurrence

### Splice ($10/mois)
- ✅ Backup automatique
- ❌ Pas de branches
- ❌ Pas de web studio
- ❌ Pas de FX quick mix

### AudioCollab ($15/mois)
- ✅ Plugin VST3/AU
- ✅ Branches & merge
- ✅ Web studio magnifique
- ✅ FX quick mix (EQ/Comp/Reverb)
- ✅ Comments sur waveform
- ✅ Diff viewer visuel
- ✅ Project chat realtime

**Différenciation claire. $5 extra justifié.**

---

## 7. Roadmap

### Phase 1: Web MVP (4-6 semaines) - EN COURS

**Objectif:** Valider le concept avec vrais users

**Features:**
- ✅ Migrations DB (fait)
- Versioning UI (commits, branches, history)
- Clone project (download ZIP de stems)
- FX chain Tone.js (EQ, Comp, Reverb)
- Upload dry stems + metadata
- Studio web avec playback FX
- Comments sur waveform
- Project chat

**Launch:**
- Beta avec 20-30 producteurs PRO
- $15/mois
- Feedback intensif
- Question: "Payeriez-vous pour un plugin?"

### Phase 2: Plugin JUCE (4-6 mois) - SI VALIDATION OK

**Features:**
- Plugin VST3/AU boilerplate
- Multi-instance communication (Master/Slave)
- Clone project (import automatique dans pistes DAW + .audiocollab file)
- Commit depuis DAW (auto-push)
- Branch workflow
- Pull dry/wet stems
- Sync avec web app (projet DAW reste connecté au repo)

### Phase 3: Polish & Scale (2-3 mois)

**Features:**
- Merge/conflict resolution avancé
- Diff viewer amélioré
- Mobile web responsive
- Marketing/sales
- Features demandées par users

---

## 8. Migrations Accomplies

**Fichiers créés:**
- `001_versioning_schema.sql` - Tables versioning
- `002_versioning_rls.sql` - Security policies
- `003_migrate_from_takes.sql` - Migration données

**Tables supprimées:**
- `takes` (remplacé par commits + stems)
- `tracks` (remplacé par commits + stems)
- `mixer_settings` (dans repository.settings)

**Tables gardées:**
- `projects` (base)
- `profiles` (users)
- `comments` (maintenant lié à commits)
- `project_members` (collaboration)

---

## 9. Décisions Techniques Clés

### Audio Engine
- ✅ Garder Tone.js (pas de réécriture)
- ✅ Fix race condition (load → sync settings)
- ✅ Ajout FX chain (EQ, Comp, Reverb)

### Studio Web Interface
- ✅ Garder tel quel (magnifique, pro)
- ✅ Rôle: Preview/review tool (pas DAW complet)
- ✅ Read-only playback (stems rendered avec FX)
- ✅ FX éditables (quick rough mix)

### Storage Strategy
- ✅ Dry stems par défaut
- ✅ Deduplication via SHA-256 hash
- ✅ Render on-demand pour "pull with FX"
- ✅ 50GB storage par user ($15/mois)

### Backend Rendering
- ✅ Supabase Edge Functions
- ✅ Render dry + metadata → wet (on-demand)
- ✅ Cache résultats
- ✅ Pas de render à l'avance

---

## 10. Messaging & Positioning

### Tagline
**"Git for Music Producers"**

### Value Proposition
```
Work in your DAW. Version like a pro.

✓ Plugin for Ableton, Logic, FL Studio
✓ Web studio for quick preview
✓ Branch & merge workflow
✓ Collaborate with anyone
✓ Never lose a version again

$15/month - Plugin + Web included
```

### Target Message
```
Tired of:
- "Projet_Final_V2_Mix_FINAL_3.zip"?
- Losing the version your client loved?
- Collaborators overwriting your work?

AudioCollab = Git for your music projects.
```

---

## 11. Risques & Mitigations

### Risque 1: Plugin complexité
**Mitigation:** Phase 1 web-only valide le concept avant 6 mois de dev plugin

### Risque 2: Tone.js ≠ Plugins Pro
**Mitigation:** Message clair "Quick FX for rough mixes, use pro plugins for final"

### Risque 3: Users ne veulent pas payer
**Mitigation:** Beta pricing, early adopters discount, feedback loop

### Risque 4: Trop de features sociales distrayent
**Mitigation:** MVP lean, focus versioning, ajouter social progressivement

---

## 12. Success Metrics

### Phase 1 (Web MVP)
- 50+ beta signups
- 20+ active users (weekly)
- $500+ MRR
- 80%+ disent "je veux le plugin"

### Phase 2 (Plugin Launch)
- 200+ paying users
- $3000+ MRR
- <10% churn
- NPS > 40

### Phase 3 (Scale)
- 1000+ users
- $15k+ MRR
- Profitable (revenue > costs)
- Community active

---

## 13. Prochaines Étapes Concrètes

### Cette semaine:
1. Tester migrations DB
2. Créer API routes (commits, branches)
3. Ajouter FX chain (EQ, Comp, Reverb) à useAudioEngine

### Semaine prochaine:
4. Build versioning UI (commits list, branch selector)
5. Build FX controls UI (sliders dans mixer)
6. Intégrer upload dry stems + metadata

### Dans 2 semaines:
7. Beta test avec 5-10 users
8. Fix bugs critiques
9. Polish UI

### Dans 4-6 semaines:
10. Launch beta publique (20-30 users)
11. Collect feedback
12. Décision: build plugin ou pivot

---

## Notes Importantes

**Philosophie:**
- Launch rapide > Perfect product
- Valider concept > Build toutes les features
- Feedback users > Assumptions
- Simple & stable > Complexe & buggy

**Focus:**
- Versioning (core value)
- Collaboration (project-focused)
- PRO market (willingness to pay)

**Éviter:**
- Feature creep
- Social network tendencies
- Over-engineering
- Perfectionnisme qui retarde launch

---

**Document créé:** 2026-01-15
**Dernière mise à jour:** 2026-01-15
**Statut:** Vision active, Phase 1 en cours
