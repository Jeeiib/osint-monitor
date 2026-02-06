"use client";

import { Header } from "./Header";
import { EventSidebar } from "@/components/sidebar/EventSidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
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
