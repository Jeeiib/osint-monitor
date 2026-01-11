# Phase 1: Setup & Carte de Base — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Mettre en place le projet Next.js avec Mapbox, le layout Command Center, et afficher les premiers séismes en temps réel.

**Architecture:** Next.js App Router avec composants client pour la carte Mapbox. État global Zustand pour les données temps réel. API Routes pour proxy les requêtes externes (CORS).

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Mapbox GL JS, react-map-gl, Zustand

---

## Task 1: Initialiser le projet Next.js

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `next.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

**Step 1: Créer le projet Next.js avec TypeScript et Tailwind**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Répondre aux prompts:
- Would you like to use Turbopack? → No
- Continue? → Yes (pour écraser les fichiers existants)

**Step 2: Vérifier que le projet fonctionne**

```bash
npm run dev
```

Expected: Serveur démarre sur http://localhost:3000

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: initialize Next.js project with TypeScript and Tailwind"
```

---

## Task 2: Installer et configurer shadcn/ui

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

**Step 1: Initialiser shadcn/ui**

```bash
npx shadcn@latest init
```

Répondre aux prompts:
- Which style? → Default
- Base color? → Slate
- CSS variables? → Yes

**Step 2: Installer les composants essentiels**

```bash
npx shadcn@latest add button sheet tabs switch slider popover dialog toast dropdown-menu
```

**Step 3: Vérifier l'installation**

Modifier `src/app/page.tsx`:
```tsx
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950">
      <Button variant="outline">Test shadcn</Button>
    </main>
  )
}
```

Run: `npm run dev`
Expected: Bouton visible avec style correct

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add shadcn/ui with essential components"
```

---

## Task 3: Configurer le dark mode par défaut

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Step 1: Forcer le dark mode dans layout.tsx**

Modifier `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OSINT Monitor",
  description: "Real-time global intelligence monitoring platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**Step 2: Ajuster les variables CSS pour dark mode**

S'assurer que `src/app/globals.css` a les bonnes variables dark (shadcn les génère normalement).

**Step 3: Vérifier visuellement**

Run: `npm run dev`
Expected: Page avec fond sombre (slate-950)

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: configure dark mode as default theme"
```

---

## Task 4: Installer Mapbox GL JS

**Files:**
- Modify: `package.json`
- Create: `src/types/mapbox.d.ts`
- Create: `.env.local`
- Modify: `.gitignore` (vérifier que .env.local est ignoré)

**Step 1: Installer les dépendances Mapbox**

```bash
npm install mapbox-gl react-map-gl
npm install -D @types/mapbox-gl
```

**Step 2: Créer le fichier d'environnement**

Créer `.env.local`:
```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx
```

Note: Obtenir un token gratuit sur https://mapbox.com (50k loads/mois gratuits)

**Step 3: Vérifier que .env.local est ignoré**

Le `.gitignore` doit contenir `.env.local` (déjà fait dans notre gitignore initial).

**Step 4: Commit**

```bash
git add package.json package-lock.json && git commit -m "feat: add Mapbox GL JS dependencies"
```

---

## Task 5: Créer le composant Map de base

**Files:**
- Create: `src/components/map/BaseMap.tsx`
- Create: `src/components/map/index.ts`
- Modify: `src/app/page.tsx`

**Step 1: Créer le composant BaseMap**

Créer `src/components/map/BaseMap.tsx`:
```tsx
"use client";

import { useRef, useEffect, useState } from "react";
import Map, { NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface BaseMapProps {
  className?: string;
}

export function BaseMap({ className }: BaseMapProps) {
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 30,
    zoom: 2,
  });

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900">
        <p className="text-red-500">Mapbox token manquant</p>
      </div>
    );
  }

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      className={className}
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="bottom-right" />
    </Map>
  );
}
```

**Step 2: Créer le fichier index pour les exports**

Créer `src/components/map/index.ts`:
```ts
export { BaseMap } from "./BaseMap";
```

**Step 3: Intégrer la carte dans la page principale**

Modifier `src/app/page.tsx`:
```tsx
import { BaseMap } from "@/components/map";

