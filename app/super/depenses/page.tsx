"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import {
  Wallet,
  Plus,
  Search,
  Receipt,
  ArrowDownCircle,
  Zap,
  ShoppingBag,
  Trash2,
} from "lucide-react";

interface SuperExpense {
  id: number;
  label: string;
  category: "Fournitures" | "Nettoyage" | "Transport" | "Divers";
  amount: number;
  date: string;
}

const mockSuperExpenses: SuperExpense[] = [
  { id: 1, label: "Sacs plastiques x500", category: "Fournitures", amount: 15000, date: "10/05/2026" },
  { id: 2, label: "Produits de nettoyage", category: "Nettoyage", amount: 5500, date: "09/05/2026" },
  { id: 3, label: "Transport marchandise", category: "Transport", amount: 2000, date: "08/05/2026" },
];

export default function SuperDepensesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const columns = [
    {
      header: "Dépense",
      accessor: (e: SuperExpense) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground">{e.label}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">{e.category}</span>
        </div>
      ),
    },
    {
      header: "Montant",
      accessor: (e: SuperExpense) => (
        <span className="text-sm font-black text-red-500">
          -{e.amount.toLocaleString()} FCFA
        </span>
      ),
    },
    {
      header: "Date",
      accessor: (e: SuperExpense) => <span className="text-xs font-bold text-zinc-500">{e.date}</span>,
    },
    {
      header: "Actions",
      accessor: (e: SuperExpense) => (
        <button className="text-zinc-300 hover:text-red-500 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      ),
      className: "text-right",
    },
  ];

  return (
    <AppLayout
      title="Dépenses Boutique"
      subtitle="Suivi des petites charges de la supérette"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Enregistrer une Charge
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-red-500">
            <div className="p-3 bg-red-500/10 text-red-600 rounded-2xl">
              <ArrowDownCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Charges du Mois</p>
              <h4 className="text-xl font-black text-foreground">22,500 FCFA</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-primary">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fournitures</p>
              <h4 className="text-xl font-black text-foreground">15,000 FCFA</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-amber-500">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Utilités Boutique</p>
              <h4 className="text-xl font-black text-foreground">0 FCFA</h4>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher une dépense..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <DataTable columns={columns} data={mockSuperExpenses} />
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enregistrer une Charge">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Libellé</label>
            <input type="text" placeholder="Ex: Achat balais et détergent" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Montant (FCFA)</label>
              <input type="number" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Catégorie</label>
              <select className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none">
                <option>Fournitures</option>
                <option>Nettoyage</option>
                <option>Transport</option>
                <option>Divers</option>
              </select>
            </div>
          </div>
          <Button variant="primary" className="mt-2" onClick={() => setIsModalOpen(false)}>Valider la dépense</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
