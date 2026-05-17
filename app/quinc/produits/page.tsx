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
import { useAuth } from "@/hooks/useAuth";
import QuincProductService from "@/services/quinc/product.service";
import QuincCategoryService from "@/services/quinc/category.service";
import { Product, Category } from "@/types/quinc";
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

export default function QuincProduitsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [materials, setMaterials] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    categoryId: "",
    unit: "Sac",
    sellingPrice: 0,
    buyingPrice: 0,
    stockQuantity: 0,
    minStockAlert: 5,
    isActive: true,
  });

  const loadData = async () => {
    if (!user?.shopId) return;
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        QuincProductService.getAll(user.shopId),
        QuincCategoryService.getAll(user.shopId)
      ]);
      setMaterials(prods);
      setCategories(cats);
    } catch (error) {
      showToast("Erreur lors du chargement", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleOpenModal = (material?: Product) => {
    if (material) {
      setMaterialToEdit(material);
      setFormData(material);
    } else {
      setMaterialToEdit(null);
      setFormData({
        name: "",
        categoryId: categories.length > 0 ? categories[0].id : "",
        unit: "Sac",
        sellingPrice: 0,
        buyingPrice: 0,
        stockQuantity: 0,
        minStockAlert: 5,
        isActive: true,
        shopId: user?.shopId
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!user?.shopId) return;
    try {
      if (materialToEdit) {
        await QuincProductService.update(materialToEdit.id, formData);
        showToast("Matériau mis à jour", "success");
      } else {
        await QuincProductService.create({ ...formData, shopId: user.shopId });
        showToast("Matériau créé", "success");
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      showToast("Erreur lors de l'enregistrement", "error");
    }
  };

  const handleDelete = async () => {
    if (!materialToEdit) return;
    try {
      await QuincProductService.delete(materialToEdit.id);
      showToast("Matériau supprimé", "success");
      setIsConfirmOpen(false);
      loadData();
    } catch (error) {
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const filtered = materials.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.category?.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: "Matériau",
      accessor: (m: Product) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground">{m.name}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">{m.category?.name || "Sans catégorie"}</span>
        </div>
      ),
    },
    {
      header: "Unité",
      accessor: (m: Product) => (
        <Badge variant="outline">{m.unit}</Badge>
      ),
    },
    {
      header: "Prix Unitaire",
      accessor: (m: Product) => (
        <span className="text-primary font-black">{m.sellingPrice.toLocaleString()} FCFA</span>
      ),
    },
    {
      header: "Stock",
      accessor: (m: Product) => (
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${m.stockQuantity <= (m.minStockAlert || 5) ? "text-red-600" : "text-foreground"}`}>
            {m.stockQuantity} {m.unit}s
          </span>
        </div>
      ),
    },
    {
      header: "Valeur Stock",
      accessor: (m: Product) => (
        <span className="text-xs font-bold text-zinc-500">{(m.sellingPrice * m.stockQuantity).toLocaleString()} FCFA</span>
      ),
    },
    {
      header: "Actions",
      accessor: (m: Product) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => handleOpenModal(m)}
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

  const totalValue = materials.reduce((acc, m) => acc + (m.sellingPrice * m.stockQuantity), 0);
  const itemsToOrder = materials.filter(m => m.stockQuantity <= (m.minStockAlert || 5)).length;

  return (
    <AppLayout
      title="Stock Matériaux"
      subtitle="Gestion du catalogue de la quincaillerie"

    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 flex flex-col gap-2 border-l-4 border-l-primary">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Valeur Totale Stock</span>
            <span className="text-2xl font-black text-foreground">{loading ? "..." : `${totalValue.toLocaleString()} FCFA`}</span>
          </Card>
          <Card className="p-5 flex flex-col gap-2 border-l-4 border-l-amber-500">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Articles à commander</span>
            <span className="text-2xl font-black text-amber-600">{loading ? "..." : itemsToOrder}</span>
          </Card>
          <Card className="p-5 flex flex-col gap-2 border-l-4 border-l-emerald-500">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Articles Actifs</span>
            <span className="text-2xl font-black text-emerald-600">{loading ? "..." : materials.length}</span>
          </Card>
          <Card className="p-5 flex flex-col gap-2 border-l-4 border-l-secondary">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Catégories</span>
            <span className="text-2xl font-black text-secondary">{loading ? "..." : categories.length}</span>
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

          <DataTable columns={columns} data={filtered} isLoading={loading} />
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
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Ciment Bélier 50kg"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Catégorie</label>
              <select
                value={formData.categoryId || ""}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                <option value="">Sélectionner</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Unité</label>
              <select
                value={formData.unit || "Sac"}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                <option value="Sac">Sac</option>
                <option value="Barre">Barre</option>
                <option value="Seau">Seau</option>
                <option value="Paquet">Paquet</option>
                <option value="Tonne">Tonne</option>
                <option value="Unité">Unité</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Prix de vente (FCFA)</label>
              <input
                type="number"
                value={formData.sellingPrice || 0}
                onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Stock Initial</label>
              <input
                type="number"
                value={formData.stockQuantity || 0}
                onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                disabled={!!materialToEdit}
              />
            </div>
          </div>
          <Button variant="primary" className="mt-2" onClick={handleSubmit}>
            {materialToEdit ? "Mettre à jour" : "Ajouter au stock"}
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le matériau"
        message={`Êtes-vous sûr de vouloir supprimer "${materialToEdit?.name}" du catalogue ?`}
      />
    </AppLayout>
  );
}
