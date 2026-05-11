"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { 
  Plus, 
  Search, 
  Building2, 
  Edit2, 
  Trash2, 
  MapPin, 
  Phone,
  Power,
} from "lucide-react";

interface Shop {
  id: number;
  name: string;
  location: string;
  phone: string;
  status: "actif" | "inactif";
  type: "Superette" | "Quincaillerie";
}

const mockShops: Shop[] = [
  { id: 1, name: "Boutique Marcory", location: "Marcory Résidentiel", phone: "0707070707", status: "actif", type: "Superette" },
  { id: 2, name: "Dépôt Angré", location: "Angré 8ème Tranche", phone: "0505050505", status: "actif", type: "Quincaillerie" },
];

export default function AdminBoutiquesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shops, setShops] = useState<Shop[]>(mockShops);

  const columns = [
    {
      header: "Boutique",
      accessor: (s: Shop) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground">{s.name}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">{s.type}</span>
        </div>
      ),
    },
    {
      header: "Localisation",
      accessor: (s: Shop) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-zinc-400" />
          <span className="text-xs font-bold">{s.location}</span>
        </div>
      ),
    },
    {
      header: "Contact",
      accessor: (s: Shop) => (
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3 text-zinc-400" />
          <span className="text-xs font-bold">{s.phone}</span>
        </div>
      ),
    },
    {
      header: "Statut",
      accessor: (s: Shop) => (
        <Badge variant={s.status === "actif" ? "success" : "outline"}>{s.status}</Badge>
      ),
    },
    {
      header: "Actions",
      accessor: (s: Shop) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setSelectedShop(s); setIsModalOpen(true); }}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button 
            onClick={() => { setSelectedShop(s); setIsConfirmOpen(true); }}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-zinc-400 hover:text-red-600 transition-all"
          >
            <Power className="h-4 w-4" />
          </button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <AppLayout
      title="Gestion des Boutiques"
      subtitle="Configurez vos points de vente et entrepôts"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => { setSelectedShop(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une Boutique
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <Card className="p-6">
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher une boutique..."
              className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <DataTable columns={columns} data={shops} />
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedShop ? "Modifier Boutique" : "Nouvelle Boutique"}
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Nom de la boutique</label>
              <input 
                type="text" 
                defaultValue={selectedShop?.name}
                placeholder="Ex: Boutique Marcory"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Type</label>
              <select 
                defaultValue={selectedShop?.type}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                <option value="Superette">Superette</option>
                <option value="Quincaillerie">Quincaillerie</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Localisation</label>
            <input 
              type="text" 
              defaultValue={selectedShop?.location}
              placeholder="Ex: Abidjan, Cocody"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Téléphone</label>
            <input 
              type="text" 
              defaultValue={selectedShop?.phone}
              placeholder="Ex: 0707070707"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <Button variant="primary" className="mt-2" onClick={() => setIsModalOpen(false)}>
            {selectedShop ? "Enregistrer les modifications" : "Créer la boutique"}
          </Button>
        </div>
      </Modal>

      {/* Activation/Désactivation Confirm */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setShops(shops.map(s => s.id === selectedShop?.id ? { ...s, status: s.status === 'actif' ? 'inactif' : 'actif' } : s));
          setIsConfirmOpen(false);
        }}
        title={selectedShop?.status === 'actif' ? "Désactiver la boutique" : "Activer la boutique"}
        message={`Voulez-vous vraiment ${selectedShop?.status === 'actif' ? 'désactiver' : 'activer'} la boutique "${selectedShop?.name}" ?`}
        confirmLabel={selectedShop?.status === 'actif' ? "Désactiver" : "Activer"}
        variant={selectedShop?.status === 'actif' ? "danger" : "primary"}
      />
    </AppLayout>
  );
}
