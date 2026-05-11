"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";
import {
  FileText,
  Search,
  Calendar,
  User,
  TrendingUp,
  Clock,
  Trash2,
  Printer,
  ChevronRight,
} from "lucide-react";

interface Order {
  id: string;
  customer: string;
  total: number;
  paymentMethod: "cash" | "mtn" | "moov" | "credit";
  status: "validé" | "en_attente";
  date: string;
  time: string;
}

const mockOrders: Order[] = [
  { id: "TK-4512", customer: "Client de passage", total: 12500, paymentMethod: "cash", status: "validé", date: "10/05/2026", time: "14:20" },
  { id: "TK-4513", customer: "M. Kouassi", total: 45000, paymentMethod: "credit", status: "validé", date: "10/05/2026", time: "14:45" },
  { id: "TK-4514", customer: "Client de passage", total: 8500, paymentMethod: "mtn", status: "validé", date: "09/05/2026", time: "10:15" },
];

export default function SuperCommandesPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const columns = [
    {
      header: "N° Ticket",
      accessor: (o: Order) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-zinc-400" />
          <span className="font-black text-foreground">{o.id}</span>
        </div>
      ),
    },
    {
      header: "Client",
      accessor: (o: Order) => (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-zinc-400" />
          <span className="text-xs font-bold">{o.customer}</span>
        </div>
      ),
    },
    {
      header: "Date & Heure",
      accessor: (o: Order) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground">{o.date}</span>
          <span className="text-[10px] text-zinc-400 font-bold">{o.time}</span>
        </div>
      ),
    },
    {
      header: "Montant",
      accessor: (o: Order) => (
        <span className="text-primary font-black">{o.total.toLocaleString()} FCFA</span>
      ),
    },
    {
      header: "Paiement",
      accessor: (o: Order) => {
        const colors: any = {
          cash: "success",
          mtn: "primary",
          moov: "secondary",
          credit: "danger",
        };
        return (
          <Badge variant={colors[o.paymentMethod]} className="uppercase text-[9px]">
            {o.paymentMethod}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      accessor: (o: Order) => (
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all">
            <Printer className="h-4 w-4" />
          </button>
          <button 
            onClick={() => { setOrderToDelete(o); setIsConfirmOpen(true); }}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-zinc-400 hover:text-red-600 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <AppLayout
      title="Historique des Ventes"
      subtitle="Journal détaillé des transactions du supermarché"
    >
      <div className="flex flex-col gap-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Chiffre d'Affaires</p>
              <h4 className="text-2xl font-black text-foreground">1,450,000 FCFA</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tickets Émis</p>
              <h4 className="text-2xl font-black text-foreground">142</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Vente Moyenne</p>
              <h4 className="text-2xl font-black text-foreground">10,200 FCFA</h4>
            </div>
          </Card>
        </div>

        <Card className="p-6 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher par ticket ou client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => showToast("Filtre mois en cours activé", "info")}>
                <Calendar className="h-4 w-4 mr-2" />
                Mois en cours
              </Button>
            </div>
          </div>

          <DataTable columns={columns} data={mockOrders} />
        </Card>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          showToast("Vente annulée", "info");
          setIsConfirmOpen(false);
        }}
        title="Annuler la vente"
        message={`Voulez-vous vraiment annuler le ticket ${orderToDelete?.id} ? Cette action impactera les stocks.`}
      />
    </AppLayout>
  );
}
