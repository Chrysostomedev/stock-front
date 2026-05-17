"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";
import QuincSupplierService, { Supplier } from "@/services/quinc/supplier.service";
import ShopService, { Shop } from "@/services/shop.service";
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  Briefcase,
  AlertCircle
} from "lucide-react";

export default function AdminFournisseursPage() {
  const { showToast } = useToast();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState<Partial<Supplier> & { shopId?: string }>({
    name: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    isActive: true,
    shopId: ""
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [suppRes, shopRes] = await Promise.all([
        QuincSupplierService.getAll(),
        ShopService.getAll()
      ]);
      setSuppliers(suppRes);
      setShops(Array.isArray(shopRes) ? shopRes : shopRes?.data || []);
    } catch (error) {
      showToast("Erreur lors du chargement des données", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setSupplierToEdit(supplier);
      setFormData({
        ...supplier,
        shopId: (supplier as any).shopId || ""
      });
    } else {
      setSupplierToEdit(null);
      setFormData({
        name: "",
        contactName: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
        isActive: true,
        shopId: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      showToast("Le nom du fournisseur est obligatoire", "error");
      return;
    }
    try {
      if (supplierToEdit) {
        await QuincSupplierService.update(supplierToEdit.id, formData);
        showToast("Fournisseur mis à jour avec succès", "success");
      } else {
        await QuincSupplierService.create(formData);
        showToast("Fournisseur créé avec succès", "success");
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      showToast("Erreur lors de l'enregistrement", "error");
    }
  };

  const handleOpenConfirm = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!supplierToDelete) return;
    try {
      await QuincSupplierService.delete(supplierToDelete.id);
      showToast("Fournisseur supprimé avec succès", "success");
      setIsConfirmOpen(false);
      loadData();
    } catch (error) {
      showToast("Impossible de supprimer ce fournisseur.", "error");
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contactName || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || "").includes(search)
  );

  const columns = [
    {
      header: "Raison Sociale",
      accessor: (item: Supplier) => (
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="font-black text-zinc-800 dark:text-zinc-100">{item.name}</p>
            {/* <p className="text-[10px] text-zinc-400">Contact: {item.contactName || "—"}</p> */}
          </div>
        </div>
      )
    },
    {
      header: "Boutique Associée",
      accessor: (item: Supplier) => {
        const matched = shops.find(s => s.id === (item as any).shopId);
        return (
          <span className="text-xs font-bold text-zinc-500">
            {matched ? matched.name : "Multi-Boutique / Global"}
          </span>
        );
      }
    },
    {
      header: "Téléphone & Email",
      accessor: (item: Supplier) => (
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
            <Phone className="h-3 w-3" />
            <span>{item.phone || "—"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Mail className="h-3 w-3" />
            <span>{item.email || "—"}</span>
          </div>
        </div>
      )
    },
    {
      header: "Adresse",
      accessor: (item: Supplier) => (
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 max-w-xs truncate">
          <MapPin className="h-3.5 w-3.5" />
          <span>{item.address || "—"}</span>
        </div>
      )
    },
    {
      header: "Statut",
      accessor: (item: Supplier) => (
        <Badge variant={item.isActive ? "success" : "danger"}>
          {item.isActive ? "Actif" : "Inactif"}
        </Badge>
      )
    },
    {
      header: "Actions",
      accessor: (item: Supplier) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(item)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-primary transition-all cursor-pointer"
            title="Modifier"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleOpenConfirm(item)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-zinc-400 hover:text-red-600 transition-all cursor-pointer"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <AppLayout
      title="Fournisseurs Partenaires"
      subtitle="Supervision et gestion globale de tous les fournisseurs de marchandises"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un fournisseur
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Search Bar */}
        <Card className="p-4 border-none shadow-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher un fournisseur (Nom, contact, téléphone)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>
        </Card>

        {/* Suppliers List Table */}
        <Card className="overflow-hidden border-none shadow-xl">
          <DataTable
            columns={columns}
            data={filteredSuppliers}
            isLoading={loading}
          />
        </Card>
      </div>

      {/* Creation/Edition Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={supplierToEdit ? "Modifier le fournisseur" : "Nouveau fournisseur"}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              Nom du Fournisseur <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: SOTACI CI"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Nom du Contact Principal
              </label>
              <input
                type="text"
                placeholder="Ex: Jean Stoma"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Point de vente Principal
              </label>
              <select
                value={formData.shopId}
                onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                <option value="">Tous les points de vente / Global</option>
                {shops.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Téléphone
              </label>
              <input
                type="text"
                placeholder="Ex: +225 07 12 34 56"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Adresse Email
              </label>
              <input
                type="email"
                placeholder="Ex: contact@sotaci.ci"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              Adresse Physique
            </label>
            <input
              type="text"
              placeholder="Ex: Zone Industrielle, Yopougon, Abidjan"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              Notes complémentaires
            </label>
            <textarea
              placeholder="Conditions de livraison, délais de paiement habituels..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all h-20 resize-none"
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-primary bg-zinc-50 dark:bg-zinc-850 rounded border-zinc-300 dark:border-zinc-700"
            />
            <label htmlFor="isActive" className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
              Fournisseur Actif
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {supplierToEdit ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le fournisseur"
        message={`Êtes-vous sûr de vouloir supprimer définitivement le fournisseur "${supplierToDelete?.name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
      />
    </AppLayout>
  );
}
