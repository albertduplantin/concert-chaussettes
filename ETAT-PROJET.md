# Concert Chaussettes - Etat du projet

## Ce qui a ete fait

### Infrastructure
- Next.js 16.1.6 + TypeScript + Tailwind CSS v4 + Turbopack
- Drizzle ORM + Neon PostgreSQL (schema pousse, 20 genres musicaux seedes)
- shadcn/ui (16 composants installes)
- Code pousse sur GitHub : https://github.com/albertduplantin/concert-prive.git

### Authentification (custom, sans NextAuth client)
- NextAuth v5 beta installe mais on n'utilise PAS ses fonctions client (incompatibles Next.js 16)
- Systeme auth custom avec JWT signe via `jose` (HS256)
- Endpoints custom :
  - `POST /api/auth/login` - connexion (verifie bcrypt, cree JWT, pose cookie)
  - `POST /api/auth/register` - inscription (cree user + groupe/organisateur en DB)
  - `GET /api/auth/session` - retourne la session en decodant le JWT jose
  - `POST /api/auth/signout` - supprime le cookie (maxAge: 0)
- `getSession()` dans `src/lib/auth.ts` pour le cote serveur (pages/API routes)
- `useSession()` dans `src/components/providers.tsx` pour le cote client
- Middleware (`src/middleware.ts`) protege `/dashboard/*` et `/admin/*` avec jwtVerify
- Login/register utilisent `window.location.href` (pas router.push) pour forcer le rechargement du SessionProvider

### Pages et fonctionnalites
- **Landing page** (`/`) - presentation, CTA organisateur/groupe
- **Login** (`/login`) - formulaire connexion
- **Register** (`/register`) - formulaire inscription avec choix role (GROUPE/ORGANISATEUR)
- **Dashboard redirect** (`/dashboard`) - redirige selon le role
- **Dashboard Groupe** (`/dashboard/groupe`) - formulaire profil complet :
  - Nom, bio, genres musicaux (toggle badges), localisation
  - Videos YouTube (embed + ajout/suppression, max 3 free / 5 premium)
  - Contact (email, tel, site web)
- **Dashboard Organisateur** :
  - Recherche groupes (`/dashboard/organisateur`) - filtres nom, ville, departement, region, genres
  - Concerts (`/dashboard/organisateur/concerts`) - liste avec compteur freemium
  - Nouveau concert (`/dashboard/organisateur/concerts/new`) - formulaire creation
  - Detail concert (`/dashboard/organisateur/concerts/[id]`) - inscrits + liste d'attente
  - Contacts CRM (`/dashboard/organisateur/contacts`) - table auto-alimentee par inscriptions
  - Templates messages (`/dashboard/organisateur/messages`) - CRUD email/SMS/WhatsApp
- **Page publique concert** (`/concert/[slug]`) - avec formulaire inscription + liste d'attente auto

### API Routes
- `POST /api/auth/register` - inscription
- `POST /api/auth/login` - connexion
- `GET /api/auth/session` - session
- `POST /api/auth/signout` - deconnexion
- `PUT /api/groupe/profile` - mise a jour profil groupe
- `GET /api/groupes/search` - recherche groupes avec filtres
- `POST /api/concerts` - creation concert (avec limite freemium)
- `POST /api/inscriptions` - inscription invites (avec liste d'attente + auto CRM)
- `POST /api/messages/templates` - creation template message

### Limites freemium
| | FREE | PREMIUM |
|---|---|---|
| **Groupes** | 3 photos, 3 videos | 10 photos, 5 videos |
| **Organisateurs** | 3 concerts/an, 2 templates | Illimite |

### Base de donnees (Neon PostgreSQL)
- Connection string dans `.env.local` (PAS commite)
- Schema : users, subscriptions, genres, groupes, groupeGenres, organisateurs, concerts, inscriptions, contacts, messageTemplates, analytics, reports
- 20 genres musicaux seedes

## Ce qu'il reste a faire

### Deploiement Vercel (en cours)
- [ ] Aller sur vercel.com/new et importer le repo `albertduplantin/concert-prive`
- [ ] Ajouter les variables d'environnement :
  - `DATABASE_URL` = URL Neon (celle du .env.local)
  - `NEXTAUTH_SECRET` = `X7TNKUiDiLFN16C50jrgQ16kdeFq2/9JYceXCr+6t5g=`
  - NE PAS ajouter NEXTAUTH_URL (Vercel auto-detecte)
- [ ] Deployer et verifier que ca fonctionne
- [ ] Mettre a jour NEXTAUTH_URL dans .env.local avec l'URL Vercel si necessaire

### Bugs connus a verifier
- [ ] Tester la deconnexion (cookie signout corrige avec path + maxAge:0)
- [ ] Tester inscription en tant qu'organisateur (pas encore teste)
- [ ] Verifier que le middleware supprime bien les cookies corrompus (anciens tokens NextAuth)

### Fonctionnalites manquantes (plan original)
- [ ] Upload de photos pour les groupes (actuellement pas implemente, seulement les URLs)
- [ ] Interface Admin (`/admin`) - dashboard, gestion users, moderation, genres
- [ ] Systeme de signalement/moderation
- [ ] Analytics/stats (premium)
- [ ] Pages upgrade/pricing
- [ ] Integration Stripe (structure preparee dans le schema mais pas implementee)
- [ ] Badge verifie + boost pour groupes premium
- [ ] Branding custom pour organisateurs premium
- [ ] Export contacts
- [ ] Responsive design (a verifier/ameliorer)
- [ ] Tests

## Fichiers cles

| Fichier | Description |
|---------|-------------|
| `src/lib/auth.ts` | Config NextAuth + `getSession()` custom |
| `src/lib/db/schema.ts` | Schema complet Drizzle (12 tables) |
| `src/lib/db/index.ts` | Client Drizzle + Neon |
| `src/middleware.ts` | Protection routes avec jwtVerify |
| `src/components/providers.tsx` | SessionProvider custom + useSession |
| `src/components/layout/header.tsx` | Header avec menu connecte/deconnecte |
| `.env.local` | Variables d'env (PAS commite) |
| `drizzle.config.ts` | Config Drizzle (utilise dotenv pour .env.local) |

## Variables d'environnement (.env.local)

```
DATABASE_URL=postgresql://neondb_owner:npg_vOPyeWTc7Q6U@ep-gentle-field-agox6mch-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NEXTAUTH_SECRET=change-me-to-a-random-secret
NEXTAUTH_URL=http://localhost:3000
```

## Commandes utiles

```bash
npm run dev              # Serveur dev (port 3000)
npx drizzle-kit push     # Pousser le schema vers Neon
npx drizzle-kit studio   # Interface Drizzle Studio
npx tsx src/lib/db/seed.ts  # Seeder les genres
npm run build            # Build production
```
