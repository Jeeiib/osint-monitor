# Tracking Conflits GDELT via BigQuery — Design Document

**Date**: 2026-01-11
**Statut**: Validé
**Source de données**: GDELT (Global Database of Events, Language, and Tone)

---

## 1. Vue d'ensemble

### Objectif
Afficher les conflits mondiaux en temps réel sur la carte, avec des indicateurs visuels de gravité et de fiabilité basés sur les métriques GDELT.

### Pourquoi GDELT + BigQuery ?
- **GDELT** : Référence OSINT, mise à jour toutes les 15 minutes, couverture mondiale
- **BigQuery** : Accès à tous les champs (Goldstein, NumMentions, coords) vs API GEO limitée
- **Gratuit** : 1 TB/mois de requêtes gratuites

### Sources consultées
- [GDELT Project](https://www.gdeltproject.org/)
- [GDELT BigQuery Demos](https://blog.gdeltproject.org/a-compilation-of-gdelt-bigquery-demos/)
- [Bellingcat OSINT Toolkit](https://bellingcat.gitbook.io/toolkit/categories/conflict)

---

## 2. Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Google Cloud   │     │   Next.js API    │     │    Frontend     │
│    BigQuery     │────▶│  /api/conflicts  │────▶│  ConflictLayer  │
│ (gdeltv2.events)│     │   (cache 5min)   │     │    (carte)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Flux de données
1. L'API Route exécute une requête BigQuery (cache 5 min)
2. Récupère les événements des dernières 24h avec Goldstein < -3
3. Transforme en format Conflict pour le frontend
4. Le `ConflictLayer` affiche les markers avec taille/opacité dynamiques

### Fichiers à créer
```
src/lib/sources/gdelt.ts           # Client BigQuery
src/app/api/conflicts/route.ts     # API Route
src/lib/stores/conflictStore.ts    # Store Zustand
src/components/map/ConflictLayer.tsx
src/types/conflict.ts
```

### Variables d'environnement
```env
GOOGLE_CLOUD_PROJECT=<project-id>
GOOGLE_APPLICATION_CREDENTIALS=./keys/gdelt-service-account.json
```

---

## 3. Structure des données

### Requête BigQuery
```sql
SELECT
  GlobalEventID as id,
  SQLDATE as date,
  Actor1Name as actor1,
  Actor2Name as actor2,
  EventCode as eventCode,
  GoldsteinScale as goldstein,
  NumMentions as mentions,
  NumSources as sources,
  ActionGeo_Lat as latitude,
  ActionGeo_Long as longitude,
  ActionGeo_FullName as location,
  SOURCEURL as sourceUrl
FROM `gdelt-bq.gdeltv2.events`
WHERE _PARTITIONTIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
  AND GoldsteinScale < -3
  AND ActionGeo_Lat IS NOT NULL
  AND NumMentions >= 3
ORDER BY NumMentions DESC
LIMIT 500
```

### Type TypeScript
```typescript
interface Conflict {
  id: string;
  date: number;
  actor1: string | null;
  actor2: string | null;
  eventCode: string;
  goldstein: number;      // -10 à 0 (conflits)
  mentions: number;       // Nombre d'articles (fiabilité)
  sources: number;        // Nombre de sources uniques
  latitude: number;
  longitude: number;
  location: string;
  sourceUrl: string;
}
```

---

## 4. Indicateurs visuels

### Taille du marker (gravité)
Basée sur le Goldstein Scale (-10 = très violent, 0 = neutre)

```typescript
function getConflictSize(goldstein: number): number {
  const severity = Math.abs(goldstein); // 0 à 10
  return 10 + severity * 2;             // 10px à 30px
}
```

### Opacité du marker (fiabilité)
Basée sur NumMentions (nombre d'articles)

```typescript
function getConflictOpacity(mentions: number): number {
  return Math.min(0.4 + (mentions / 20), 1); // 0.4 à 1.0
}
```

### Animation pulse
Pour les événements récents (< 1 heure)

```typescript
const isRecent = Date.now() - conflict.date < 3600000;
// Si récent → classe CSS "animate-pulse"
```

### Couleur
Rouge (#ef4444) — Cohérent avec le filtre "Conflits" existant

---

## 5. Composants UI

### Popup au clic
```
┌────────────────────────────────┐
│ 🔴 CONFLIT                     │
│ Kharkiv, Ukraine               │
│ il y a 2h                      │
│                                │
│ Acteurs: Russia → Ukraine      │
│ Gravité: ████████░░ -8.0       │
│ Sources: 47 articles           │
│                                │
│ [Voir source ↗]                │
└────────────────────────────────┘
```

### Header stats (mise à jour)
```
● 12 conflits | ● 8 séismes | ✈️ 847 | 🚢 2.3K
```
- Retirer le badge "X majeurs" des séismes
- Ajouter le compteur conflits

---

## 6. Mise à jour filtre séismes

### Seuils
- **API** : Récupère M4+ (buffer)
- **Affichage par défaut** : M5+
- **Paramétrable** : Via profil utilisateur (futur)

### Animation pulse séismes
- M6+ : Animation pulse (grave)
- M7+ : Grande taille (majeur)

---

## 7. Configuration Google Cloud

### Étapes de setup
1. Créer un projet Google Cloud
2. Activer l'API BigQuery
3. Créer un Service Account avec rôle "BigQuery User"
4. Télécharger la clé JSON
5. Ajouter au `.gitignore` : `keys/*.json`

### Installation
```bash
npm install @google-cloud/bigquery
```

---

## 8. Implémentation

### Ordre des tâches
1. Setup Google Cloud + clé service account
2. Créer `src/types/conflict.ts`
3. Créer `src/lib/sources/gdelt.ts` (client BigQuery)
4. Créer `src/app/api/conflicts/route.ts`
5. Créer `src/lib/stores/conflictStore.ts`
6. Créer `src/components/map/ConflictLayer.tsx`
7. Mettre à jour `Header.tsx` (stats conflits)
8. Mettre à jour le filtre séismes (M5+ par défaut)
9. Tester et committer

---

**Document validé le 2026-01-11**
