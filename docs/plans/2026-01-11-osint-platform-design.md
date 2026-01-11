# OSINT Monitoring Platform — Design Document

**Date**: 2026-01-11
**Statut**: Validé
**Auteur**: Jean-Baptiste

---

## 1. Vue d'ensemble

### 1.1 Objectif
Plateforme de monitoring OSINT (Open Source Intelligence) en temps réel permettant de suivre les événements mondiaux : conflits géopolitiques, catastrophes naturelles, trafic aérien/maritime, et intelligence sociale.

### 1.2 Usage
- Usage personnel (dashboard de veille)
- Projet portfolio
- Partage avec réseau personnel

### 1.3 Déploiement
- Hébergement : Vercel
- Base de données : Supabase (région EU - Frankfurt)
- Analytics : Umami (self-hosted)

---

## 2. Stack Technique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| **Framework** | Next.js 14+ (App Router) | SSR, API routes, parfait pour Vercel |
| **Carte** | Mapbox GL JS + react-map-gl | Performance WebGL, style dark natif |
| **UI** | Tailwind CSS + shadcn/ui | Dark mode natif, composants pro |
| **État global** | Zustand | Léger, simple, réactif |
| **Auth & DB** | Supabase | Auth gratuite, PostgreSQL, région EU |
| **Scraping** | API Routes Next.js + Cheerio | Scraping côté serveur, pas de CORS |
| **Analytics** | Umami (self-hosted) | RGPD compliant, pas de cookies |
| **i18n** | next-intl | Internationalisation FR/EN |
| **Temps réel** | WebSockets + Polling | Mise à jour auto sans refresh |

---

## 3. Sources de Données

### 3.1 Catastrophes Naturelles
| Source | Type | URL | Usage |
|--------|------|-----|-------|
| USGS Earthquake API | REST API | earthquake.usgs.gov | Séismes mondiaux |
| EMSC | API | emsc-csem.org | Séismes Europe + témoignages |
| GDACS | RSS/API | gdacs.org | Multi-catastrophes (tsunamis, cyclones) |

### 3.2 Trafic Aérien
| Source | Type | Limite gratuite |
|--------|------|-----------------|
| OpenSky Network | REST API | 4000 requêtes/jour |
| ADS-B Exchange | Scraping | Non filtré (militaires inclus) |

### 3.3 Trafic Maritime
| Source | Type | Avantage |
|--------|------|----------|
| aisstream.io | WebSocket | Gratuit, temps réel |
| AISHub | API | Gratuit si contribution |

### 3.4 Géopolitique/Conflits
| Source | Type | Contenu |
|--------|------|---------|
| LiveUAMap | Scraping | Carte temps réel conflits |
| GeoConfirmed | Scraping | Événements géolocalisés vérifiés |
| ACLED | API | Données académiques conflits |

### 3.5 Social Media Intel
| Source | Type | Usage |
|--------|------|-------|
| Twint | Scraping Python | Twitter sans API |
| RSS feeds | RSS | Comptes OSINT fiables |

### 3.6 Comptes Twitter OSINT à suivre
**Conflits**: @ELINTNews, @sentdefender, @OSINTdefender, @IntelCrab, @GeoConfirmed, @Liveuamap, @Flash_news_ua
**Catastrophes**: @EarthquakeBot, @ABOROZNA, @NWS, @volaborozna
**Aviation**: @AircraftSpots, @RadarBox24, @intel_sky
**Maritime**: @MT_Anderson

---

## 4. Architecture Interface

