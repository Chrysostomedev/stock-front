"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import { 
  FileText, 
  Search, 
  Store, 
  Calendar,
  TrendingUp,
  Download
} from "lucide-react";

export default function AdminGlobalCommandesPage() {
  const [search, setSearch] = useState("");

  const mockSales = [
    { id: "TK-9901", shop: "Marcory", total: 15000, method: "cash", date: "10/05/2026" },
    { id: "TK-9902", shop: "Angré", total: 45000, method: "credit", date: "10/05/2026" },
    { id: "TK-9903", shop: "Riviera", total: 8500, method: "mtn", date: "10/05/2026" },
  ];

  const columns = [
    { header: "N° Ticket", accessor: (s: any) => <span className="font-black">{s.id}</span> },
    { header: "Boutique", accessor: (s: any) => (
      <div className="flex items-center gap-2">
        <Store className="h-3 w-3 text-zinc-400" />
        <span className="text-xs font-bold">{s.shop}</span>
      </div>
    )},
    { header: "Montant", accessor: (s: any) => <span className="font-black text-primary">{s.total.toLocaleString()} FCFA</span> },
    { header: "Paiement", accessor: (s: any) => <Badge variant={s.method === 'cash' ? 'success' : 'primary'}>{s.method}</Badge> },
    { header: "Date", accessor: (s: any) => <span className="text-xs text-zinc-500 font-bold">{s.date}</span> },
  ];

  return (
    <AppLayout title="Supervision des Ventes" subtitle="Vue globale de toutes les boutiques">
      <Card className="p-6">
        <div className="flex justify-between mb-6">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Rechercher par ticket ou boutique..."
              className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
            />
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Exporter Rapport
          </Button>
        </div>
        <DataTable columns={columns} data={mockSales} />
      </Card>
    </AppLayout>
  );
}
