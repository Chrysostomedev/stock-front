"use client";

import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

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
  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-background text-foreground select-none transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={title} subtitle={subtitle} backUrl={backUrl} rightElement={rightElement} />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