export default function Home() {
  return (
    <main className="h-screen w-screen">
      <BaseMap className="h-full w-full" />
    </main>
  );
}
```

**Step 4: Tester la carte**

Run: `npm run dev`
Expected: Carte Mapbox dark mode plein écran

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add BaseMap component with Mapbox dark style"
```

---

## Task 6: Créer le layout Command Center

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/SidePanel.tsx`
- Create: `src/components/layout/Timeline.tsx`
- Create: `src/components/layout/MainLayout.tsx`
- Create: `src/components/layout/index.ts`
- Modify: `src/app/page.tsx`

**Step 1: Créer le composant Header**

Créer `src/components/layout/Header.tsx`:
```tsx
"use client";

import { Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 backdrop-blur">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center">
          <span className="text-xs font-bold">OS</span>
        </div>
        <span className="font-semibold text-slate-200">OSINT Monitor</span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-4">
        <Button
          variant="outline"
          className="w-full justify-start text-slate-400 bg-slate-800/50 border-slate-700 hover:bg-slate-800"
        >
          <Search className="mr-2 h-4 w-4" />
          <span>Rechercher...</span>
          <kbd className="ml-auto text-xs bg-slate-700 px-2 py-0.5 rounded">⌘K</kbd>
        </Button>
      </div>

      {/* Stats placeholder */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-red-500">● 0 incidents</span>
        <span className="text-orange-500">● 0 séismes</span>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
```

**Step 2: Créer le composant SidePanel**

Créer `src/components/layout/SidePanel.tsx`:
```tsx
"use client";

import { useState } from "react";
import { X, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SidePanel() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="absolute right-4 top-20 z-10 bg-slate-900/90"
        onClick={() => setIsOpen(true)}
      >
        Ouvrir le panel
      </Button>
    );
  }

  return (
    <aside className="w-80 border-l border-slate-800 bg-slate-900/80 backdrop-blur flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h2 className="font-semibold text-slate-200">Social Intel</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Minimize2 className="h-4 w-4" onClick={() => setIsOpen(false)} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-slate-800 bg-transparent px-4">
          <TabsTrigger value="all" className="text-xs">Tous</TabsTrigger>
          <TabsTrigger value="conflicts" className="text-xs">Conflits</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 overflow-auto p-4">
          <div className="text-center text-slate-500 py-8">
            <p>Aucun événement pour le moment</p>
            <p className="text-xs mt-2">Les tweets apparaîtront ici</p>
          </div>
        </TabsContent>

        <TabsContent value="conflicts" className="flex-1 overflow-auto p-4">
          <div className="text-center text-slate-500 py-8">
            <p>Conflits</p>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="flex-1 overflow-auto p-4">
          <div className="text-center text-slate-500 py-8">
            <p>Alertes</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="border-t border-slate-800 px-4 py-2 text-xs text-slate-500">
        Dernière MAJ: --
      </div>
    </aside>
  );
}
```

**Step 3: Créer le composant Timeline**

Créer `src/components/layout/Timeline.tsx`:
```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export function Timeline() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/80 backdrop-blur px-4 py-3">
      <div className="flex items-center gap-4">
        {/* Raccourcis temporels */}
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="text-xs h-7">
            Aujourd'hui
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-7">
            24h
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-7">
            7j
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-7">
            30j
          </Button>
        </div>

        {/* Slider */}
        <div className="flex-1 px-4">
          <Slider defaultValue={[100]} max={100} step={1} className="w-full" />
        </div>

        {/* Live button */}
        <Button variant="default" size="sm" className="bg-red-600 hover:bg-red-700 text-xs h-7">
          <span className="mr-1.5 h-2 w-2 rounded-full bg-white animate-pulse" />
          LIVE
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-2 text-xs text-slate-500">
        📊 Période: 0 événements | 0 séismes | 0 incidents
      </div>
    </footer>
  );
}
```

**Step 4: Créer le MainLayout**

Créer `src/components/layout/MainLayout.tsx`:
```tsx
"use client";

