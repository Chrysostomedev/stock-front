"use client";

import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuth } from "@/app/context/useContext";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  backUrl?: string;
  rightElement?: React.ReactNode;
}

export default function AppLayout({
  children,
  title,
  subtitle,
  backUrl,
  rightElement,
}: AppLayoutProps) {
  const { loading } = useAuth();

  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-background text-foreground select-none transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={title} subtitle={subtitle} backUrl={backUrl} rightElement={rightElement} />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
          {loading ? (
            /* Skeleton léger pendant la vérification du token — 
               n'empêche pas le rendu de la sidebar et de la navbar */
            <div className="flex flex-col gap-4 animate-pulse">
              <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
                ))}
              </div>
              <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
