# OSINT Monitoring Platform

---

## Priorite des outils

**IMPORTANT** : Utiliser ces outils dans l'ordre de priorite suivant :

| Priorite | Outil | Usage |
|----------|-------|-------|
| 1 | `supermemory:super-search` | Avant d'explorer - verifier si le sujet a deja ete traite |
| 2 | `context7` | Documentation des librairies (Next.js, Mapbox, Zustand, Supabase, Zod...) |
| 3 | `serena` | Navigation semantique du code (find_symbol, get_symbols_overview) |
| 4 | `Explore` agent | Exploration approfondie de la codebase |
| 5 | Web Search | En dernier recours si les outils locaux ne suffisent pas |

---

## Les 4 Phases de developpement

Claude suit automatiquement ce workflow selon le contexte de la conversation.

### Phase 1 : REFLEXION

**Declencheurs** : "nouvelle feature", "bug", "probleme", "comment faire", "je veux", "ajoute"

**Actions automatiques** :
1. `supermemory:super-search` - Chercher si deja traite
2. `superpowers:brainstorming` - Poser des questions, explorer les approches
3. `serena` - Explorer le code existant
4. Si bug -> `superpowers:systematic-debugging`

**Regle** : Ne JAMAIS coder avant d'avoir un plan valide par l'utilisateur.

### Phase 2 : CREATION

**Declencheurs** : Plan valide, "implemente", "code", "go", "c'est bon"

**Actions automatiques** :
1. `superpowers:test-driven-development` - Tests d'abord (RED -> GREEN -> REFACTOR)
2. `context7` - Chercher la doc a jour des librairies utilisees
3. `frontend-design` - Si composant UI
4. `react-best-practices` - Si code React/Next.js
5. `security-auditor` - Verification au fil de l'eau

**Regle** : Toujours ecrire les tests AVANT l'implementation.

### Phase 3 : VALIDATION

**Declencheurs** : "review", "verifie", "c'est pret", "check", avant tout commit

**Actions automatiques** :
1. `superpowers:verification-before-completion` - Verifier que tout fonctionne
2. `code-review:code-review` - Review multi-agents
3. `pr-review-toolkit:review-pr` - Review approfondie si PR
4. `web-design-guidelines` - Si UI modifiee

**Regle** : Ne JAMAIS dire "c'est termine" sans avoir lance les verifications.

### Phase 4 : FINALISATION

**Declencheurs** : "commit", "push", "PR", "merge"

**Actions automatiques** :
1. `commit-commands:commit` - Commit structure
2. `superpowers:finishing-a-development-branch` - Options de finalisation
3. Indexer dans supermemory si feature importante

**Regle** : Message de commit en francais, sans mention de Claude.

---

## Quand utiliser le Plan Mode

Activer `EnterPlanMode` automatiquement si :
- La tache touche **3+ fichiers**
- La tache implique de l'**architecture** (nouvelle feature, refactoring majeur)
- Les mots "refactoriser", "migrer", "systeme", "architecture" sont mentionnes
- L'utilisateur demande explicitement un plan

Ne PAS activer si :
- Fix simple, typo, ajout mineur (< 20 lignes)
- L'utilisateur dit "fais-le directement" ou "pas besoin de plan"

---

## Description

Plateforme de monitoring OSINT en temps reel pour suivre les evenements mondiaux : conflits, catastrophes naturelles, trafic aerien/maritime, et intelligence sociale.

### Stack technique

**Frontend**
- Framework : Next.js 14+ (App Router)
- Carte : Mapbox GL JS + react-map-gl
- UI : Tailwind CSS + shadcn/ui
- Etat : Zustand
- i18n : next-intl (FR/EN)

**Backend**
- Auth & DB : Supabase (region EU - Frankfurt)
- Scraping : API Routes + Cheerio
- Analytics : Umami (self-hosted)
- Deploiement : Vercel

### Structure du projet

