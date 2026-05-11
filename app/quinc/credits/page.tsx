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
  Users,
  Search,
  DollarSign,
  AlertTriangle,
  History,
  CheckCircle,
  FileText,
  UserPlus,
} from "lucide-react";

interface Credit {
  id: number;
  customer: string;
  phone: string;
  totalDebt: number;
  lastPayment: string;
  status: "Sain" | "Risqué" | "Contentieux";
}

const mockCredits: Credit[] = [
  { id: 1, customer: "M. Kouadio Bakayoko", phone: "0708091011", totalDebt: 450000, lastPayment: "02/05/2026", status: "Risqué" },
  { id: 2, customer: "Chantier Riviera 3", phone: "0505050505", totalDebt: 1250000, lastPayment: "10/05/2026", status: "Contentieux" },
  { id: 3, customer: "Mme Yao Flore", phone: "0102030405", totalDebt: 85000, lastPayment: "09/05/2026", status: "Sain" },
];

export default function QuincCreditsPage() {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const columns = [
    {
      header: "Client / Chantier",
      accessor: (c: Credit) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground">{c.customer}</span>
          <span className="text-[10px] text-zinc-400 font-bold">{c.phone}</span>
        </div>
      ),
    },
    {
      header: "Dette Totale",
      accessor: (c: Credit) => (
        <span className="text-sm font-black text-red-600">
          {c.totalDebt.toLocaleString()} FCFA
        </span>
      ),
    },
    {
      header: "Statut",
      accessor: (c: Credit) => {
        const variants: any = {
          Sain: "success",
          Risqué: "warning",
          Contentieux: "danger",
        };
        return <Badge variant={variants[c.status]}>{c.status}</Badge>;
      },
    },
    {
      header: "Dernier Versement",
      accessor: (c: Credit) => (
        <span className="text-xs font-bold text-zinc-500">{c.lastPayment}</span>
      ),
    },
    {
      header: "Actions",
      accessor: (c: Credit) => (
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" className="h-8 px-2" onClick={() => showToast("Encaissement ouvert", "info")}>
            <DollarSign className="h-3.5 w-3.5 mr-1.5" />
            Encaisser
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-2">
            <History className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <AppLayout
      title="Crédits & Clients"
      subtitle="Suivi des impayés et recouvrement"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nouveau Compte Client
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-red-600">
            <div className="p-3 bg-red-600/10 text-red-600 rounded-2xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Créances Dehors</p>
              <h4 className="text-xl font-black text-foreground">4,785,000 FCFA</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-emerald-600">
            <div className="p-3 bg-emerald-600/10 text-emerald-600 rounded-2xl">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Recouvrements (Mois)</p>
              <h4 className="text-xl font-black text-foreground">1,200,000 FCFA</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-primary">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Clients Actifs</p>
              <h4 className="text-xl font-black text-foreground">42</h4>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher un client ou chantier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
          <DataTable columns={columns} data={mockCredits} />
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau Client Quinc.">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Nom Complet / Chantier</label>
            <input type="text" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Téléphone</label>
            <input type="text" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Plafond de Crédit Autorisé (FCFA)</label>
            <input type="number" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none" />
          </div>
          <Button variant="primary" className="mt-2" onClick={() => setIsModalOpen(false)}>Créer le compte</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
