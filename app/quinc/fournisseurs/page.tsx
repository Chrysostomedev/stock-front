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
  Building2,
  Plus,
  Search,
  Truck,
  Phone,
  DollarSign,
  Calendar,
  FileText,
} from "lucide-react";

interface Supplier {
  id: number;
  name: string;
  category: string;
  contact: string;
  phone: string;
  debt: number;
  lastDelivery: string;
}

const mockSuppliers: Supplier[] = [
  { id: 1, name: "SOTACI CI", category: "Fers & Acier", contact: "M. Traoré", phone: "0701020304", debt: 1250000, lastDelivery: "10/05/2026" },
  { id: 2, name: "SCA (Soc. Ciment Abidjan)", category: "Ciment", contact: "Mme Bakayoko", phone: "0505060708", debt: 0, lastDelivery: "08/05/2026" },
  { id: 3, name: "Bernabé CI", category: "Outillage", contact: "M. Koffi", phone: "0101010101", debt: 85000, lastDelivery: "05/05/2026" },
];

export default function QuincFournisseursPage() {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const columns = [
    {
      header: "Fournisseur",
      accessor: (s: Supplier) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground">{s.name}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">{s.category}</span>
        </div>
      ),
    },
    {
      header: "Contact",
      accessor: (s: Supplier) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground">{s.contact}</span>
          <span className="text-[10px] text-zinc-400 font-bold">{s.phone}</span>
        </div>
      ),
    },
    {
      header: "Solde Dette",
      accessor: (s: Supplier) => (
        <span className={`text-sm font-black ${s.debt > 0 ? "text-red-600" : "text-emerald-600"}`}>
          {s.debt.toLocaleString()} FCFA
        </span>
      ),
    },
    {
      header: "Dernière Livraison",
      accessor: (s: Supplier) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-zinc-400" />
          <span className="text-xs font-bold text-zinc-500">{s.lastDelivery}</span>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (s: Supplier) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 px-2">
            <Truck className="h-3.5 w-3.5 mr-1.5" />
            Commander
          </Button>
          <Button variant="secondary" size="sm" className="h-8 px-2">
            <DollarSign className="h-3.5 w-3.5 mr-1.5" />
            Régler
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <AppLayout
      title="Fournisseurs Quincaillerie"
      subtitle="Gestion des approvisionnements et dettes"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Fournisseur
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-red-500">
            <div className="p-3 bg-red-500/10 text-red-600 rounded-2xl">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Dette Fournisseur Totale</p>
              <h4 className="text-xl font-black text-foreground">1,335,000 FCFA</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-primary">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Commandes en cours</p>
              <h4 className="text-xl font-black text-foreground">3</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-amber-500">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Fournisseurs</p>
              <h4 className="text-xl font-black text-foreground">{mockSuppliers.length}</h4>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher un fournisseur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
          <DataTable columns={columns} data={mockSuppliers} />
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ajouter un Fournisseur">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Raison Sociale</label>
            <input type="text" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Catégorie</label>
              <select className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none">
                <option>Ciment</option>
                <option>Fers & Acier</option>
                <option>Peinture</option>
                <option>Outillage</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Téléphone</label>
              <input type="text" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none" />
            </div>
          </div>
          <Button variant="primary" className="mt-2" onClick={() => setIsModalOpen(false)}>Enregistrer</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
