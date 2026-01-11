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
