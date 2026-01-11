"use client";

import { useEffect, useState } from "react";
import { Marker, Popup } from "react-map-gl/mapbox";
import { useConflictStore, useFilterStore } from "@/lib/stores";
import type { Conflict } from "@/types/conflict";

function getConflictSize(goldstein: number): number {
  const severity = Math.abs(goldstein);
  return 10 + severity * 2; // 10px à 30px
}

function getConflictOpacity(mentions: number): number {
  return Math.min(0.4 + mentions / 20, 1); // 0.4 à 1.0
}

function formatTimeAgo(dateNum: number): string {
  // GDELT date format: YYYYMMDD
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

function isRecent(dateNum: number): boolean {
  const dateStr = String(dateNum);
  const year = parseInt(dateStr.slice(0, 4));
  const month = parseInt(dateStr.slice(4, 6)) - 1;
  const day = parseInt(dateStr.slice(6, 8));
  const eventDate = new Date(year, month, day);

  return Date.now() - eventDate.getTime() < 3600000; // < 1 hour
}

export function ConflictLayer() {
  const { conflicts, fetchConflicts } = useConflictStore();
  const { showConflicts } = useFilterStore();
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);

  useEffect(() => {
    fetchConflicts();
    const interval = setInterval(fetchConflicts, 5 * 60 * 1000); // Refresh every 5 min
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
            className={`rounded-full border-2 border-white/50 cursor-pointer transition-transform hover:scale-125 ${
              isRecent(conflict.date) ? "animate-pulse" : ""
            }`}
            style={{
              width: getConflictSize(conflict.goldstein),
              height: getConflictSize(conflict.goldstein),
              backgroundColor: "#ef4444",
              opacity: getConflictOpacity(conflict.mentions),
              boxShadow: `0 0 ${Math.abs(conflict.goldstein) * 2}px #ef4444`,
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
        >
          <div className="p-3 min-w-56">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="font-bold text-sm uppercase text-red-400">Conflit</span>
            </div>

            <p className="text-sm font-medium text-slate-200 mb-1">
              {selectedConflict.location}
            </p>
            <p className="text-xs text-slate-400 mb-3">
              {formatTimeAgo(selectedConflict.date)}
            </p>

            {(selectedConflict.actor1 || selectedConflict.actor2) && (
              <p className="text-xs text-slate-300 mb-2">
                <span className="text-slate-500">Acteurs:</span>{" "}
                {selectedConflict.actor1 || "?"} → {selectedConflict.actor2 || "?"}
              </p>
            )}

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-500">Gravité:</span>
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${Math.abs(selectedConflict.goldstein) * 10}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">
                {selectedConflict.goldstein.toFixed(1)}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              {selectedConflict.mentions} articles | {selectedConflict.sources} sources
            </p>

            {selectedConflict.sourceUrl && (
              <a
                href={selectedConflict.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline"
              >
                Voir source
              </a>
            )}
          </div>
        </Popup>
      )}
    </>
  );
}
