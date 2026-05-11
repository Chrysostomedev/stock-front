"use client";

import React from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";

export default function AdminProduitsPage() {
  return (
    <AppLayout title="Catalogue Global" subtitle="Supervision des stocks toutes boutiques">
      <Card className="p-10 text-center opacity-50">
        <p className="text-sm font-bold italic">Centralisation du catalogue en cours...</p>
      </Card>
    </AppLayout>
  );
}
