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
  Truck,
  Plus,
  Search,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Navigation,
} from "lucide-react";

interface Delivery {
  id: number;
  orderId: string;
  customer: string;
  destination: string;
  driver: string;
  vehicle: "Tricycle" | "Camion 5T" | "Camion 10T";
  status: "En attente" | "En cours" | "Livré" | "Annulé";
}

const mockDeliveries: Delivery[] = [
  { id: 1, orderId: "TK-2026-001", customer: "M. Kouassi", destination: "Cocody Riviera 3", driver: "Bakary", vehicle: "Tricycle", status: "En cours" },
  { id: 2, orderId: "TK-2026-045", customer: "Chantier BTP", destination: "Bingerville (EIT)", driver: "Sidiki", vehicle: "Camion 5T", status: "En attente" },
  { id: 3, orderId: "TK-2026-002", customer: "Mme Bakayoko", destination: "Angré 7e Tranche", driver: "Moussa", vehicle: "Tricycle", status: "Livré" },
];

export default function QuincLivraisonsPage() {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const columns = [
    {
      header: "N° Commande",
      accessor: (d: Delivery) => (
        <span className="text-sm font-black text-foreground">{d.orderId}</span>
      ),
    },
    {
      header: "Client / Destination",
      accessor: (d: Delivery) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground">{d.customer}</span>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-zinc-400" />
            <span className="text-[10px] text-zinc-400 font-bold">{d.destination}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Véhicule / Chauffeur",
      accessor: (d: Delivery) => (
        <div className="flex flex-col">
          <Badge variant="outline" className="w-fit text-[9px] mb-1">{d.vehicle}</Badge>
          <span className="text-xs font-bold text-zinc-500">{d.driver}</span>
        </div>
      ),
    },
    {
      header: "Statut",
      accessor: (d: Delivery) => {
        const variants: any = {
          "En attente": "outline",
          "En cours": "primary",
          "Livré": "success",
          "Annulé": "danger",
        };
        return <Badge variant={variants[d.status]}>{d.status}</Badge>;
      },
    },
    {
      header: "Action",
      accessor: (d: Delivery) => (
        <Button variant="outline" size="sm" className="h-8 px-2">
          <Navigation className="h-3.5 w-3.5" />
        </Button>
      ),
      className: "text-right",
    },
  ];

  return (
    <AppLayout
      title="Livraisons & Logistique"
      subtitle="Suivi des camions et tricycles Quincaillerie"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Planifier Livraison
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 flex flex-col gap-2">
            <div className="p-2 w-fit bg-primary/10 text-primary rounded-xl">
              <Truck className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">En cours</p>
            <h4 className="text-lg font-black text-foreground">3 Livraisons</h4>
          </Card>
          <Card className="p-4 flex flex-col gap-2">
            <div className="p-2 w-fit bg-amber-500/10 text-amber-600 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">En attente</p>
            <h4 className="text-lg font-black text-foreground">5 Missions</h4>
          </Card>
          <Card className="p-4 flex flex-col gap-2">
            <div className="p-2 w-fit bg-emerald-500/10 text-emerald-600 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Terminées (Jour)</p>
            <h4 className="text-lg font-black text-foreground">12</h4>
          </Card>
          <Card className="p-4 flex flex-col gap-2">
            <div className="p-2 w-fit bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-xl">
              <User className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Chauffeurs actifs</p>
            <h4 className="text-lg font-black text-foreground">4</h4>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher une livraison (client, destination...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
          <DataTable columns={columns} data={mockDeliveries} />
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle Livraison">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Commande / Client</label>
            <select className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none">
              <option>TK-2026-056 - M. Bakayoko</option>
              <option>TK-2026-057 - Chantier Riviera</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Destination</label>
            <input type="text" placeholder="Ex: Cocody, Riviera Palmeraie" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Véhicule</label>
              <select className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none">
                <option>Tricycle</option>
                <option>Camion 5T</option>
                <option>Camion 10T</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Chauffeur</label>
              <select className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none">
                <option>Bakary</option>
                <option>Sidiki</option>
                <option>Moussa</option>
              </select>
            </div>
          </div>
          <Button variant="primary" className="mt-2" onClick={() => setIsModalOpen(false)}>Confirmer la planification</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
