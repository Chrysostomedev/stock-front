"use client";

import AppLayout from "@/components/layouts/AppLayout";
import SalesCalendar from "@/app/admin/dashboard/components/SalesCalendar";
import { CalendarDays } from "lucide-react";

export default function AgendaPage() {
  return (
    <AppLayout title="Agenda des ventes">
      <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-24 md:pb-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <CalendarDays className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xl text-muted-foreground">
              Vue calendrier — chiffre d&apos;affaires et marges par jour
            </p>
          </div>
        </div>

        {/* Calendar */}
        <SalesCalendar />
      </div>
    </AppLayout>
  );
}