import { Header } from "./Header";
import { SidePanel } from "./SidePanel";
import { Timeline } from "./Timeline";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 relative">{children}</main>
        <SidePanel />
      </div>
      <Timeline />
    </div>
  );
}
```

**Step 5: Créer le fichier index**

Créer `src/components/layout/index.ts`:
```ts
export { Header } from "./Header";
export { SidePanel } from "./SidePanel";
export { Timeline } from "./Timeline";
export { MainLayout } from "./MainLayout";
```

**Step 6: Installer lucide-react pour les icônes**

```bash
npm install lucide-react
```

**Step 7: Intégrer le layout dans la page**

Modifier `src/app/page.tsx`:
```tsx
import { BaseMap } from "@/components/map";
import { MainLayout } from "@/components/layout";

export default function Home() {
  return (
    <MainLayout>
      <BaseMap className="absolute inset-0" />
    </MainLayout>
  );
}
```

**Step 8: Tester le layout**

Run: `npm run dev`
Expected: Layout Command Center avec header, carte, panel latéral, et timeline

**Step 9: Commit**

```bash
git add -A && git commit -m "feat: add Command Center layout with Header, SidePanel, and Timeline"
```

---

## Task 7: Configurer Zustand pour l'état global

**Files:**
- Create: `src/lib/stores/mapStore.ts`
- Create: `src/lib/stores/filterStore.ts`
- Create: `src/lib/stores/index.ts`
- Modify: `package.json`

**Step 1: Installer Zustand**

```bash
npm install zustand
```

**Step 2: Créer le store pour la carte**

Créer `src/lib/stores/mapStore.ts`:
```ts
import { create } from "zustand";

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

interface MapStore {
  viewState: ViewState;
  setViewState: (viewState: ViewState) => void;
  flyTo: (longitude: number, latitude: number, zoom?: number) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  viewState: {
    longitude: 0,
    latitude: 30,
    zoom: 2,
  },
  setViewState: (viewState) => set({ viewState }),
  flyTo: (longitude, latitude, zoom = 8) =>
    set({ viewState: { longitude, latitude, zoom } }),
}));
```

**Step 3: Créer le store pour les filtres**

Créer `src/lib/stores/filterStore.ts`:
```ts
import { create } from "zustand";

interface FilterStore {
  // Catégories actives
  showEarthquakes: boolean;
  showConflicts: boolean;
  showAircraft: boolean;
  showVessels: boolean;
  showWeather: boolean;

  // Importance (0-100, 0 = tout, 100 = majeur uniquement)
  importanceThreshold: number;

  // Période
  timeRange: "live" | "24h" | "7d" | "30d";

  // Actions
  toggleCategory: (category: keyof FilterStore) => void;
  setImportanceThreshold: (value: number) => void;
  setTimeRange: (range: "live" | "24h" | "7d" | "30d") => void;
  applyPreset: (preset: "conflicts" | "disasters" | "traffic" | "all" | "minimal") => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  showEarthquakes: true,
  showConflicts: true,
  showAircraft: true,
  showVessels: true,
  showWeather: true,
  importanceThreshold: 0,
  timeRange: "live",

  toggleCategory: (category) =>
    set((state) => ({ [category]: !state[category as keyof FilterStore] })),

  setImportanceThreshold: (value) => set({ importanceThreshold: value }),

  setTimeRange: (range) => set({ timeRange: range }),

