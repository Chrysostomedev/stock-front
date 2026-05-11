"use client";

import React from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";

export default function AdminDevisPage() {
  return (
    <AppLayout title="Devis & Factures" subtitle="Supervision des documents commerciaux">
      <Card className="p-10 text-center opacity-50">
        <p className="text-sm font-bold italic">Cette section est en cours de centralisation...</p>
      </Card>
    </AppLayout>
  );
}