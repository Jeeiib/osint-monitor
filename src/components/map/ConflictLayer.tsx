"use client";

import { useEffect, useState } from "react";
import { Marker, Popup } from "react-map-gl/mapbox";
import { useConflictStore, useFilterStore } from "@/lib/stores";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Conflict } from "@/types/conflict";

// CAMEO event codes mapping to French descriptions
const EVENT_TYPES: Record<string, string> = {
  // 14x - PROTEST
  "140": "Protestation",
  "141": "Manifestation",
  "142": "Grève de la faim",
  "143": "Grève / Boycott",
  "144": "Blocage",
  "145": "Protestation violente",
  // 17x - COERCE
  "170": "Coercition",
  "171": "Saisie / Confiscation",
  "172": "Sanctions",
  "173": "Arrestation",
  "174": "Expulsion",
  "175": "Répression",
  // 18x - ASSAULT
  "180": "Violence",
  "181": "Enlèvement / Prise d'otage",
  "182": "Agression physique",
  "183": "Attentat à la bombe",
  "184": "Bouclier humain",
  "185": "Tentative d'assassinat",
  "186": "Assassinat",
  // 19x - FIGHT
  "190": "Action militaire",
  "191": "Démonstration de force",
  "192": "Blocus naval",
  "193": "Frappe aérienne",
  "194": "Invasion terrestre",
  "195": "Bombardement",
  "196": "Armes chimiques/bio",
  // 20x - MASS VIOLENCE
  "200": "Violence de masse",
  "201": "Nettoyage ethnique",
  "202": "Armes de destruction",
  "203": "Crime de guerre",
  "204": "Génocide",
};

function getEventType(code: string): string {
  // Try exact match first
  if (EVENT_TYPES[code]) return EVENT_TYPES[code];
  // Try root code (first 2 digits)
  const rootCode = code.slice(0, 2) + "0";
  if (EVENT_TYPES[rootCode]) return EVENT_TYPES[rootCode];
  // Fallback based on root
  const root = parseInt(code.slice(0, 2));
  if (root === 14) return "Protestation";
  if (root === 17) return "Coercition";
  if (root === 18) return "Violence";
  if (root === 19) return "Combat";
  if (root === 20) return "Violence de masse";
  return "Incident";
}

function getConflictSize(goldstein: number): number {
  const severity = Math.abs(goldstein);
  return 12 + severity * 1.5; // 12px à 27px
}

function getConflictOpacity(mentions: number): number {
  return Math.min(0.5 + mentions / 50, 1); // 0.5 à 1.0
}

function formatTimeAgo(dateNum: number): string {
  const dateStr = String(dateNum);
  const year = parseInt(dateStr.slice(0, 4));
  const month = parseInt(dateStr.slice(4, 6)) - 1;
  const day = parseInt(dateStr.slice(6, 8));
  const eventDate = new Date(year, month, day);

  const seconds = Math.floor((Date.now() - eventDate.getTime()) / 1000);
  if (seconds < 60) return `il y a ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function getLocationShort(location: string): string {
  // Extract just city and country from "City, Region, Country"
  const parts = location.split(", ");
  if (parts.length >= 2) {
    return `${parts[0]}, ${parts[parts.length - 1]}`;
  }
  return location;
}

export function ConflictLayer() {
  const { conflicts, fetchConflicts } = useConflictStore();
  const { showConflicts } = useFilterStore();
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [modalConflict, setModalConflict] = useState<Conflict | null>(null);

  useEffect(() => {
    fetchConflicts();
    const interval = setInterval(fetchConflicts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchConflicts]);

  if (!showConflicts) return null;

  return (
    <>
      {conflicts.map((conflict) => (
        <Marker
          key={conflict.id}
          longitude={conflict.longitude}
          latitude={conflict.latitude}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedConflict(conflict);
          }}
        >
          <div
            className="rounded-full border-2 border-white/60 cursor-pointer transition-transform hover:scale-125"
            style={{
              width: getConflictSize(conflict.goldstein),
              height: getConflictSize(conflict.goldstein),
              backgroundColor: "#ef4444",
              opacity: getConflictOpacity(conflict.mentions),
              boxShadow: `0 0 ${Math.abs(conflict.goldstein)}px #ef4444`,
            }}
          />
        </Marker>
      ))}

      {selectedConflict && (
        <Popup
          longitude={selectedConflict.longitude}
          latitude={selectedConflict.latitude}
          anchor="bottom"
          onClose={() => setSelectedConflict(null)}
          closeButton={true}
          closeOnClick={false}
          className="conflict-popup"
          maxWidth="280px"
        >
          <div className="p-3">
            {/* Type d'événement */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold text-sm text-red-400">
                {getEventType(selectedConflict.eventCode)}
              </span>
            </div>

            {/* Lieu */}
            <p className="text-sm font-medium text-slate-100 mb-1">
              {getLocationShort(selectedConflict.location)}
            </p>
            <p className="text-xs text-slate-400 mb-2">
              {formatTimeAgo(selectedConflict.date)}
            </p>

            {/* Acteurs */}
            {(selectedConflict.actor1 || selectedConflict.actor2) && (
              <p className="text-xs text-slate-300 mb-2">
                {selectedConflict.actor1 || "?"} → {selectedConflict.actor2 || "?"}
              </p>
            )}

            {/* Stats rapides */}
            <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
              <span>{selectedConflict.mentions} articles</span>
              <span>•</span>
              <span>Gravité: {Math.abs(selectedConflict.goldstein).toFixed(0)}/10</span>
            </div>

            {/* Bouton détails */}
            <Button
              size="sm"
              variant="secondary"
              className="w-full text-xs"
              onClick={() => {
                setModalConflict(selectedConflict);
                setSelectedConflict(null);
              }}
            >
              Plus de détails
            </Button>
          </div>
        </Popup>
      )}

      {/* Modal détaillée */}
      <Dialog open={!!modalConflict} onOpenChange={() => setModalConflict(null)}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700">
          {modalConflict && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-400">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  {getEventType(modalConflict.eventCode)}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Lieu et date */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-100">
                    {modalConflict.location}
                  </h4>
                  <p className="text-sm text-slate-400">
                    {formatTimeAgo(modalConflict.date)}
                  </p>
                </div>

                {/* Acteurs */}
                {(modalConflict.actor1 || modalConflict.actor2) && (
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Acteurs impliqués</p>
                    <p className="text-sm text-slate-200">
                      <span className="font-medium">{modalConflict.actor1 || "Inconnu"}</span>
                      <span className="text-slate-500 mx-2">→</span>
                      <span className="font-medium">{modalConflict.actor2 || "Inconnu"}</span>
                    </p>
                  </div>
                )}

                {/* Métriques */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-800 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-400">
                      {Math.abs(modalConflict.goldstein).toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-500">Gravité /10</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg text-center">
                    <p className="text-2xl font-bold text-slate-200">
                      {modalConflict.mentions}
                    </p>
                    <p className="text-xs text-slate-500">Articles</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg text-center">
                    <p className="text-2xl font-bold text-slate-200">
                      {modalConflict.sources}
                    </p>
                    <p className="text-xs text-slate-500">Sources</p>
                  </div>
                </div>

                {/* Coordonnées */}
                <div className="text-xs text-slate-500">
                  Coordonnées: {modalConflict.latitude.toFixed(4)}, {modalConflict.longitude.toFixed(4)}
                </div>

                {/* Lien source */}
                {modalConflict.sourceUrl && (
                  <a
                    href={modalConflict.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button className="w-full" variant="default">
                      Lire l&apos;article source
                    </Button>
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
