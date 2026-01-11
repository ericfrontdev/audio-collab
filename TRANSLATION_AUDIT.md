# 🌐 Audit des Traductions - AudioCollab

**Date:** 2026-01-09
**Fichiers analysés:** 127
**Fichiers nécessitant des traductions:** 57 (45%)

---

## 📊 Résumé par Catégorie

### 🔴 Priorité HAUTE - Pages principales (14 fichiers)
- `app/[locale]/page.tsx` - Page d'accueil
- `app/[locale]/dashboard/page.tsx` - Dashboard
- `app/[locale]/explore/page.tsx` - Explorer les projets
- `app/[locale]/messages/page.tsx` - Messagerie
- `app/[locale]/notifications/page.tsx` - Notifications
- `app/[locale]/settings/page.tsx` - Paramètres
- `app/[locale]/profile/[username]/page.tsx` - Profil utilisateur
- `app/[locale]/projects/new/page.tsx` - Nouveau projet
- `app/[locale]/onboarding/page.tsx` - Onboarding
- `app/[locale]/clubs/[slug]/page.tsx` - Page de club
- `app/[locale]/clubs/[slug]/discussions/new/page.tsx` - Nouvelle discussion
- `app/[locale]/clubs/[slug]/challenges/[challengeId]/page.tsx` - Détails challenge
- `app/[locale]/admin/page.tsx` - Admin dashboard
- `app/[locale]/admin/clubs/new/page.tsx` - Nouveau club

### 🟠 Priorité MOYENNE - Composants principaux (20 fichiers)

**Studio (7 fichiers):**
- `components/studio/StudioView.tsx` - Vue principale studio
- `components/studio/TransportControls.tsx` - Contrôles transport
- `components/studio/UploadTrackModal.tsx` - Upload de pistes
- `components/studio/TakesManagerModal.tsx` - Gestion des takes
- `components/studio/AddCommentModal.tsx` - Ajout commentaires
- `components/studio/TrackContextMenu.tsx` - Menu contextuel
- `components/studio/TrackList.tsx` - Liste des pistes

**Project Hall (5 fichiers):**
- `components/projectHall/ProjectHallFeed.tsx` - Feed de discussion
- `components/projectHall/CoverImageUpload.tsx` - Upload cover
- `components/projectHall/ProjectInfoCard.tsx` - Infos projet
- `components/projectHall/ProjectTimelineCard.tsx` - Timeline
- `components/projectHall/HallPostCard.tsx` - Carte de post

**Feed Social (8 fichiers):**
- `components/feed/CreatePostCard.tsx` - Création de posts
- `components/feed/FeedPost.tsx` - Affichage posts
- `components/feed/Comment.tsx` - Commentaires
- `components/feed/CommentReply.tsx` - Réponses
- `components/feed/PostActions.tsx` - Actions posts
- `components/feed/ShareModal.tsx` - Modal partage
- `components/feed/hooks/useComments.ts` - Hook commentaires
- `components/feed/hooks/usePostLike.ts` - Hook likes

### 🟡 Priorité BASSE - Composants secondaires (23 fichiers)

**Messaging (4 fichiers):**
- `components/messaging/ChatView.tsx`
- `components/messaging/ConversationsList.tsx`
- `components/messaging/MessageItem.tsx`
- `components/messaging/NewMessageButton.tsx`

**Projects (4 fichiers):**
- `components/projects/ClubProjectsList.tsx`
- `components/projects/NewProjectForm.tsx`
- `components/projects/ProjectDiscussion.tsx`
- `components/projects/ProjectStemsList.tsx`

**Admin (2 fichiers):**
- `components/admin/CreateClubForm.tsx`
- `components/admin/EditClubForm.tsx`

**Navigation & UI (6 fichiers):**
- `components/navigation/Sidebar.tsx`
- `components/cards/QuickActions.tsx`
- `components/cards/UserProfileCard.tsx`
- `components/clubs/ClubTabs.tsx`
- `components/clubs/ReplyForm.tsx`
- `components/WaitlistForm.tsx`

**Autres (7 fichiers):**
- `components/profile/ProfilePosts.tsx`
- `components/project/ProjectChat.tsx`
- `components/project/ProjectWorkspace.tsx`
- `components/studio/WaveformTrack.tsx`
- Test pages (admin-test, test-db)

---

## 🎯 Plan de Migration Recommandé

### Phase 1: Pages principales (1-2 jours)
1. Page d'accueil
2. Dashboard
3. Explorer
4. Profil utilisateur
5. Messages
6. Paramètres

### Phase 2: Studio (1 jour)
1. StudioView
2. TransportControls
3. Modals (Upload, Takes, Comments)
4. TrackList & menus

### Phase 3: Project Hall (0.5 jour)
1. Feed de discussion
2. Upload de cover
3. Cards d'information

### Phase 4: Feed social (1 jour)
1. CreatePostCard
2. Posts & commentaires
3. ShareModal
4. Hooks

### Phase 5: Composants secondaires (1 jour)
1. Messaging
2. Projects
3. Admin
4. Navigation

---

## 🔧 Patterns de Traduction Détectés

### Textes les plus fréquents à traduire:

**Boutons:**
- "Upload", "Delete", "Edit", "Save", "Cancel", "Send", "Share"

**Placeholders:**
- "Type a message...", "Enter your email", "Search...", "Write a comment..."

**Toast Messages:**
- Success: "...successfully!", "Created!", "Updated!"
- Errors: "Failed to...", "Cannot...", "Please..."

**Labels:**
- "Dashboard", "Projects", "Messages", "Settings", "Profile"

---

## 📝 Étapes pour chaque fichier

Pour chaque fichier, il faut:

1. **Ajouter l'import:**
   ```tsx
   import { useTranslations } from 'next-intl';
   // OU pour server components
   import { getTranslations } from 'next-intl/server';
   ```

2. **Initialiser le hook:**
   ```tsx
   const t = useTranslations('namespace');
   // OU
   const t = await getTranslations('namespace');
   ```

3. **Remplacer les textes:**
   ```tsx
   // Avant
   <button>Save</button>

   // Après
   <button>{t('save')}</button>
   ```

4. **Ajouter les traductions dans:**
   - `messages/en.json`
   - `messages/fr.json`

---

## 💡 Recommandations

1. **Commencer par les pages principales** pour un impact immédiat
2. **Créer des namespaces clairs** dans les fichiers de traduction
3. **Utiliser des clés descriptives** (ex: `studio.upload.selectFile` au lieu de `upload`)
4. **Grouper les traductions** par fonctionnalité
5. **Tester chaque section** après migration

---

## 📦 Structure recommandée des namespaces

```json
{
  "common": { /* Textes communs */ },
  "nav": { /* Navigation */ },
  "auth": { /* Authentification */ },
  "projects": { /* Projets */ },
  "projectHall": { /* Hall du projet */ },
  "studio": { /* Studio */ },
  "feed": { /* Feed social */ },
  "messaging": { /* Messagerie */ },
  "admin": { /* Administration */ },
  "clubs": { /* Clubs */ },
  "profile": { /* Profil */ },
  "notifications": { /* Notifications */ },
  "settings": { /* Paramètres */ }
}
```

---

**Prochaine étape:** Commencer par la Phase 1 (Pages principales)