  applyPreset: (preset) => {
    switch (preset) {
      case "conflicts":
        set({
          showConflicts: true,
          showAircraft: true,
          showEarthquakes: false,
          showVessels: false,
          showWeather: false,
          importanceThreshold: 0,
        });
        break;
      case "disasters":
        set({
          showEarthquakes: true,
          showWeather: true,
          showConflicts: false,
          showAircraft: false,
          showVessels: false,
          importanceThreshold: 0,
        });
        break;
      case "traffic":
        set({
          showAircraft: true,
          showVessels: true,
          showConflicts: false,
          showEarthquakes: false,
          showWeather: false,
          importanceThreshold: 0,
        });
        break;
      case "all":
        set({
          showEarthquakes: true,
          showConflicts: true,
          showAircraft: true,
          showVessels: true,
          showWeather: true,
          importanceThreshold: 50,
        });
        break;
      case "minimal":
        set({
          showEarthquakes: true,
          showConflicts: true,
          showAircraft: true,
          showVessels: true,
          showWeather: true,
          importanceThreshold: 80,
        });
        break;
    }
  },
}));
```

**Step 4: Créer le fichier index**

Créer `src/lib/stores/index.ts`:
```ts
export { useMapStore } from "./mapStore";
export { useFilterStore } from "./filterStore";
```

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add Zustand stores for map and filters state"
```

---

## Task 8: Intégrer l'API USGS pour les séismes

**Files:**
- Create: `src/lib/sources/usgs.ts`
- Create: `src/lib/sources/index.ts`
- Create: `src/types/earthquake.ts`
- Create: `src/app/api/earthquakes/route.ts`

**Step 1: Créer les types pour les séismes**

Créer `src/types/earthquake.ts`:
```ts
export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  latitude: number;
  longitude: number;
  depth: number;
  url: string;
  felt: number | null;
  significance: number;
}

export interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
    felt: number | null;
    sig: number;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

export interface USGSResponse {
  features: USGSFeature[];
  metadata: {
    generated: number;
    count: number;
    title: string;
  };
}
```

**Step 2: Créer le connecteur USGS**

Créer `src/lib/sources/usgs.ts`:
```ts
import type { Earthquake, USGSResponse } from "@/types/earthquake";

const USGS_BASE_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary";

export async function fetchEarthquakes(
  period: "hour" | "day" | "week" | "month" = "day",
  minMagnitude: "significant" | "4.5" | "2.5" | "1.0" | "all" = "2.5"
): Promise<Earthquake[]> {
  const url = `${USGS_BASE_URL}/${minMagnitude}_${period}.geojson`;

  const response = await fetch(url, {
    next: { revalidate: 60 }, // Cache 1 minute
  });

  if (!response.ok) {
    throw new Error(`USGS API error: ${response.status}`);
  }

  const data: USGSResponse = await response.json();

  return data.features.map((feature) => ({
    id: feature.id,
    magnitude: feature.properties.mag,
    place: feature.properties.place,
    time: feature.properties.time,
    latitude: feature.geometry.coordinates[1],
    longitude: feature.geometry.coordinates[0],
    depth: feature.geometry.coordinates[2],
    url: feature.properties.url,
    felt: feature.properties.felt,
    significance: feature.properties.sig,
  }));
}
```

**Step 3: Créer le fichier index**

Créer `src/lib/sources/index.ts`:
```ts
export { fetchEarthquakes } from "./usgs";
```

**Step 4: Créer l'API Route**

Créer `src/app/api/earthquakes/route.ts`:
```ts
import { NextResponse } from "next/server";
import { fetchEarthquakes } from "@/lib/sources/usgs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") || "day") as "hour" | "day" | "week" | "month";
  const minMagnitude = (searchParams.get("minMag") || "2.5") as "significant" | "4.5" | "2.5" | "1.0" | "all";

  try {
    const earthquakes = await fetchEarthquakes(period, minMagnitude);
    return NextResponse.json(earthquakes);
  } catch (error) {
    console.error("Failed to fetch earthquakes:", error);
    return NextResponse.json(
      { error: "Failed to fetch earthquake data" },
      { status: 500 }
    );
  }
}
```

