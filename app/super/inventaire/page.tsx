"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import {
  CheckCircle2,
  Plus,
  Search,
  Box,
  ClipboardList,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface SuperInventoryLine {
  id: number;
  product: string;
  category: string;
  expected: number;
  actual: number;
  diff: number;
}

const mockSuperInv: SuperInventoryLine[] = [
  { id: 1, product: "Savon de Marseille", category: "Hygiène", expected: 120, actual: 115, diff: -5 },
  { id: 2, product: "Lait Bonnet Rouge", category: "Alimentation", expected: 45, actual: 45, diff: 0 },
  { id: 3, product: "Eau 1.5L (Pack)", category: "Boissons", expected: 24, actual: 22, diff: -2 },
];

export default function SuperInventairePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const columns = [
    {
      header: "Produit",
      accessor: (i: SuperInventoryLine) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground">{i.product}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">{i.category}</span>
        </div>
      ),
    },
    {
      header: "Théorique",
      accessor: (i: SuperInventoryLine) => <span className="text-xs font-bold text-zinc-500">{i.expected}</span>,
    },
    {
      header: "Réel",
      accessor: (i: SuperInventoryLine) => <span className="text-xs font-black text-foreground">{i.actual}</span>,
    },
    {
      header: "Écart",
      accessor: (i: SuperInventoryLine) => (
        <Badge variant={i.diff < 0 ? "danger" : i.diff > 0 ? "success" : "outline"}>
          {i.diff > 0 ? `+${i.diff}` : i.diff}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessor: (i: SuperInventoryLine) => (
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      ),
      className: "text-right",
    },
  ];

  return (
    <AppLayout
      title="Inventaire Tournant"
      subtitle="Contrôle régulier des stocks par rayon"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Lancer un Contrôle
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-primary">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Contrôles du Jour</p>
              <h4 className="text-xl font-black text-foreground">3 Rayons</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-red-500">
            <div className="p-3 bg-red-500/10 text-red-600 rounded-2xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Écarts détectés</p>
              <h4 className="text-xl font-black text-foreground">7 articles</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-emerald-500">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Taux de Précision</p>
              <h4 className="text-xl font-black text-foreground">98.2%</h4>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher un produit dans l'inventaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <DataTable columns={columns} data={mockSuperInv} />
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Lancer un Contrôle Rayon">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Rayon à contrôler</label>
            <select className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none">
              <option>Alimentation</option>
              <option>Boissons</option>
              <option>Hygiène</option>
              <option>Boulangerie</option>
            </select>
          </div>
          <Button variant="primary" className="mt-2" onClick={() => setIsModalOpen(false)}>Générer liste de comptage</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
