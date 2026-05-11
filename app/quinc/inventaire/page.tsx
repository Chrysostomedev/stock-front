"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import {
  CheckCircle2,
  Plus,
  Search,
  Box,
  RefreshCw,
  AlertTriangle,
  FileText,
  ClipboardCheck,
} from "lucide-react";

interface InventoryLine {
  id: number;
  product: string;
  expectedStock: number;
  actualStock: number;
  diff: number;
  date: string;
}

const mockInventory: InventoryLine[] = [
  { id: 1, product: "Ciment Bélier 50kg", expectedStock: 120, actualStock: 118, diff: -2, date: "10/05/2026" },
  { id: 2, product: "Fer à Béton 8mm", expectedStock: 450, actualStock: 450, diff: 0, date: "10/05/2026" },
  { id: 3, product: "Pointes 70mm", expectedStock: 35, actualStock: 32, diff: -3, date: "10/05/2026" },
];

export default function QuincInventairePage() {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const columns = [
    {
      header: "Matériau",
      accessor: (i: InventoryLine) => (
        <span className="text-sm font-black text-foreground">{i.product}</span>
      ),
    },
    {
      header: "Stock Théorique",
      accessor: (i: InventoryLine) => (
        <span className="text-xs font-bold text-zinc-500">{i.expectedStock}</span>
      ),
    },
    {
      header: "Stock Physique",
      accessor: (i: InventoryLine) => (
        <span className="text-xs font-bold text-foreground">{i.actualStock}</span>
      ),
    },
    {
      header: "Différence",
      accessor: (i: InventoryLine) => (
        <span className={`text-xs font-black ${i.diff < 0 ? "text-red-500" : i.diff > 0 ? "text-emerald-500" : "text-zinc-400"}`}>
          {i.diff > 0 ? `+${i.diff}` : i.diff}
        </span>
      ),
    },
    {
      header: "Date Contrôle",
      accessor: (i: InventoryLine) => (
        <span className="text-xs font-bold text-zinc-400">{i.date}</span>
      ),
    },
    {
      header: "Action",
      accessor: (i: InventoryLine) => (
        <Button variant="outline" size="sm" className="h-8 px-2">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      ),
      className: "text-right",
    },
  ];

  return (
    <AppLayout
      title="Inventaire Quincaillerie"
      subtitle="Contrôle physique et ajustements de stock"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <ClipboardCheck className="h-4 w-4 mr-2" />
          Nouvel Inventaire
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-primary">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Box className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Articles contrôlés</p>
              <h4 className="text-xl font-black text-foreground">124</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-red-500">
            <div className="p-3 bg-red-500/10 text-red-600 rounded-2xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Écarts constatés</p>
              <h4 className="text-xl font-black text-foreground">-12 sacs / 4 barres</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-emerald-500">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Dernier inventaire complet</p>
              <h4 className="text-xl font-black text-foreground">01/05/2026</h4>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher un contrôle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
          <DataTable columns={columns} data={mockInventory} />
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Lancer un inventaire">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-zinc-500 leading-relaxed">Veuillez sélectionner le rayon ou le type de matériau à contrôler physiquement.</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Rayon / Catégorie</label>
            <select className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none">
              <option>Gros Oeuvre (Ciment, Fers)</option>
              <option>Peinture & Décoration</option>
              <option>Petite Quincaillerie</option>
              <option>Outillage</option>
            </select>
          </div>
          <Button variant="primary" className="mt-2" onClick={() => setIsModalOpen(false)}>Générer la feuille de comptage</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
