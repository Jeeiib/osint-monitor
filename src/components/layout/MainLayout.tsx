"use client";

import { Header } from "./Header";
import { EventSidebar } from "@/components/sidebar/EventSidebar";
import { useAlertSystem } from "@/lib/hooks/useAlertSystem";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  useAlertSystem();

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <Header />
      <div className="relative flex-1 overflow-hidden">
        <main className="h-full w-full">{children}</main>
        <EventSidebar />
      </div>
    </div>
  );
}