```
/src
  /app                 # App Router Next.js
    /[locale]          # Routes internationalisees
    /api               # API Routes (scraping, proxies)
  /components
    /map               # Composants carte Mapbox
    /ui                # Composants shadcn/ui
    /feed              # Panel Social Intel
    /alerts            # Systeme d'alertes
    /filters           # Filtres et presets
  /lib
    /sources           # Connecteurs sources de donnees
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

---

## Commandes

```bash
npm run dev          # Serveur developpement
npm run build        # Build production
npm run start        # Serveur production
npm run lint         # Linting
npm run test         # Tests
```

---

## Variables d'Environnement

```env
# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# APIs externes (cote serveur uniquement)
OPENSKY_USERNAME=
OPENSKY_PASSWORD=
```

---

## Conventions

### Code
- **TypeScript strict** - Pas de `any`, typer explicitement
- Types explicites pour les props et retours de fonctions
- Interfaces pour les objets, types pour les unions
- **Composants fonctionnels** avec hooks, props destructurees
- **Nommage** - PascalCase (composants/fichiers), camelCase (fonctions/variables)
- **Pas d'emojis dans l'UI** - Utiliser des icones (Lucide React)

### Styles
- Tailwind CSS pour tout le styling
- Classes utilitaires, pas de CSS custom sauf exception
- Dark mode par defaut (pas de theme switching pour l'instant)

### Etat
- Zustand pour l'etat global (filtres, donnees temps reel)
- useState/useReducer pour l'etat local
- Pas de prop drilling > 2 niveaux

### API Routes
- Toutes les cles API cote serveur
- Rate limiting sur les endpoints de scraping
- Validation des inputs avec Zod

### Internationalisation
- Toutes les strings dans `/public/locales`
- Utiliser `useTranslations()` de next-intl
- Format: `namespace.key`

### Git
- Messages de commit en **francais**, sans emojis
- Ne JAMAIS ajouter "Co-Authored-By: Claude"
- Branches : `main`, `develop`, `feature/*`, `fix/*`
- Commits conventionnels : `feat:`, `fix:`, `docs:`, `refactor:`
- PR obligatoire pour merge sur main

### Tests
- Chaque nouveau fichier DOIT avoir des tests
- Edge cases et cas d'erreur couverts

---

## Sources de Donnees

### APIs Gratuites
- **Seismes** : USGS (earthquake.usgs.gov)
- **Avions** : OpenSky Network (opensky-network.org)
- **Bateaux** : aisstream.io (WebSocket)
- **Catastrophes** : GDACS (gdacs.org)
- **Conflits** : GDELT BigQuery

### Scraping
- **Conflits** : LiveUAMap, GeoConfirmed
- **Twitter** : Via Twint ou alternatives
- Rate limiting obligatoire
- Respecter les robots.txt

---

## Securite

### Checklist avant commit
- [ ] Inputs valides avec Zod (API Routes)
- [ ] Pas de `console.log` avec donnees sensibles
- [ ] Pas de secrets en dur dans le code
- [ ] CORS configure correctement
- [ ] Tokens chiffres si stockes en DB

### Workflow securite
1. **Pendant le code** - `security-auditor` verifie au fil de l'eau
2. **Avant commit** - Audit OWASP
3. **Sur PR** - Review securite automatique

---

## RGPD
- Donnees utilisateur en EU (Supabase Frankfurt)
- Banniere consentement obligatoire
- Export/suppression donnees dans settings
- Umami sans cookies pour analytics

---

## Performance
- Clustering des markers pour eviter surcharge
- Lazy loading des donnees hors viewport
- Cache SWR/React Query pour les requetes
- WebSocket pour les donnees temps reel (bateaux)

---

## Plugins actifs

### Essentiels (toujours charges)
| Plugin | Usage |
|--------|-------|
| `superpowers` | Workflows structures (brainstorming, TDD, debugging, plans) |
| `context7` | Documentation a jour des librairies |
| `supermemory` | Memoire persistante cross-sessions |
| `serena` | Navigation semantique du code (LSP) |

### Utiles (selon contexte)
| Plugin | Usage |
|--------|-------|
| `feature-dev` | Workflow 7 phases pour features complexes |
| `frontend-design` | Design UI de qualite |
| `pr-review-toolkit` | 6 agents de review specialises |
| `code-review` | Review multi-agents avec validation |
| `document-skills` | PDF, DOCX pour documents clients |

---

## Skills disponibles

### Developpement
| Skill | Quand l'utiliser |
|-------|------------------|
| `superpowers:brainstorming` | Nouvelle feature, idee a raffiner |
| `superpowers:systematic-debugging` | Bug, comportement inattendu |
| `superpowers:test-driven-development` | Avant d'implementer |
| `superpowers:writing-plans` | Plan d'implementation detaille |
| `superpowers:verification-before-completion` | Avant de dire "c'est fait" |
| `feature-dev:feature-dev` | Feature complexe avec agents |

### Frontend
| Skill | Quand l'utiliser |
|-------|------------------|
| `frontend-design:frontend-design` | Creer un composant UI |
| `react-best-practices` | Optimisation React/Next.js |
| `web-design-guidelines` | Review UI/UX |
| `seo-audit` | Audit SEO avant mise en prod |

### Review & Qualite
| Skill | Quand l'utiliser |
|-------|------------------|
| `code-review:code-review` | Review d'une PR |
| `pr-review-toolkit:review-pr` | Review complete avec 6 agents |
| `generate-tests` | Generer une suite de tests |

### Documents
| Skill | Quand l'utiliser |
|-------|------------------|
| `document-skills:pdf` | Manipuler des PDF |
| `document-skills:docx` | Creer/editer des Word |
| `document-skills:doc-coauthoring` | Co-ecrire de la documentation |

---

## Agents Specialises

### Exploration & Analyse
- **Explore** : Recherche de code, comprehension de codebase, patterns
- **code-explorer** : Analyse approfondie de fonctionnalites existantes

### Developpement
- **code-architect** : Design d'architecture et blueprints d'implementation
- **fullstack-developer** : Developpement full-stack complet
- **frontend-developer** : Composants React, UI, accessibilite
- **typescript-pro** : Types avances, generiques, optimisations TypeScript
- **backend-architect** : APIs, microservices, schemas DB

### Qualite & Review
- **code-reviewer** : Revue de code apres implementation majeure
- **debugger** : Debogage d'erreurs, test failures, comportements inattendus

### Specialises
- **prompt-engineer** : Optimisation de prompts pour features IA
- **ui-ux-designer** : Design UX, wireframes, systemes de design
- **security-auditor** : Verification securite continue

### Quand les utiliser
- Exploration ouverte de codebase -> Explore
- Implementation de feature complexe -> code-architect puis fullstack-developer
- Code termine -> code-reviewer
- Bug ou erreur -> debugger
- UI/composants -> frontend-developer ou ui-ux-designer

---

## Notes projet

### Decisions techniques
- Zustand choisi plutot que Redux pour la simplicite et la taille du bundle
- next-intl pour l'i18n (meilleure integration App Router que i18next)
- Dark mode par defaut sans toggle (choix UX pour contexte monitoring/OSINT)
- GDELT BigQuery pour le suivi des conflits mondiaux

### Integrations
- Mapbox GL JS : carte interactive principale
- Supabase (Frankfurt) : auth, DB, storage
- OpenSky Network : donnees trafic aerien
- USGS : donnees sismiques
- GDACS : alertes catastrophes
- aisstream.io : trafic maritime (WebSocket)
- GDELT : evenements conflits (BigQuery)
- Umami : analytics respectueux de la vie privee
