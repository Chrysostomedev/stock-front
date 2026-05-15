"use client";

import React, { useState, useEffect } from "react";
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
  Mail,
} from "lucide-react";
import { useShops } from "@/hooks/admin/useShops";
import { Shop } from "@/types/admin";

export default function AdminBoutiquesPage() {
  const { shops, loading, error, addShop, updateShop, deleteShop, toggleStatus, refresh } = useShops();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState<Partial<Shop>>({
    name: "",
    type: "superette",
    address: "",
    phone: "",
    email: "",
    currency: "XOF",
    isActive: true
  });

  useEffect(() => {
    if (selectedShop) {
      setFormData({
        name: selectedShop.name,
        type: selectedShop.type,
        address: selectedShop.address,
        phone: selectedShop.phone,
        email: selectedShop.email,
        currency: selectedShop.currency,
        isActive: selectedShop.isActive
      });
    } else {
      setFormData({
        name: "",
        type: "superette",
        address: "",
        phone: "",
        email: "",
        currency: "XOF",
        isActive: true
      });
    }
  }, [selectedShop, isModalOpen]);

  const handleSubmit = async () => {
    try {
      if (selectedShop) {
        await updateShop(selectedShop.id, formData);
      } else {
        await addShop(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredShops = shops.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: { header: string; accessor: keyof Shop | ((item: Shop) => React.ReactNode); className?: string }[] = [
    {
      header: "Boutique",
      accessor: (s: Shop) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-foreground">{s.name}</span>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{s.type}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Emplacement",
      accessor: (s: Shop) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-zinc-400" />
          <span className="text-xs font-bold">{s.address}</span>
        </div>
      ),
    },
    {
      header: "Contact",
      accessor: (s: Shop) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-zinc-400" />
            <span className="text-[10px] font-bold">{s.phone}</span>
          </div>
          {s.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-zinc-400" />
              <span className="text-[10px] text-zinc-400 font-bold">{s.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Statut",
      accessor: (s: Shop) => (
        <Badge variant={s.isActive ? "success" : "outline"}>
          {s.isActive ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessor: (s: Shop) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setSelectedShop(s); setIsModalOpen(true); }}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"
            title="Modifier"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button 
            onClick={() => { setSelectedShop(s); setIsConfirmOpen(true); }}
            className={`p-2 rounded-lg transition-all ${s.isActive ? 'hover:bg-red-50 text-zinc-400 hover:text-red-600' : 'hover:bg-green-50 text-zinc-400 hover:text-green-600'}`}
            title={s.isActive ? "Désactiver" : "Activer"}
          >
            <Power className="h-4 w-4" />
          </button>
          <button 
            onClick={() => { setSelectedShop(s); setIsDeleteConfirmOpen(true); }}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-zinc-400 hover:text-red-600 transition-all"
            title="Supprimer"
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
      title="Gestion des Boutiques"
      subtitle="Configurez vos points de vente et entrepôts"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => { setSelectedShop(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Boutique
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
            {error}
            <button onClick={refresh} className="ml-4 underline">Réessayer</button>
          </div>
        )}

        <Card className="p-6">
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher une boutique..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          {loading ? (
            <div className="py-20 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
              Chargement des boutiques...
            </div>
          ) : (
            <DataTable columns={columns} data={filteredShops} />
          )}
        </Card>
      </div>

      {/* Add/Edit Shop Modal */}
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
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Superette Plateau"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                <option value="superette">Superette (Produits de consommation)</option>
                <option value="quincaillerie">Quincaillerie (Matériaux & Outils)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Adresse / Localisation</label>
            <input 
              type="text" 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Ex: Avenue 10, Plateau, Abidjan"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Téléphone</label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Ex: +225 0701020304"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Email (Optionnel)</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Ex: plateau@spservices.com"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Devise</label>
              <select 
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                <option value="XOF">FCFA (XOF)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar ($)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5 justify-center pt-5">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Boutique active immédiatement
                </label>
              </div>
            </div>
          </div>

          <Button 
            variant="primary" 
            className="mt-4" 
            onClick={handleSubmit}
            disabled={!formData.name || !formData.address || !formData.phone}
          >
            {selectedShop ? "Mettre à jour" : "Créer la boutique"}
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => {
          if (selectedShop) {
            await toggleStatus(selectedShop.id, selectedShop.isActive);
            setIsConfirmOpen(false);
          }
        }}
        title={selectedShop?.isActive ? "Désactiver la boutique" : "Activer la boutique"}
        message={`Voulez-vous vraiment ${selectedShop?.isActive ? 'désactiver' : 'activer'} la boutique "${selectedShop?.name}" ?`}
        confirmLabel={selectedShop?.isActive ? "Désactiver" : "Activer"}
        variant={selectedShop?.isActive ? "danger" : "primary"}
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          if (selectedShop) {
            await deleteShop(selectedShop.id);
            setIsDeleteConfirmOpen(false);
          }
        }}
        title="Supprimer la boutique"
        message={`Attention: Toutes les données associées seront inaccessibles. Voulez-vous vraiment supprimer définitivement "${selectedShop?.name}" ?`}
        confirmLabel="Supprimer définitivement"
        variant="danger"
      />
    </AppLayout>
  );
}
