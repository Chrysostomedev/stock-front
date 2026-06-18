"use client";

import AppLayout from "@/components/layouts/AppLayout";
import SalesCalendar from "@/app/admin/dashboard/components/SalesCalendar";
import { CalendarDays, TrendingUp, BarChart2 } from "lucide-react";

export default function AgendaPage() {
  return (
    <AppLayout title="Agenda des ventes">
      <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-28 md:pb-8">

        {/* ── Hero header ── */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-6 shadow-xl shadow-blue-500/20">
          {/* Cercles décoratifs */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-6 w-52 h-52 rounded-full bg-white/5" />
          <div className="absolute top-4 right-24 w-16 h-16 rounded-full bg-indigo-400/20" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-3 bg-white/15 backdrop-blur-sm rounded-2xl flex-shrink-0">
                <CalendarDays className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
                  Agenda des ventes
                </h1>
                <p className="text-blue-100 text-sm font-medium mt-0.5">
                  Visualisez vos performances jour par jour
                </p>
              </div>
            </div>

            {/* Badges info */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 rounded-xl">
                <TrendingUp className="h-3.5 w-3.5 text-blue-100" />
                <span className="text-white text-[11px] font-black">CA & Marges</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 rounded-xl">
                <BarChart2 className="h-3.5 w-3.5 text-blue-100" />
                <span className="text-white text-[11px] font-black">Par boutique</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Calendrier ── */}
        <SalesCalendar />

      </div>
    </AppLayout>
  );
}
