"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/contexts/ToastContext";
import ProductService, { Product, CreateProductDto } from "@/services/product.service";
import CategoryService, { Category } from "@/services/category.service";
import ShopService, { Shop } from "@/services/shop.service";
import UnitService, { Unit } from "@/services/unit.service";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  Package, 
  Barcode, 
  DollarSign, 
  AlertTriangle,
  ChevronDown,
  Building2,
  Tag,
  RefreshCw
} from "lucide-react";

/**
 * Page d'administration des Produits
 * Gère le catalogue global pour toutes les boutiques (Superette & Quincaillerie)
 */
export default function AdminProduitsPage() {
  const { showToast } = useToast();
  
  // États pour les données
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [filterShop, setFilterShop] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  
  // États pour les modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // États pour le formulaire
  const [formData, setFormData] = useState<Partial<CreateProductDto>>({
    name: "",
    barcode: "",
    sku: "",
    description: "",
    buyingPrice: 0,
    sellingPrice: 0,
    stockQty: 0,
    minStockQty: 5,
    shopId: "",
    categoryId: "",
    unitId: "",
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chargement des données initiales
  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, shopRes, unitRes] = await Promise.all([
        ProductService.getAll(),
        CategoryService.getAll(),
        ShopService.getAll(),
        UnitService.getAll()
      ]);
      
      // Extraction des tableaux depuis les réponses
      // Produits, Catégories et Unités sont paginés (objet avec .data)
      // Boutiques est un tableau direct
      const prodList = prodRes.data && Array.isArray(prodRes.data) ? prodRes.data : [];
      const catList = catRes.data && Array.isArray(catRes.data) ? catRes.data : [];
      const shopList = Array.isArray(shopRes) ? shopRes : (shopRes.data || []);
      const unitList = unitRes.data && Array.isArray(unitRes.data) ? unitRes.data : [];
      console.log("les produits",prodList);
      setProducts(prodList);
      setCategories(catList);
      setShops(shopList);
      setUnits(unitList);
      
      // Pré-sélectionner la première boutique dans le formulaire
      if (shopList.length > 0) {
        setFormData(prev => ({ ...prev, shopId: shopList[0].id }));
      }
    } catch (error) {
      console.error("Erreur de chargement:", error);
      showToast("Erreur lors du chargement des données", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Gestion des modales
  const handleOpenModal = (product: Product | null = null) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        name: product.name,
        barcode: product.barcode || "",
        sku: product.sku || "",
        description: product.description || "",
        buyingPrice: product.buyingPrice,
        sellingPrice: product.sellingPrice,
        stockQty: product.stockQty,
        minStockQty: product.minStockQty,
        shopId: product.shopId,
        categoryId: product.categoryId || "",
        unitId: product.unitId || "",
        isActive: product.isActive
      });
    } else {
      setSelectedProduct(null);
      setFormData({
        name: "",
        barcode: "",
        sku: "",
        description: "",
        buyingPrice: 0,
        sellingPrice: 0,
        stockQty: 0,
        minStockQty: 5,
        shopId: shops.length > 0 ? shops[0].id : "",
        categoryId: "",
        unitId: units.length > 0 ? units[0].id : "",
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.shopId) {
      showToast("Veuillez remplir les champs obligatoires (*)", "error");
      return;
    }

    if (!formData.barcode && !formData.sku) {
      showToast("Le code-barres ou la référence SKU est obligatoire pour le suivi", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedProduct) {
        await ProductService.update(selectedProduct.id, formData);
        showToast("Produit mis à jour", "success");
      } else {
        await ProductService.create(formData as CreateProductDto);
        showToast("Produit créé avec succès", "success");
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error("Erreur save:", error);
      showToast("Erreur lors de l'enregistrement", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Génération automatique de code-barres (EAN-13 fictif)
  const generateBarcode = () => {
    const randomDigits = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    setFormData(prev => ({ ...prev, barcode: `200${randomDigits.slice(3)}` }));
    showToast("Code-barres généré", "info");
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      await ProductService.delete(selectedProduct.id);
      showToast("Produit supprimé", "success");
      setIsConfirmOpen(false);
      loadData();
    } catch (error) {
      showToast("Erreur lors de la suppression", "error");
    }
  };

  // Filtrage
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.barcode?.includes(searchTerm) || 
                          p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesShop = !filterShop || p.shopId === filterShop;
    const matchesCategory = !filterCategory || p.categoryId === filterCategory;
    return matchesSearch && matchesShop && matchesCategory;
  });

  // Formatage monétaire (XOF - Franc CFA)
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const columns: { header: string; accessor: keyof Product | ((item: Product) => React.ReactNode); className?: string }[] = [
    {
      header: "Produit",
      accessor: (item: Product) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-primary">
            <Package className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-zinc-900 dark:text-zinc-50">{item.name}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{item.barcode || "Pas de code-barres"}</span>
          </div>
        </div>
      )
    },
    {
      header: "Boutique",
      accessor: (item: Product) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-3 w-3 text-zinc-400" />
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{shops.find(s => s.id === item.shopId)?.name}</span>
        </div>
      )
    },
    {
      header: "Prix Vente",
      accessor: (item: Product) => (
        <span className="font-black text-zinc-900 dark:text-zinc-100">
          {formatPrice(item.sellingPrice)}
        </span>
      )
    },
    {
      header: "Stock",
      accessor: (item: Product) => (
        <div className="flex items-center gap-2">
          <span className={`font-black ${item.stockQty <= item.minStockQty ? "text-red-500" : "text-emerald-500"}`}>
            {item.stockQty}
          </span>
          {item.stockQty <= item.minStockQty && (
            <AlertTriangle className="h-3 w-3 text-red-500" />
          )}
        </div>
      )
    },
    {
      header: "Statut",
      accessor: (item: Product) => (
        <Badge variant={item.isActive ? "success" : "outline"}>
          {item.isActive ? "Actif" : "Désactivé"}
        </Badge>
      )
    },
    {
      header: "Actions",
      accessor: (item: Product) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleOpenModal(item)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <Edit2 className="h-4 w-4 text-zinc-500" />
          </button>
          <button onClick={() => { setSelectedProduct(item); setIsConfirmOpen(true); }} className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors">
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      )
    }
  ];
  return (
    <AppLayout title="Gestion du Catalogue" subtitle="Produits, prix et inventaire global">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
        
        {/* En-tête avec filtres */}
        <Card className="p-4 border-none shadow-sm flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 h-4 w-4" />
              <input 
                type="text"
                placeholder="Rechercher par nom, SKU ou code-barres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select 
                value={filterShop}
                onChange={(e) => setFilterShop(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
              >
                <option value="">Toutes les boutiques</option>
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
              >
                <option value="">Toutes les catégories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <Button onClick={() => handleOpenModal()} variant="primary" className="h-12 px-6">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Produit
              </Button>
            </div>
          </div>
        </Card>

        {/* Liste des produits */}
        <Card className="overflow-hidden border-none shadow-xl">
          <DataTable 
            columns={columns} 
            data={filteredProducts} 
            isLoading={loading}
          />
        </Card>
      </div>

      {/* Modale d'ajout/édition */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={selectedProduct ? "Modifier le produit" : "Nouveau produit catalogue"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
          {/* Section Informations de base */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Package className="h-3 w-3" /> Informations de base
            </h4>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nom du produit <span className="text-red-500">*</span></label>
              <input 
                type="text"
                placeholder="Ex: Savon Fanico, Lait Bonnet Rouge..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Code-barres <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  <input 
                    type="text"
                    placeholder="Scanner ou saisir..."
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                  />
                  <button 
                    type="button"
                    onClick={generateBarcode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-primary transition-colors"
                    title="Générer un code-barres"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Référence SKU <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  placeholder="CODE-INTERNE"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Boutique Assignée <span className="text-red-500">*</span></label>
                <select 
                  value={formData.shopId}
                  onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                >
                  <option value="">Sélectionner...</option>
                  {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Catégorie</label>
                <select 
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                >
                  <option value="">Sélectionner...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          {/* Section Prix et Stock */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              <DollarSign className="h-3 w-3" /> Prix et Inventaire
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Prix d'Achat (XOF)</label>
                <input 
                  type="number"
                  value={formData.buyingPrice}
                  onChange={(e) => setFormData({ ...formData, buyingPrice: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Prix de Vente (XOF)</label>
                <input 
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all font-black text-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Stock Actuel</label>
                <input 
                  type="number"
                  value={formData.stockQty}
                  onChange={(e) => setFormData({ ...formData, stockQty: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Seuil d'alerte</label>
                <input 
                  type="number"
                  value={formData.minStockQty}
                  onChange={(e) => setFormData({ ...formData, minStockQty: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Unité de mesure</label>
              <select 
                value={formData.unitId}
                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
              </select>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <input 
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-primary border-zinc-300 rounded"
              />
              <label htmlFor="isActive" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Produit actif et disponible à la vente
              </label>
            </div>
          </div>

          <div className="md:col-span-2 flex gap-3 mt-4 border-t pt-6 border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" className="flex-1 h-12" loading={isSubmitting}>
              {selectedProduct ? "Enregistrer les modifications" : "Ajouter au catalogue"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation suppression */}
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer définitivement ?"
        message={`Le produit "${selectedProduct?.name}" sera retiré du catalogue. Cette action ne peut pas être annulée.`}
      />
    </AppLayout>
  );
}
