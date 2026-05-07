import { ReactNode } from "react";
import { Sidebar, MobileNav } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex w-full">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-10 animate-fade-in">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
