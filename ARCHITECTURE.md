# Architecture - Musique Pour Tous

## 🎯 Vision Globale

**Plateforme de streaming musical gratuite** avec:
- Lecteur public (sans auth) - une musique à la fois
- Authentification GitHub OAuth
- Profils utilisateurs + Profils artistes (séparés)
- Upload de musiques par artistes → Cloudinary
- Téléchargement des musiques (auth requis)
- Gestion complète via Cosmic CMS + Admin panel

---

## 🏗️ Architecture Technique

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 15 (Full Stack)              │
├─────────────────────────────────────────────────────────┤
│  Frontend (React)          │  Backend (Next.js API)     │
│  ├─ Public Pages          │  ├─ Auth Routes            │
│  │  ├─ /                  │  │  └─ /api/auth/[...]     │
│  │  ├─ /albums            │  ├─ Upload Routes          │
│  │  ├─ /artists           │  │  └─ /api/upload         │
│  │  └─ Player             │  └─ Download Routes        │
│  │                        │     └─ /api/download       │
│  └─ Protected Pages       │                            │
│     ├─ /dashboard         │  Middleware                │
│     ├─ /dashboard/artist  │  ├─ Session validation    │
│     └─ /admin             │  └─ Role checking         │
└─────────────────────────────────────────────────────────┘
         ↓                         ↓
    ┌─────────────────────────────────────┐
    │   Data Layer & Services             │
    ├─────────────────────────────────────┤
    │ • Cosmic CMS (metadata)             │
    │ • PostgreSQL/Render (sessions)      │
    │ • Cloudinary (audio files)          │
    │ • NextAuth.js (OAuth)               │
    └─────────────────────────────────────┘
```

---

## 📊 Modèles de Données

### 1. **NextAuth Tables** (PostgreSQL via Prisma)
```prisma
User
├─ id (PK)
├─ email (unique)
├─ name
├─ image
├─ emailVerified
├─ createdAt
└─ relations:
   ├─ accounts []
   ├─ sessions []
   └─ artistProfile (optional, 0..1)

Account (OAuth)
├─ userId (FK)
├─ provider (github)
├─ providerAccountId
└─ access/refresh tokens

Session
├─ sessionToken (unique)
├─ userId (FK)
└─ expires

ArtistProfile
├─ id (PK)
├─ userId (FK, unique)
├─ name (stage name)
├─ bio
├─ avatar (Cloudinary URL)
├─ verified (boolean, admin approval)
├─ createdAt
└─ updatedAt
```

### 2. **Cosmic CMS Objects**

#### Albums
```
- title (text)
- description (text)
- cover_image (image)
- release_date (date)
- artist (reference to Artists)
- created_at (date)
```

#### Artists
```
- name (text)
- biography (text)
- image (image)
- website (text)
- created_at (date)
```

#### Tracks
```
- title (text)
- duration (number, seconds)
- artist (reference)
- album (reference)
- cloudinary_public_id (text, for streaming)
- cloudinary_duration (number, from Cloudinary)
- cover_image (image)
- uploaded_by (text, user email)
- uploaded_from (enum: admin|artist)
- is_public (boolean)
- created_at (date)
```

#### Playlists
```
- title (text)
- description (text)
- cover_image (image)
- tracks (array reference to Tracks)
- created_by (text, user email)
- is_public (boolean)
- created_at (date)
```

---

## 🔐 Authentification & Autorisation

### Flow d'authentification
```
1. User clique "Login with GitHub"
   ↓
2. NextAuth OAuth flow (GitHub)
   ↓
3. User créé en PostgreSQL (via Prisma)
   ↓
4. Session créée (JWT dans cookie)
   ↓