**Step 5: Tester l'API**

Run: `npm run dev`
Test: Ouvrir http://localhost:3000/api/earthquakes
Expected: JSON avec liste des séismes

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: add USGS earthquake API integration"
```

---

## Task 9: Afficher les séismes sur la carte

**Files:**
- Create: `src/lib/stores/earthquakeStore.ts`
- Create: `src/components/map/EarthquakeLayer.tsx`
- Modify: `src/components/map/BaseMap.tsx`
- Modify: `src/lib/stores/index.ts`

**Step 1: Créer le store pour les séismes**

Créer `src/lib/stores/earthquakeStore.ts`:
```ts
import { create } from "zustand";
import type { Earthquake } from "@/types/earthquake";

interface EarthquakeStore {
  earthquakes: Earthquake[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  fetchEarthquakes: () => Promise<void>;
}

export const useEarthquakeStore = create<EarthquakeStore>((set) => ({
  earthquakes: [],
  isLoading: false,
  error: null,
  lastUpdate: null,

  fetchEarthquakes: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/earthquakes?period=day&minMag=2.5");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      set({ earthquakes: data, isLoading: false, lastUpdate: new Date() });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
```

**Step 2: Mettre à jour l'index des stores**

Modifier `src/lib/stores/index.ts`:
```ts
export { useMapStore } from "./mapStore";
export { useFilterStore } from "./filterStore";
export { useEarthquakeStore } from "./earthquakeStore";
```

**Step 3: Créer le composant EarthquakeLayer**

Créer `src/components/map/EarthquakeLayer.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import { Marker, Popup } from "react-map-gl";
import { useEarthquakeStore } from "@/lib/stores";
import { useFilterStore } from "@/lib/stores";
import { useState } from "react";
import type { Earthquake } from "@/types/earthquake";

function getMagnitudeColor(magnitude: number): string {
  if (magnitude >= 6) return "#ef4444"; // red-500
  if (magnitude >= 5) return "#f97316"; // orange-500
  if (magnitude >= 4) return "#eab308"; // yellow-500
  return "#22c55e"; // green-500
}

function getMagnitudeSize(magnitude: number): number {
  return Math.max(8, magnitude * 5);
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `il y a ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export function EarthquakeLayer() {
  const { earthquakes, fetchEarthquakes, isLoading } = useEarthquakeStore();
  const { showEarthquakes, importanceThreshold } = useFilterStore();
  const [selectedQuake, setSelectedQuake] = useState<Earthquake | null>(null);

  useEffect(() => {
    fetchEarthquakes();
    const interval = setInterval(fetchEarthquakes, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchEarthquakes]);

  if (!showEarthquakes) return null;

  const filteredQuakes = earthquakes.filter(
    (eq) => eq.magnitude >= importanceThreshold / 25 // Scale 0-100 to 0-4
  );

  return (
    <>
      {filteredQuakes.map((earthquake) => (
        <Marker
          key={earthquake.id}
          longitude={earthquake.longitude}
          latitude={earthquake.latitude}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedQuake(earthquake);
          }}
        >
          <div
            className="rounded-full border-2 border-white/50 cursor-pointer transition-transform hover:scale-125"
            style={{
              width: getMagnitudeSize(earthquake.magnitude),
              height: getMagnitudeSize(earthquake.magnitude),
              backgroundColor: getMagnitudeColor(earthquake.magnitude),
              boxShadow: `0 0 ${earthquake.magnitude * 2}px ${getMagnitudeColor(earthquake.magnitude)}`,
            }}
          />
        </Marker>
      ))}

      {selectedQuake && (
        <Popup
          longitude={selectedQuake.longitude}
          latitude={selectedQuake.latitude}
          anchor="bottom"
          onClose={() => setSelectedQuake(null)}
          closeButton={true}
          closeOnClick={false}
          className="earthquake-popup"
        >
          <div className="p-2 min-w-48">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getMagnitudeColor(selectedQuake.magnitude) }}
              />
              <span className="font-bold text-lg">M{selectedQuake.magnitude.toFixed(1)}</span>
            </div>
            <p className="text-sm text-slate-600 mb-1">{selectedQuake.place}</p>
            <p className="text-xs text-slate-500 mb-2">{formatTimeAgo(selectedQuake.time)}</p>
            <p className="text-xs text-slate-500">Profondeur: {selectedQuake.depth.toFixed(1)} km</p>
            <a
              href={selectedQuake.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline mt-2 block"
            >
              Plus d'infos (USGS) →
            </a>
          </div>
        </Popup>
      )}
    </>
  );
}
```

**Step 4: Mettre à jour BaseMap pour inclure le layer**

Modifier `src/components/map/BaseMap.tsx`:
```tsx
"use client";

import { useCallback } from "react";
import Map, { NavigationControl } from "react-map-gl";
import { useMapStore } from "@/lib/stores";
import { EarthquakeLayer } from "./EarthquakeLayer";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface BaseMapProps {
  className?: string;
}

export function BaseMap({ className }: BaseMapProps) {
  const { viewState, setViewState } = useMapStore();

  const onMove = useCallback(
    (evt: { viewState: { longitude: number; latitude: number; zoom: number } }) => {
      setViewState(evt.viewState);
    },
    [setViewState]
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900">
        <p className="text-red-500">Mapbox token manquant</p>
      </div>
    );
  }

  return (
    <Map
      {...viewState}
      onMove={onMove}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      className={className}
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="bottom-right" />
      <EarthquakeLayer />
    </Map>
  );
}
```

**Step 5: Mettre à jour l'export map**

Modifier `src/components/map/index.ts`:
```ts
export { BaseMap } from "./BaseMap";
export { EarthquakeLayer } from "./EarthquakeLayer";
```

**Step 6: Ajouter du CSS pour les popups Mapbox**

Ajouter à `src/app/globals.css`:
```css
/* Mapbox popup styling for dark theme */
.mapboxgl-popup-content {
  background: rgb(15 23 42) !important;
  color: rgb(226 232 240) !important;
  border-radius: 8px !important;
  padding: 0 !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
}

.mapboxgl-popup-close-button {
  color: rgb(148 163 184) !important;
  font-size: 18px !important;
  padding: 4px 8px !important;
}

.mapboxgl-popup-close-button:hover {
  color: white !important;
  background: transparent !important;
}

.mapboxgl-popup-tip {
  border-top-color: rgb(15 23 42) !important;
}

.earthquake-popup .mapboxgl-popup-content p {
  color: rgb(148 163 184) !important;
}
```

**Step 7: Tester l'affichage des séismes**

Run: `npm run dev`
Expected: Séismes affichés sur la carte avec couleurs selon magnitude, popup au clic

**Step 8: Commit**

```bash
git add -A && git commit -m "feat: display earthquakes on map with interactive popups"
```

---

## Task 10: Ajouter les filtres visuels sur la carte

**Files:**
- Create: `src/components/filters/FilterBar.tsx`
- Create: `src/components/filters/index.ts`
- Modify: `src/components/layout/MainLayout.tsx`

**Step 1: Créer le composant FilterBar**

Créer `src/components/filters/FilterBar.tsx`:
```tsx
"use client";

import { useFilterStore } from "@/lib/stores";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = [
  { key: "showEarthquakes", label: "Séismes", color: "bg-orange-500", icon: "🟠" },
  { key: "showConflicts", label: "Conflits", color: "bg-red-500", icon: "🔴" },
  { key: "showAircraft", label: "Avions", color: "bg-blue-500", icon: "✈️" },
  { key: "showVessels", label: "Bateaux", color: "bg-cyan-500", icon: "🚢" },
  { key: "showWeather", label: "Météo", color: "bg-green-500", icon: "🌀" },
] as const;

export function FilterBar() {
  const store = useFilterStore();

  return (
    <div className="absolute left-4 top-4 z-10 flex gap-2">
      {categories.map((cat) => {
        const isActive = store[cat.key as keyof typeof store] as boolean;
        return (
          <Button
            key={cat.key}
            variant="outline"
            size="sm"
            onClick={() => store.toggleCategory(cat.key as keyof typeof store)}
            className={cn(
              "bg-slate-900/80 backdrop-blur border-slate-700 hover:bg-slate-800 transition-all",
              isActive && "ring-2 ring-offset-2 ring-offset-slate-950",
              isActive && cat.color.replace("bg-", "ring-")
            )}
          >
            <span className="mr-1.5">{cat.icon}</span>
            <span className={cn(!isActive && "text-slate-500")}>{cat.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
```

**Step 2: Créer le fichier index**

Créer `src/components/filters/index.ts`:
```ts
export { FilterBar } from "./FilterBar";
```

**Step 3: Intégrer FilterBar dans le layout**

Modifier `src/app/page.tsx`:
```tsx
import { BaseMap } from "@/components/map";
import { MainLayout } from "@/components/layout";
import { FilterBar } from "@/components/filters";

export default function Home() {
  return (
    <MainLayout>
      <BaseMap className="absolute inset-0" />
      <FilterBar />
    </MainLayout>
  );
}
```

**Step 4: Tester les filtres**

Run: `npm run dev`
Expected: Boutons de filtres en haut à gauche, clic toggle l'affichage des séismes

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add filter bar with category toggles"
```

---

## Task 11: Mettre à jour les stats du header

**Files:**
- Modify: `src/components/layout/Header.tsx`

**Step 1: Connecter le header aux stores**

Modifier `src/components/layout/Header.tsx`:
```tsx
"use client";

import { Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEarthquakeStore } from "@/lib/stores";

export function Header() {
  const { earthquakes, isLoading } = useEarthquakeStore();

  const majorQuakes = earthquakes.filter((eq) => eq.magnitude >= 4).length;

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 backdrop-blur">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center">
          <span className="text-xs font-bold">OS</span>
        </div>
        <span className="font-semibold text-slate-200">OSINT Monitor</span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-4">
        <Button
          variant="outline"
          className="w-full justify-start text-slate-400 bg-slate-800/50 border-slate-700 hover:bg-slate-800"
        >
          <Search className="mr-2 h-4 w-4" />
          <span>Rechercher...</span>
          <kbd className="ml-auto text-xs bg-slate-700 px-2 py-0.5 rounded">⌘K</kbd>
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-red-500">● 0 incidents</span>
        <span className="text-orange-500 flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          {isLoading ? "..." : `${earthquakes.length} séismes`}
          {majorQuakes > 0 && (
            <span className="text-xs bg-orange-500/20 px-1.5 py-0.5 rounded">
              {majorQuakes} majeurs
            </span>
          )}
        </span>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
```

**Step 2: Tester les stats live**

Run: `npm run dev`
Expected: Le header affiche le nombre de séismes en temps réel

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: connect header stats to earthquake store"
```

---

## Résumé Phase 1

À la fin de cette phase, tu auras:
- ✅ Projet Next.js configuré avec TypeScript et Tailwind
- ✅ shadcn/ui installé avec composants essentiels
- ✅ Dark mode par défaut
- ✅ Carte Mapbox avec style dark
- ✅ Layout Command Center (Header, SidePanel, Timeline)
- ✅ Stores Zustand (map, filters, earthquakes)
- ✅ Intégration API USGS
- ✅ Affichage des séismes sur la carte
- ✅ Filtres par catégorie
- ✅ Stats live dans le header

**Prochaine phase:** Panel Social Intel + sources Twitter/scraping
