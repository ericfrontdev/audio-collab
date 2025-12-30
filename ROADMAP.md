# AudioCollab - Roadmap des fonctionnalités

## Fonctionnalités existantes

### Système de base
- ✅ Authentification (login/signup)
- ✅ Profils utilisateurs
- ✅ Feed principal avec posts
- ✅ Clubs
- ✅ Projets/Studios
- ✅ Real-time (posts, likes, commentaires, replies)
- ✅ Messagerie privée (asynchrone, 1-on-1)

### Pages existantes
- `/[locale]/profile/[username]` - Page de profil
- `/[locale]/clubs` - Liste des clubs
- `/[locale]/clubs/[slug]` - Page d'un club
- `/[locale]/projects` - Liste des projets
- `/[locale]/my-projects` - Mes projets
- `/[locale]/projects/[id]` - Détails d'un projet
- `/[locale]/projects/[id]/studio` - Interface studio
- `/[locale]/feed` - Feed principal
- `/[locale]/messages` - Messagerie privée (liste des conversations)
- `/[locale]/messages/[id]` - Conversation individuelle

---

## Nouvelles fonctionnalités à développer

### 1. ✅ Messagerie privée (TERMINÉE)
**Type:** Nouvelle fonctionnalité standalone
**Statut:** ✅ **TERMINÉE**

**Description:**
Système de messagerie privée 1-on-1 entre utilisateurs (asynchrone, comme email).

**Implémenté:**
- ✅ Tables `conversations` et `messages`
- ✅ Page `/[locale]/messages` avec liste des conversations
- ✅ Page `/[locale]/messages/[id]` pour conversation individuelle
- ✅ Badge de notifications avec compteur de messages non lus
- ✅ Marquer messages comme lus automatiquement
- ✅ Éditer/supprimer ses propres messages
- ✅ Recherche d'utilisateurs pour nouvelle conversation
- ✅ Sidebar de droite avec profil utilisateur

**Notes:**
- Messagerie asynchrone (pas real-time) - les messages apparaissent au refresh/navigation
- Limite de 2000 caractères par message
- Suppression définitive des messages (DELETE from DB)

---

### 2. Feed personnel
**Type:** Extension de la page profil existante
**Priorité:** Moyenne (permet le Repost/Sharing)
**Complexité:** Moyenne

**Description:**
Chaque utilisateur a son propre feed sur sa page de profil. Les autres utilisateurs peuvent publier sur ce feed (comme un "wall" Facebook).

**Besoins techniques:**
- Filtrage des posts par `profile_user_id` (utilisateur dont c'est le profil)
- Possibilité de poster sur le feed de quelqu'un d'autre
- Ajout d'un composant de feed sur `/[locale]/profile/[username]`
- Permissions: qui peut poster sur mon feed?

**Dépendances:** Aucune

---

### 3. Repost / Sharing
**Type:** Feature qui dépend d'autres fonctionnalités
**Priorité:** Moyenne
**Complexité:** Moyenne

**Description:**
Permettre aux utilisateurs de partager un post avec un autre utilisateur, soit via messagerie privée, soit sur leur feed personnel.

**Besoins techniques:**
- Bouton "Share" sur les posts
- Modal de sélection: partager en DM ou sur un feed
- Sélecteur d'utilisateur
- Référence au post original dans le message/post partagé
- Prévisualisation du post partagé

**Dépendances:**
- ⚠️ Nécessite **Messagerie privée** OU **Feed personnel**

---

### 4. Feed des clubs
**Type:** Extension des clubs existants
**Priorité:** Moyenne
**Complexité:** Faible

**Description:**
Chaque club a son propre feed où les membres peuvent poster du contenu spécifique au club.

**Besoins techniques:**
- Ajouter `club_id` aux posts (nullable)
- Filtrage des posts par club sur `/[locale]/clubs/[slug]`
- Composant CreatePost dans la page du club
- Permissions: seuls les membres peuvent poster dans le club

**Dépendances:** Aucune (les clubs existent déjà)

---

### 5. Système de retakes avec take folder
**Type:** Extension du studio existant
**Priorité:** Haute (feature core pour musiciens)
**Complexité:** Élevée

**Description:**
Système de gestion des prises (takes) dans le studio. Permet d'enregistrer plusieurs versions d'une même piste et de les organiser en dossiers.

**Besoins techniques:**
- Nouvelles tables `takes`, `take_folders`
- Interface d'enregistrement dans le studio
- Gestion des versions multiples
- Sélection de la "meilleure prise"
- Organisation en dossiers
- Lecture/comparaison des takes

**Dépendances:** Aucune (le studio existe déjà)

---

### 6. Mixer audio
**Type:** Extension du studio existant
**Priorité:** Haute (feature core pour musiciens)
**Complexité:** Très élevée

**Description:**
Interface de mixage audio dans le studio pour mixer les différentes pistes/takes ensemble.

**Besoins techniques:**
- Web Audio API
- Interface de mixer (faders, pan, mute, solo)
- Effets audio (EQ, compression, reverb, etc.)
- Routing audio
- Automation (volume, pan, etc.)
- Export du mix final
- Sauvegarde des paramètres de mix

**Dépendances:**
- Recommandé d'avoir le **Système de retakes** en place d'abord

---

## Ordre de développement suggéré

### Phase 1: Features sociales de base
1. ✅ ~~**Messagerie privée**~~ (TERMINÉE - débloque le Sharing)
2. **Feed des clubs** (faible complexité, ajoute de la valeur rapidement)
3. **Feed personnel** (alternative au messaging pour le Sharing)
4. **Repost/Sharing** (messaging déjà en place, peut être développé maintenant)

### Phase 2: Features studio/production
5. **Système de retakes** (feature core pour les musiciens)
6. **Mixer audio** (feature core, s'appuie sur les retakes)

---

## Notes importantes

- Presque toutes les features s'intègrent dans l'existant, sauf la messagerie privée
- Le Repost/Sharing ne peut pas être développé avant la messagerie privée OU le feed personnel
- Les features studio (retakes + mixer) sont indépendantes des features sociales
- Le mixer audio devrait idéalement être développé après le système de retakes