### 4.1 Layout Principal
```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER                                                             │
│  [Logo] [Recherche ⌘K] [Stats live] [Presets] [Lang] [Settings]    │
├────────────────────────────────────┬────────────────────────────────┤
│                                    │  PANEL DROIT (rétractable)     │
│                                    │  ┌────────────────────────────┐│
│                                    │  │ Social Intel (Twitter)     ││
│         CARTE MAPBOX (70%)         │  │ - Feed temps réel filtrable││
│         Style: Dark                │  ├────────────────────────────┤│
│                                    │  │ Alertes récentes           ││
│  [Filtres catégories en overlay]   │  │ - Par niveau de gravité    ││
│                                    │  └────────────────────────────┘│
├────────────────────────────────────┴────────────────────────────────┤
│  TIMELINE                                                           │
│  [Aujourd'hui] [24h] [7j] [30j]    ◀ ════●════════════ [● LIVE]    │
│  📊 Stats période: X événements | Y séismes | Z incidents           │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Responsive
- **Desktop**: Layout complet
- **Tablette**: Panel droit en overlay/drawer
- **Mobile**: Carte fullscreen + bottom sheet pour feeds

---

## 5. Système de Filtrage

### 5.1 Filtres par Catégorie (toggles)
| Catégorie | Couleur | Icône |
|-----------|---------|-------|
| Conflits | Rouge | Cercle pulse |
| Séismes | Orange | Cercle (taille = magnitude) |
| Avions | Bleu | Avion orienté |
| Bateaux | Cyan | Bateau orienté |
| Météo | Vert | Icône selon type |

### 5.2 Filtre par Importance
Slider: `[Tout] ────●──── [Majeur uniquement]`
- Séismes: masquer < 4.0 en mode majeur
- Conflits: masquer incidents mineurs
- Avions: que militaires/gouvernementaux

### 5.3 Presets Prédéfinis
| Nom | Filtres activés |
|-----|-----------------|
| 🔴 Conflits | Conflits + Avions militaires + Twitter géopol |
| 🟠 Catastrophes | Séismes + Météo + Twitter alertes |
| 🔵 Trafic | Avions + Bateaux (tous) |
| ⚪ Tout | Tout activé, importance moyenne |
| ⚫ Minimal | Événements majeurs uniquement |

### 5.4 Presets Custom
- Sauvegarde en localStorage (non connecté)
- Sauvegarde Supabase (connecté)

---

## 6. Composants Carte

### 6.1 Markers
- Couleur selon catégorie
- Animation pulse si événement < 1h
- Taille variable selon importance (ex: magnitude séisme)

### 6.2 Clustering
Zoom arrière → points regroupés avec compteur
Clic sur cluster → zoom sur la zone

### 6.3 Popup au clic
```
┌────────────────────────────────┐
│ 🔴 [Type événement]            │
│ [Localisation]                 │
│ [Temps relatif]                │
│                                │
│ Source: [@compte]              │
│ Confiance: ⭐⭐⭐              │
│                                │
│ [Voir source] [Zoom +]         │
└────────────────────────────────┘
```

### 6.4 Mode Focus Région
Clic droit/long press → option "Focus sur cette région"
→ Filtre tous les feeds pour cette zone

---

## 7. Panel Social Intel

### 7.1 Structure
- Header avec filtres par thème
- Liste de tweets avec:
  - Pastille couleur = catégorie
  - Bouton "Voir sur carte"
  - Engagement (likes, RT, replies)
- Auto-refresh configurable (30s, 1min, 5min)
- Indicateur dernière mise à jour

### 7.2 Liaison Carte ↔ Feed
- Clic marker → highlight tweet correspondant
- Clic tweet → zoom sur localisation

---

## 8. Timeline & Historique

### 8.1 Raccourcis Temporels
`[Aujourd'hui] [24h] [7 jours] [30 jours]`

### 8.2 Slider
Navigation précise dans le temps avec bouton "LIVE" pour revenir au temps réel

### 8.3 Stats de Période
Résumé dynamique des événements sur la période sélectionnée

### 8.4 Mode Stats
24h rolling par défaut (pas de reset brutal à minuit)

---

## 9. Système d'Alertes

### 9.1 Niveaux
| Niveau | Critère | Comportement |
|--------|---------|--------------|
| 🔴 Critique | Séisme >6.0, attaque majeure | Son + popup + push |
| 🟠 Important | Séisme 4-6, incident confirmé | Toast + push |
| 🟡 Notable | Séisme <4, non confirmé | Toast discret |

### 9.2 Configuration
- Sons: ON/OFF + volume
- Push navigateur: ON/OFF
- Seuils personnalisables par catégorie

### 9.3 Sons
Plusieurs options à tester (radar, sonar, notification, alerte militaire)

---

## 10. Recherche

### 10.1 Raccourci
`⌘K` / `Ctrl+K` pour ouvrir

### 10.2 Types de recherche
- 📍 Lieux (géocodage)
- ✈️ Vols (par numéro)
- 🚢 Navires (par nom, IMO, MMSI)
- 📰 Événements récents

---

## 11. Statistiques Dashboard

### 11.1 Header (toujours visible)
`📊 Live: 🔴 12 incidents | 🟠 8 séismes | ✈️ 847 | 🚢 2.3K`

### 11.2 Panel détaillé (au clic)
- Breakdown par catégorie
- Top zones actives
- Compteurs militaires identifiés

---

## 12. Comptes Utilisateur

### 12.1 Authentification
Supabase Auth avec:
- Google
- GitHub
- Email/Password

### 12.2 Données synchronisées
- Presets personnalisés
- Préférences (langue, fuseau, notifications)
- Historique de recherche (optionnel)

---

## 13. Settings

### 13.1 Sections
- 👤 Compte (connexion, déconnexion)
- 🌍 Langue (FR/EN)
- 🕐 Fuseau horaire (auto ou manuel)
- 🔔 Notifications (sons, push, seuils)
- 🎨 Apparence (thème, style carte)
- 💾 Presets sauvegardés
- 🔐 Données personnelles (RGPD)

---

## 14. Internationalisation

### 14.1 Langues
- 🇫🇷 Français
- 🇬🇧 English

### 14.2 Détection
Automatique via navigateur, modifiable dans settings

### 14.3 Fuseau Horaire
- Détection auto via `Intl.DateTimeFormat`
- Toutes les heures en heure locale
- Option UTC pour les puristes

---

## 15. Conformité RGPD

### 15.1 Bannière Consentement
Au premier accès avec options:
- Accepter tout
- Personnaliser
- Refuser non-essentiels

### 15.2 Catégories Cookies
| Type | Description | Obligatoire |
|------|-------------|-------------|
| Essentiels | Session, langue | Oui |
| Fonctionnels | Presets, filtres | Non |
| Analytiques | Umami (sans cookies) | Non |

### 15.3 Pages Légales
- Politique de confidentialité
- Mentions légales
- CGU

### 15.4 Droits Utilisateur
- Télécharger ses données (export JSON)
- Supprimer son compte
- Modifier ses informations

### 15.5 Bonnes Pratiques
- Pas de tracking tiers
- Données en EU (Supabase Frankfurt)
- Chiffrement données sensibles
- Suppression réelle (pas désactivation)

---

## 16. Analytics (Umami)

### 16.1 Hébergement
Self-hosted sur Vercel (même compte)

### 16.2 Métriques
- Visiteurs uniques
- Pages vues
- Temps moyen
- Sources de trafic
- Géolocalisation (pays)
- Devices

### 16.3 RGPD
Pas de cookies = pas besoin de consentement pour les analytics

---

## 17. Performance

### 17.1 Temps Réel
- WebSocket pour aisstream.io (bateaux)
- Polling 30-60s pour APIs REST
- Zustand pour état global réactif

### 17.2 Optimisations
- Clustering pour éviter surcharge markers
- Lazy loading des données hors viewport
- Cache des requêtes API (SWR ou React Query)

---

## 18. Sécurité

### 18.1 API Keys
- Variables d'environnement Vercel
- Jamais exposées côté client
- Rotation périodique recommandée

### 18.2 Scraping
- Rate limiting côté serveur
- User-Agent rotation
- Respect des robots.txt quand possible

### 18.3 Auth
- Supabase RLS (Row Level Security)
- JWT tokens
- HTTPS obligatoire

---

## 19. Prochaines Étapes

1. **Setup projet** — Init Next.js, Tailwind, shadcn/ui
2. **Carte de base** — Intégration Mapbox
3. **Première source** — USGS séismes
4. **UI filtres** — Système de toggles
5. **Panel Social** — Intégration Twitter/scraping
6. **Sources additionnelles** — Avions, bateaux, conflits
7. **Auth** — Supabase
8. **RGPD** — Pages légales, bannière
9. **Analytics** — Umami
10. **Tests & Polish** — Responsive, sons, optimisations

---

**Document validé le 2026-01-11**
