"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, UserCircle, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/contexts/SidebarContext";

interface NavbarProps {
  title: string;
  subtitle?: string;
  backUrl?: string;
  rightElement?: React.ReactNode;
}

export default function Navbar({ title, subtitle, backUrl, rightElement }: NavbarProps) {
  const { logout } = useAuth();
  const { toggle } = useSidebar();
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60 min-h-[4rem] py-2 shrink-0 w-full flex items-center select-none">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
        {/* Left Part: Title or Back Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={toggle}
            className="flex sm:hidden items-center justify-center h-10 w-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
            title="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {backUrl && (
            <Link
              href={backUrl}
              className="flex items-center justify-center h-10 w-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
              title="Retour"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          <div className="flex flex-col">
            <h1 className="text-base font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight select-none">
              {title}
            </h1>
            {subtitle && (
              <span className="text-xs font-bold text-primary">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Right Part: Profile, Notification or Custom Element */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          {rightElement ? (
            rightElement
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => router.push("/notifications")}
                className="flex items-center justify-center h-10 w-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
              </button>
              <Link
                href="/profile"
                className="flex items-center justify-center h-10 w-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
                title="Profil utilisateur"
              >
                <UserCircle className="h-5 w-5" />
              </Link>
              <button
                onClick={logout}
                className="flex items-center justify-center h-10 w-10 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                title="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
