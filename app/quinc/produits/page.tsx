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
  Plus,
  Search,
  Wrench,
  AlertTriangle,
  Edit2,
  Trash2,
  Download,
  Package,
  ArrowUpRight,
} from "lucide-react";

interface Material {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: "Sac" | "Barre" | "Seau" | "Paquet" | "Unité";
}

const mockMaterials: Material[] = [
  { id: 1, name: "Ciment Bélier 50kg", category: "Gros Oeuvre", price: 4500, stock: 120, unit: "Sac" },
  { id: 2, name: "Fer à Béton 8mm", category: "Fers", price: 600, stock: 450, unit: "Barre" },
  { id: 3, name: "Pointes 70mm", category: "Quincaillerie", price: 850, stock: 35, unit: "Paquet" },
  { id: 4, name: "Peinture Ripolin Blanc", category: "Peinture", price: 18500, stock: 12, unit: "Seau" },
];

export default function QuincProduitsPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);

  const filtered = materials.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: "Matériau",
      accessor: (m: Material) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground">{m.name}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">{m.category}</span>
        </div>
      ),
    },
    {
      header: "Unité",
      accessor: (m: Material) => (
        <Badge variant="outline">{m.unit}</Badge>
      ),
    },
    {
      header: "Prix Unitaire",
      accessor: (m: Material) => (
        <span className="text-primary font-black">{m.price.toLocaleString()} FCFA</span>
      ),
    },
    {
      header: "Stock",
      accessor: (m: Material) => (
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${m.stock < 20 ? "text-red-600" : "text-foreground"}`}>
            {m.stock} {m.unit}s
          </span>
        </div>
      ),
    },
    {
      header: "Valeur Stock",
      accessor: (m: Material) => (
        <span className="text-xs font-bold text-zinc-500">{(m.price * m.stock).toLocaleString()} FCFA</span>
      ),
    },
    {
      header: "Actions",
      accessor: (m: Material) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setMaterialToEdit(m); setIsModalOpen(true); }}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button 
            onClick={() => { setMaterialToEdit(m); setIsConfirmOpen(true); }}
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
      title="Stock Matériaux"
      subtitle="Gestion du catalogue de la quincaillerie"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => { setMaterialToEdit(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Matériau
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 flex flex-col gap-2 border-l-4 border-l-primary">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Valeur Totale Stock</span>
            <span className="text-2xl font-black text-foreground">1,245,000 FCFA</span>
          </Card>
          <Card className="p-5 flex flex-col gap-2 border-l-4 border-l-amber-500">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Articles à commander</span>
            <span className="text-2xl font-black text-amber-600">8</span>
          </Card>
          <Card className="p-5 flex flex-col gap-2 border-l-4 border-l-emerald-500">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ventes du mois</span>
            <span className="text-2xl font-black text-emerald-600">+15%</span>
          </Card>
          <Card className="p-5 flex flex-col gap-2 border-l-4 border-l-secondary">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Arrivages prévus</span>
            <span className="text-2xl font-black text-secondary">2</span>
          </Card>
        </div>

        <Card className="p-6 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher un matériau ou catégorie..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>

          <DataTable columns={columns} data={filtered} />
        </Card>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={materialToEdit ? "Modifier Matériau" : "Nouveau Matériau"}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Désignation</label>
            <input 
              type="text" 
              defaultValue={materialToEdit?.name}
              placeholder="Ex: Ciment Bélier 50kg"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Catégorie</label>
              <select 
                defaultValue={materialToEdit?.category}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                <option value="Gros Oeuvre">Gros Oeuvre</option>
                <option value="Fers">Fers</option>
                <option value="Peinture">Peinture</option>
                <option value="Quincaillerie">Quincaillerie</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Unité</label>
              <select 
                defaultValue={materialToEdit?.unit}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                <option value="Sac">Sac</option>
                <option value="Barre">Barre</option>
                <option value="Seau">Seau</option>
                <option value="Paquet">Paquet</option>
                <option value="Unité">Unité</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Prix de vente (FCFA)</label>
            <input 
              type="number" 
              defaultValue={materialToEdit?.price}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <Button variant="primary" className="mt-2" onClick={() => setIsModalOpen(false)}>
            {materialToEdit ? "Mettre à jour" : "Ajouter au stock"}
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setMaterials(materials.filter(m => m.id !== materialToEdit?.id));
          showToast("Matériau supprimé", "success");
        }}
        title="Supprimer le matériau"
        message={`Êtes-vous sûr de vouloir supprimer "${materialToEdit?.name}" du catalogue ?`}
      />
    </AppLayout>
  );
}
