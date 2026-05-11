"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import {
  Users,
  Plus,
  Search,
  Star,
  Gift,
  Phone,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface LoyalCustomer {
  id: number;
  name: string;
  phone: string;
  points: number;
  lastPurchase: string;
  status: "Bronze" | "Silver" | "Gold";
}

const mockLoyal: LoyalCustomer[] = [
  { id: 1, name: "Yao Amenan", phone: "0701020304", points: 1250, lastPurchase: "10/05/2026", status: "Gold" },
  { id: 2, name: "Konan Kouassi", phone: "0505060708", points: 450, lastPurchase: "08/05/2026", status: "Bronze" },
  { id: 3, name: "Touré Adama", phone: "0101010101", points: 890, lastPurchase: "09/05/2026", status: "Silver" },
];

export default function SuperFidelitePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const columns = [
    {
      header: "Client",
      accessor: (c: LoyalCustomer) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] font-black text-amber-600">
            {c.name[0]}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-foreground">{c.name}</span>
            <span className="text-[10px] text-zinc-400 font-bold">{c.phone}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Points Cumulés",
      accessor: (c: LoyalCustomer) => (
        <div className="flex items-center gap-2">
          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
          <span className="text-sm font-black text-foreground">{c.points.toLocaleString()} pts</span>
        </div>
      ),
    },
    {
      header: "Niveau",
      accessor: (c: LoyalCustomer) => {
        const variants: any = { Gold: "primary", Silver: "secondary", Bronze: "outline" };
        return <Badge variant={variants[c.status]}>{c.status}</Badge>;
      },
    },
    {
      header: "Dernière Visite",
      accessor: (c: LoyalCustomer) => <span className="text-xs font-bold text-zinc-500">{c.lastPurchase}</span>,
    },
    {
      header: "Actions",
      accessor: (c: LoyalCustomer) => (
        <Button variant="outline" size="sm" className="h-8 px-2">
          <Gift className="h-3.5 w-3.5 mr-1.5 text-primary" />
          Offrir Remise
        </Button>
      ),
      className: "text-right",
    },
  ];

  return (
    <AppLayout
      title="Fidélité Clients"
      subtitle="Gestion des clients réguliers et récompenses"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Client Fidèle
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-amber-500">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Points Distribués</p>
              <h4 className="text-xl font-black text-foreground">45,800 pts</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-primary">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Membres Actifs</p>
              <h4 className="text-xl font-black text-foreground">156</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-emerald-500">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Bons d'achat émis</p>
              <h4 className="text-xl font-black text-foreground">12</h4>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher un client fidèle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <DataTable columns={columns} data={mockLoyal} />
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau Client Fidèle">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Nom complet</label>
            <input type="text" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Téléphone</label>
            <input type="text" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none" />
          </div>
          <Button variant="primary" className="mt-2" onClick={() => setIsModalOpen(false)}>Enregistrer l'adhésion</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
