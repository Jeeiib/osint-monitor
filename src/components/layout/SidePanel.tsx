"use client";

import { useState } from "react";
import { Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SidePanel() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="absolute right-4 top-20 z-10 bg-slate-900/90 border-slate-700"
        onClick={() => setIsOpen(true)}
      >
        <Maximize2 className="h-4 w-4 mr-2" />
        Panel
      </Button>
    );
  }

  return (
    <aside className="w-80 border-l border-slate-800 bg-slate-900/80 backdrop-blur flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h2 className="font-semibold text-slate-200">Social Intel</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
          <Minimize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-slate-800 bg-transparent px-4 h-10">
          <TabsTrigger value="all" className="text-xs data-[state=active]:bg-slate-800">Tous</TabsTrigger>
          <TabsTrigger value="conflicts" className="text-xs data-[state=active]:bg-slate-800">Conflits</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs data-[state=active]:bg-slate-800">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 overflow-auto p-4 mt-0">
          <div className="text-center text-slate-500 py-8">
            <p className="text-sm">Aucun événement pour le moment</p>
            <p className="text-xs mt-2">Les tweets apparaîtront ici</p>
          </div>
        </TabsContent>

        <TabsContent value="conflicts" className="flex-1 overflow-auto p-4 mt-0">
          <div className="text-center text-slate-500 py-8">
            <p className="text-sm">Conflits</p>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="flex-1 overflow-auto p-4 mt-0">
          <div className="text-center text-slate-500 py-8">
            <p className="text-sm">Alertes</p>
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
