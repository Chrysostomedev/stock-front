"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import {
  AlertCircle,
  Plus,
  Search,
  Trash2,
  Calendar,
  Package,
  TrendingDown,
} from "lucide-react";

interface ExpiredProduct {
  id: number;
  name: string;
  expiryDate: string;
  quantity: number;
  value: number;
  reason: "Périmé" | "Casse" | "Vol";
}

const mockExpired: ExpiredProduct[] = [
  { id: 1, name: "Yaourt Brassé x4", expiryDate: "05/05/2026", quantity: 5, value: 4250, reason: "Périmé" },
  { id: 2, name: "Bouteille Coca 1.5L", expiryDate: "10/12/2026", quantity: 2, value: 1600, reason: "Casse" },
  { id: 3, name: "Lait Bonnet Rouge", expiryDate: "01/05/2026", quantity: 3, value: 1500, reason: "Périmé" },
];

export default function SuperPerimesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const columns = [
    {
      header: "Produit",
      accessor: (p: ExpiredProduct) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground">{p.name}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">{p.reason}</span>
        </div>
      ),
    },
    {
      header: "Date Limite",
      accessor: (p: ExpiredProduct) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-zinc-400" />
          <span className="text-xs font-bold text-zinc-500">{p.expiryDate}</span>
        </div>
      ),
    },
    {
      header: "Quantité",
      accessor: (p: ExpiredProduct) => <span className="text-sm font-black text-foreground">{p.quantity}</span>,
    },
    {
      header: "Valeur Perte",
      accessor: (p: ExpiredProduct) => (
        <span className="text-sm font-black text-red-600">
          {p.value.toLocaleString()} FCFA
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (p: ExpiredProduct) => (
        <Button variant="outline" size="sm" className="h-8 px-2 text-red-500">
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Retirer
        </Button>
      ),
      className: "text-right",
    },
  ];

  return (
    <AppLayout
      title="Pertes & Périmés"
      subtitle="Gestion des produits impropres à la vente"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Déclarer une Perte
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-red-500">
            <div className="p-3 bg-red-500/10 text-red-600 rounded-2xl">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Perte Totale Mois</p>
              <h4 className="text-xl font-black text-foreground">12,450 FCFA</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-amber-500">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Produits à Retirer</p>
              <h4 className="text-xl font-black text-foreground">8 articles</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-primary">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Déclarations</p>
              <h4 className="text-xl font-black text-foreground">{mockExpired.length}</h4>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <DataTable columns={columns} data={mockExpired} />
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Déclarer une Perte">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Produit</label>
            <input type="text" placeholder="Nom du produit ou code barre" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Quantité</label>
              <input type="number" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Raison</label>
              <select className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none">
                <option>Périmé</option>
                <option>Casse / Dommage</option>
                <option>Vol constaté</option>
              </select>
            </div>
          </div>
          <Button variant="primary" className="mt-2" onClick={() => setIsModalOpen(false)}>Enregistrer la perte</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
