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
  Wallet,
  Plus,
  Search,
  Receipt,
  ArrowDownCircle,
  Truck,
  Zap,
  Home,
  Tag,
} from "lucide-react";

interface Expense {
  id: number;
  label: string;
  category: "Logistique" | "Loyer" | "Utilités" | "Divers";
  amount: number;
  date: string;
  status: "Payé" | "En attente";
}

const mockExpenses: Expense[] = [
  { id: 1, label: "Carburant Tricycle Livraison", category: "Logistique", amount: 5000, date: "10/05/2026", status: "Payé" },
  { id: 2, label: "Facture CIE Boutique", category: "Utilités", amount: 15400, date: "09/05/2026", status: "Payé" },
  { id: 3, label: "Loyer Magasin Mai", category: "Loyer", amount: 250000, date: "01/05/2026", status: "Payé" },
];

export default function QuincDepensesPage() {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const columns = [
    {
      header: "Libellé de la dépense",
      accessor: (e: Expense) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground">{e.label}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">{e.category}</span>
        </div>
      ),
    },
    {
      header: "Montant",
      accessor: (e: Expense) => (
        <span className="text-sm font-black text-red-500">
          -{e.amount.toLocaleString()} FCFA
        </span>
      ),
    },
    {
      header: "Date",
      accessor: (e: Expense) => (
        <span className="text-xs font-bold text-zinc-500">{e.date}</span>
      ),
    },
    {
      header: "Statut",
      accessor: (e: Expense) => (
        <Badge variant={e.status === "Payé" ? "success" : "outline"}>{e.status}</Badge>
      ),
    },
  ];

  return (
    <AppLayout
      title="Dépenses & Charges"
      subtitle="Suivi des coûts opérationnels Quincaillerie"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Dépense
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 flex flex-col gap-2">
            <div className="p-2 w-fit bg-red-500/10 text-red-600 rounded-xl">
              <ArrowDownCircle className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Charges Mois</p>
            <h4 className="text-lg font-black text-foreground">270,400 FCFA</h4>
          </Card>
          <Card className="p-4 flex flex-col gap-2">
            <div className="p-2 w-fit bg-primary/10 text-primary rounded-xl">
              <Truck className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Frais Logistique</p>
            <h4 className="text-lg font-black text-foreground">5,000 FCFA</h4>
          </Card>
          <Card className="p-4 flex flex-col gap-2">
            <div className="p-2 w-fit bg-amber-500/10 text-amber-600 rounded-xl">
              <Home className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Loyers & Taxes</p>
            <h4 className="text-lg font-black text-foreground">250,000 FCFA</h4>
          </Card>
          <Card className="p-4 flex flex-col gap-2">
            <div className="p-2 w-fit bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Zap className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Utilités (CIE/SODECI)</p>
            <h4 className="text-lg font-black text-foreground">15,400 FCFA</h4>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher une dépense..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
          <DataTable columns={columns} data={mockExpenses} />
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enregistrer une dépense">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Libellé</label>
            <input type="text" placeholder="Ex: Achat carburant" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Catégorie</label>
              <select className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none">
                <option>Logistique</option>
                <option>Loyer</option>
                <option>Utilités</option>
                <option>Divers</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Montant (FCFA)</label>
              <input type="number" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none" />
            </div>
          </div>
          <Button variant="primary" className="mt-2" onClick={() => setIsModalOpen(false)}>Valider la dépense</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
