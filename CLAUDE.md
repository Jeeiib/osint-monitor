# OSINT Monitoring Platform

## Description
Plateforme de monitoring OSINT en temps réel pour suivre les événements mondiaux : conflits, catastrophes naturelles, trafic aérien/maritime, et intelligence sociale.

## Stack Technique
- **Framework**: Next.js 14+ (App Router)
- **Carte**: Mapbox GL JS + react-map-gl
- **UI**: Tailwind CSS + shadcn/ui
- **État**: Zustand
- **Auth & DB**: Supabase (région EU)
- **Scraping**: API Routes + Cheerio
- **Analytics**: Umami (self-hosted)
- **i18n**: next-intl (FR/EN)
- **Déploiement**: Vercel

## Structure du Projet
```
/src
  /app                 # App Router Next.js
    /[locale]          # Routes internationalisées
    /api               # API Routes (scraping, proxies)
  /components
    /map               # Composants carte Mapbox
    /ui                # Composants shadcn/ui
    /feed              # Panel Social Intel
    /alerts            # Système d'alertes
    /filters           # Filtres et presets
  /lib
    /sources           # Connecteurs sources de données
    /hooks             # Custom hooks
    /stores            # Stores Zustand
    /utils             # Utilitaires
  /types               # Types TypeScript
/docs
  /plans               # Documents de design
/public
  /sounds              # Sons d'alertes
  /locales             # Fichiers de traduction
```

## Commandes
```bash
npm run dev          # Serveur développement
npm run build        # Build production
npm run start        # Serveur production
npm run lint         # Linting
npm run test         # Tests
```

## Variables d'Environnement
```env
# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# APIs externes (côté serveur uniquement)
OPENSKY_USERNAME=
OPENSKY_PASSWORD=
```

## Conventions de Code

### TypeScript
- Strict mode activé
- Types explicites pour les props et retours de fonctions
- Interfaces pour les objets, types pour les unions

### Composants
- Composants fonctionnels avec hooks
- Props destructurées
- Fichiers: `ComponentName.tsx` (PascalCase)

### Styles
- Tailwind CSS pour tout le styling
- Classes utilitaires, pas de CSS custom sauf exception
- Dark mode par défaut (pas de theme switching pour l'instant)

### État
- Zustand pour l'état global (filtres, données temps réel)
- useState/useReducer pour l'état local
- Pas de prop drilling > 2 niveaux

### API Routes
- Toutes les clés API côté serveur
- Rate limiting sur les endpoints de scraping
- Validation des inputs avec Zod

### Internationalisation
- Toutes les strings dans `/public/locales`
- Utiliser `useTranslations()` de next-intl
- Format: `namespace.key`

## Sources de Données

### APIs Gratuites
- **Séismes**: USGS (earthquake.usgs.gov)
- **Avions**: OpenSky Network (opensky-network.org)
- **Bateaux**: aisstream.io (WebSocket)
- **Catastrophes**: GDACS (gdacs.org)

### Scraping
- **Conflits**: LiveUAMap, GeoConfirmed
- **Twitter**: Via Twint ou alternatives
- Rate limiting obligatoire
- Respecter les robots.txt

## RGPD
- Données utilisateur en EU (Supabase Frankfurt)
- Bannière consentement obligatoire
- Export/suppression données dans settings
- Umami sans cookies pour analytics

## Performance
- Clustering des markers pour éviter surcharge
- Lazy loading des données hors viewport
- Cache SWR/React Query pour les requêtes
- WebSocket pour les données temps réel (bateaux)

## Git
- Branches: `main`, `develop`, `feature/*`, `fix/*`
- Commits conventionnels: `feat:`, `fix:`, `docs:`, `refactor:`
- PR obligatoire pour merge sur main