5. Redirect vers /dashboard
```

### Rôles & Permissions

| Rôle | Routes Accessibles | Permissions |
|------|-------------------|------------|
| **Public** (no auth) | `/`, `/albums`, `/artists` | Lire musiques, écouter |
| **User** (auth) | `/dashboard`, `/download` | Créer playlists, télécharger |
| **Artist** (user + profil) | `/dashboard/artist`, `/api/upload` | Uploader musiques |
| **Admin** | `/admin/*` | Modérer, approuver artistes |

### Middleware
```typescript
// /middleware.ts
- Vérifier session (optionnel, certaines routes)
- Vérifier artistProfile (routes /artist/*)
- Vérifier admin role (routes /admin/*)
```

---

## 🎵 Flux - Lecteur Audio (Public)

```
1. User visite / (homepage)
   ↓
2. Fetch albums + tracks depuis Cosmic
   ↓
3. Affiche liste albums/artistes
   ↓
4. User clique une musique
   ↓
5. Fetch Cloudinary streaming URL
   ↓
6. Audio joue dans <audio> HTML5
   ↓
7. Affiche: titre, artiste, durée, contrôles play/pause
```

**Technologie:**
- `<audio>` HTML5 natif (pas de libraire externe)
- URL streaming Cloudinary: `https://res.cloudinary.com/{cloud}/video/upload/{public_id}`

---

## 📤 Flux - Upload Musique (Artist)

```
1. Artist loggé, go to /dashboard/artist/upload
   ↓
2. Check si user a artistProfile (si non, créer profil d'abord)
   ↓
3. Affiche form: titre, album, cover image, fichier MP3
   ↓
4. User clique "Upload"
   ↓
5. Frontend: Upload file vers Cloudinary (unsigned upload)
   ↓
6. Cloudinary retourne public_id + duration
   ↓
7. Frontend: POST /api/upload
      Body: { title, album_id, cloudinary_public_id, duration, cover }
   ↓
8. Backend: 
   - Verify session (user doit être authentifié)
   - Check artistProfile.verified (artiste approuvé par admin)
   - Create Track dans Cosmic CMS
   ↓
9. Success → Redirect to /dashboard/artist/tracks
```

**Cloudinary Configuration:**
- Unsigned upload (public preset)
- Allowed types: `.mp3`, `.wav`, `.flac`
- Folder: `musique-pour-tous/tracks/`

---

## 📥 Flux - Téléchargement Musique

```
1. User clique "Download" sur une musique
   ↓
2. Check session (auth requis)
   ↓
3. Frontend: GET /api/download?track_id=xxx
   ↓
4. Backend:
   - Verify session
   - Verify track exists in Cosmic
   - Generate Cloudinary delivery URL
   - Log download (optionnel)
   ↓
5. Redirect to Cloudinary URL
   ↓
6. Browser télécharge le fichier MP3
```

---

## 🛠️ Structure du Projet

```
musique-pour-tous/
├── app/
│   ├── layout.tsx                    # Root layout + SessionProvider
│   ├── page.tsx                      # Homepage (lecteur public)
│   ├── albums/
│   │   └── page.tsx                  # Albums gallery
│   ├── artists/
│   │   ├── page.tsx                  # Artists directory
│   │   └── [slug]/
│   │       └── page.tsx              # Artist detail page
│   ├── dashboard/
│   │   ├── layout.tsx                # Protected layout
│   │   ├── page.tsx                  # User dashboard
│   │   ├── artist/
│   │   │   ├── page.tsx              # Artist profile mgmt
│   │   │   └── upload.tsx            # Upload form
│   │   └── downloads/
│   │       └── page.tsx              # Download history
│   ├── admin/
│   │   ├── layout.tsx                # Protected layout (admin only)
│   │   ├── page.tsx                  # Admin dashboard
│   │   ├── artists/
│   │   │   └── page.tsx              # Approve artists
│   │   └── tracks/
│   │       └── page.tsx              # Moderate tracks
│   └── api/
│       ├── auth/[...nextauth]/
│       │   └── route.ts              # NextAuth
│       ├── upload/
│       │   └── route.ts              # Upload handler
│       └── download/
│           └── route.ts              # Download handler
├── components/
│   ├── MusicPlayer.tsx               # Audio player
│   ├── AuthButton.tsx                # Login/logout
│   ├── MusicUpload.tsx               # Upload widget
│   ├── AlbumCard.tsx                 # Album display
│   └── ArtistCard.tsx                # Artist display
├── lib/
│   ├── auth.ts                       # NextAuth config
│   ├── cosmic.ts                     # Cosmic API functions
│   ├── cloudinary.ts                 # Cloudinary functions
│   └── utils.ts                      # Helper functions
├── middleware.ts                     # NextAuth middleware
├── prisma/
│   ├── schema.prisma                 # DB schema
│   └── seed.ts                       # DB seed (optional)
├── .env.local                        # Local vars
├── .env.production                   # Production vars (Render)
├── package.json                      # Dependencies
└── render.yaml                       # Render deployment config
```

---

## 📦 Dépendances Requises

```json
{
  "dependencies": {
    "next": "15.2.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@cosmicjs/sdk": "^1.4.0",
    "next-auth": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "next-cloudinary": "^5.17.0",
    "cloudinary": "^2.1.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "typescript": "^5",
    "tailwindcss": "^4"
  }
}
```

---

## ⚙️ Variables d'Environnement

```env
# Cosmic CMS
COSMIC_BUCKET_SLUG=my-project-production-095cda80-4e26-11f1-81e4-9b36d73222fd
COSMIC_READ_KEY=I4WPq2qdpekjdrBa1wkgdD0htIaAdOECCBPitkpqa2fZX8HWQ0
COSMIC_WRITE_KEY=xrTYhV39bUwd7PXibr00EPzz53ItdhpQa4KaCp7ytaI2csAbMI

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=root
CLOUDINARY_API_KEY=988619685267499
CLOUDINARY_API_SECRET=FQdcld67-81E61aVxNCPDOslq4Y

# PostgreSQL (Render)
DATABASE_URL=postgresql://user:pass@host/db

# NextAuth
NEXTAUTH_SECRET=generated-secret-key-here
NEXTAUTH_URL=https://musique-pour-tous.onrender.com

# OAuth GitHub
GITHUB_ID=xxx
GITHUB_SECRET=xxx
```

---

## 📋 Ordre d'Implémentation Optimal

### **Phase 1: Setup Foundation** ✅
- [ ] 1. Modifier `package.json` + installer deps
- [ ] 2. Créer `prisma/schema.prisma`
- [ ] 3. Créer `.env.local` avec clés
- [ ] 4. Setup Prisma + migrate DB
- [ ] 5. Créer `middleware.ts` (basique)

### **Phase 2: Authentication** 🔐
- [ ] 6. Créer `/app/api/auth/[...nextauth]/route.ts`
- [ ] 7. Créer `components/AuthButton.tsx`
- [ ] 8. Modifier `/app/layout.tsx` + ajouter SessionProvider
- [ ] 9. Tester login/logout

### **Phase 3: Public Pages (Lecteur)** 🎵
- [ ] 10. Créer `/lib/cosmic.ts` (fetch albums, tracks)
- [ ] 11. Créer `components/MusicPlayer.tsx` (lecteur HTML5)
- [ ] 12. Créer `/app/page.tsx` (homepage + player)
- [ ] 13. Créer `/app/albums/page.tsx` (albums gallery)
- [ ] 14. Créer `/app/artists/page.tsx` (artists directory)

### **Phase 4: Upload (Artists)** 📤
- [ ] 15. Créer `/lib/cloudinary.ts` (upload functions)
- [ ] 16. Créer `components/MusicUpload.tsx` (Cloudinary widget)
- [ ] 17. Créer `/app/api/upload/route.ts` (handler)
- [ ] 18. Créer `/app/dashboard/artist/upload.tsx` (form)
- [ ] 19. Ajouter ArtistProfile management page

### **Phase 5: Download (Auth)** 📥
- [ ] 20. Créer `/app/api/download/route.ts` (handler)
- [ ] 21. Créer `/app/dashboard/downloads/page.tsx`

### **Phase 6: Admin Panel** ⚙️
- [ ] 22. Créer `/app/admin/artists/page.tsx` (approve artistes)
- [ ] 23. Créer `/app/admin/tracks/page.tsx` (moderate musiques)
- [ ] 24. Ajouter admin role check

### **Phase 7: Deployment** 🚀
- [ ] 25. Créer `render.yaml` (Render config)
- [ ] 26. Setup Render PostgreSQL
- [ ] 27. Git push + Render auto-deploy
- [ ] 28. Configurer domaine DNS

### **Phase 8: Polish** ✨
- [ ] 29. Tests (signup, upload, download, player)
- [ ] 30. Seed données de démo (Cosmic)
- [ ] 31. Performance optimisation

---

## 🔄 Dépendances Entre Modules

```
┌─ Prisma/PostgreSQL ──────────────┐
│                                   │
├─→ NextAuth Setup ────────────────┤
│                                   │
├─→ AuthButton                      │
│   └─→ MusicPlayer                │
│       └─→ Cosmic (fetch)         │
│                                   │
├─→ MusicUpload ──────────────────┤
│   ├─→ Cloudinary (upload)        │
│   └─→ /api/upload (handler)      │
│       └─→ Cosmic (create)        │
│                                   │
└─→ /api/download ────────────────┘
    └─→ Cloudinary (delivery)
```

---

## ✅ Critères de Succès

- [ ] Page d'accueil charge musiques depuis Cosmic
- [ ] Lecteur joue une musique (Cloudinary URL)
- [ ] Login/logout fonctionne
- [ ] Upload musique crée track dans Cosmic
- [ ] Musique uploadée est jouable dans lecteur
- [ ] Téléchargement fonctionne (auth requis)
- [ ] Admin peut approuver artistes
- [ ] Domaine musique-pour-tous.net pointe vers site
- [ ] Pas d'erreurs console/serveur
- [ ] Performance acceptable (<3s load)

---

## 🐛 Points de Validation

Avant chaque phase:
1. Code compile sans erreurs TypeScript
2. Env vars sont correctes
3. DB migrations réussissent
4. Routes sont accessibles
5. Pas de console errors

---

## 📞 Support & Troubleshooting

- Cosmic CMS: Check bucket slug + keys
- Cloudinary: Verify upload preset + API keys
- PostgreSQL: Check DATABASE_URL
- GitHub OAuth: Verify GITHUB_ID + GITHUB_SECRET
- Render: Check logs pour deployment errors
