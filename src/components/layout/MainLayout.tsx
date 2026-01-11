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
