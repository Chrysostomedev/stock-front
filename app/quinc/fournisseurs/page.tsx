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
import {
  Building2,
  Plus,
  Search,
  Truck,
  Phone,
  DollarSign,
  Calendar,
  FileText,
  Edit2,
  Trash2
} from "lucide-react";

export default function QuincFournisseursPage() {
  const { showToast } = useToast();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    isActive: true
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await QuincSupplierService.getAll();
      setSuppliers(data);
    } catch (error) {
      showToast("Erreur lors du chargement des fournisseurs", "error");
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
      setFormData(supplier);
    } else {
      setSupplierToEdit(null);
      setFormData({
        name: "",
        contactName: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (supplierToEdit) {
        await QuincSupplierService.update(supplierToEdit.id, formData);
        showToast("Fournisseur mis à jour", "success");
      } else {
        await QuincSupplierService.create(formData);
        showToast("Fournisseur créé", "success");
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      showToast("Erreur lors de l'enregistrement", "error");
    }
  };

  const handleDelete = async () => {
    if (!supplierToEdit) return;
    try {
      await QuincSupplierService.delete(supplierToEdit.id);
      showToast("Fournisseur supprimé", "success");
      setIsConfirmOpen(false);
      loadData();
    } catch (error) {
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns: { header: string; accessor: keyof Supplier | ((item: Supplier) => React.ReactNode); className?: string }[] = [
    {
      header: "Fournisseur",
      accessor: (s: Supplier) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground">{s.name}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">{s.notes || "Général"}</span>
        </div>
      ),
    },
    {
      header: "Contact",
      accessor: (s: Supplier) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground">{s.contactName || "Non défini"}</span>
          <span className="text-[10px] text-zinc-400 font-bold">{s.phone}</span>
        </div>
      ),
    },
    {
      header: "Statut",
      accessor: (s: Supplier) => (
        <Badge variant={s.isActive ? "success" : "danger"}>{s.isActive ? "Actif" : "Inactif"}</Badge>
      ),
    },
    {
      header: "Actions",
      accessor: (s: Supplier) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => handleOpenModal(s)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setSupplierToEdit(s); setIsConfirmOpen(true); }}
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
      title="Fournisseurs Quincaillerie"
      subtitle="Gestion des approvisionnements et dettes"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Fournisseur
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-amber-500">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Fournisseurs</p>
              <h4 className="text-xl font-black text-foreground">{loading ? "..." : suppliers.length}</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-primary">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Commandes en cours</p>
              <h4 className="text-xl font-black text-foreground">0</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-red-500">
            <div className="p-3 bg-red-500/10 text-red-600 rounded-2xl">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Dette Estimée</p>
              <h4 className="text-xl font-black text-foreground">0 FCFA</h4>
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
          <DataTable columns={columns} data={filtered} isLoading={loading} />
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={supplierToEdit ? "Modifier Fournisseur" : "Ajouter Fournisseur"}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Raison Sociale</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Nom du contact</label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Téléphone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Notes (Catégorie / Info)</label>
            <input
              type="text"
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
            />
          </div>
          <Button variant="primary" className="mt-2" onClick={handleSubmit}>
            {supplierToEdit ? "Mettre à jour" : "Enregistrer"}
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le fournisseur"
        message={`Êtes-vous sûr de vouloir supprimer "${supplierToEdit?.name}" ?`}
      />
    </AppLayout>
  );
}
