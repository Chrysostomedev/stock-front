"use client";

import { Suspense } from "react";
import AdminCaisseInner from "./AdminCaisseInner";
import AppLayout from "@/components/layouts/AppLayout";

function CaisseLoading() {
  return (
    <AppLayout title="Caisse" subtitle="Chargement…">
      <div className="flex items-center justify-center h-64 opacity-40">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    </AppLayout>
  );
}

export default function AdminCaissePage() {
  return (
    <Suspense fallback={<CaisseLoading />}>
      <AdminCaisseInner />
    </Suspense>
  );
}
