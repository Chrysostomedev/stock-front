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
import ProductService, {
  Product,
  CreateProductDto,
} from "@/services/product.service";
import CategoryService, { Category } from "@/services/category.service";
import ShopService, { Shop } from "@/services/shop.service";
import UnitService, { Unit } from "@/services/unit.service";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Package,
  Barcode,
  DollarSign,
  AlertTriangle,
  Building2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Layers,
  Archive,
  Clock,
  X,
} from "lucide-react";
import ExportButton from "@/components/ui/ExportButton";
import ProductBatchService from "@/services/super/productBatch.service";
import ProductComponentService from "@/services/productComponent.service";
import { ProductBatch, ProductComponent, CreateProductBatchDto, CreateProductComponentDto } from "@/types/super";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

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

  // États pour la pagination et recherche debouncée
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

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
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États pour les modales Lots & Kit
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  const [productForDetail, setProductForDetail] = useState<Product | null>(null);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [kitComponents, setKitComponents] = useState<ProductComponent[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [batchForm, setBatchForm] = useState<Partial<CreateProductBatchDto>>({
    batchNumber: "", quantity: 0, buyingPrice: 0, expiresAt: "", receivedAt: "",
  });
  const [componentForm, setComponentForm] = useState<Partial<CreateProductComponentDto>>({
    componentProductId: "", quantity: 1,
  });
  const [submittingBatch, setSubmittingBatch] = useState(false);
  const [submittingComponent, setSubmittingComponent] = useState(false);

  // Effet de debounce pour le terme de recherche
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Réinitialiser la page courante à 1 si le terme de recherche ou les filtres changent
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterShop, filterCategory]);

  // Chargement des données statiques (au montage)
  const loadStaticData = async () => {
    try {
      const [catRes, shopRes, unitRes] = await Promise.all([
        CategoryService.getAll(),
        ShopService.getAll(),
        UnitService.getAll(),
      ]);
      const catList = catRes.data && Array.isArray(catRes.data) ? catRes.data : [];
      const shopList = Array.isArray(shopRes) ? shopRes : shopRes.data || [];
      const unitList = unitRes.data && Array.isArray(unitRes.data) ? unitRes.data : [];
      
      setCategories(catList);
      setShops(shopList);
      setUnits(unitList);
      
      if (shopList.length > 0) {
        setFormData((prev) => ({ ...prev, shopId: shopList[0].id }));
      }
    } catch (error) {
      console.error("Erreur de chargement des filtres:", error);
      showToast("Erreur lors du chargement des filtres", "error");
    }
  };

  // Chargement des produits paginés
  const loadProducts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
      };
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      if (filterShop) {
        params.shopId = filterShop;
      }
      if (filterCategory) {
        params.categoryId = filterCategory;
      }
      
      const prodRes = await ProductService.getAll(params);
      const prodList = prodRes.data && Array.isArray(prodRes.data) ? prodRes.data : [];
      
      setProducts(prodList);
      setTotalPages(prodRes.totalPages ?? 1);
      setTotalProducts(prodRes.total ?? prodList.length);
    } catch (error) {
      console.error("Erreur de chargement des produits:", error);
      showToast("Erreur lors du chargement des produits", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaticData();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, limit, debouncedSearch, filterShop, filterCategory]);

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
        isActive: product.isActive,
      });
    } else {
      setSelectedProduct(null);
      setFormData({
        name: "",
        barcode: "",
        description: "",
        buyingPrice: 0,
        sellingPrice: 0,
        stockQty: 0,
        minStockQty: 5,
        shopId: shops.length > 0 ? shops[0].id : "",
        categoryId: "",
        unitId: units.length > 0 ? units[0].id : "",
        isActive: true,
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
      showToast("Le code-barres ou la référence SKU est obligatoire", "error");
      return;
    }

    const buying  = Number(formData.buyingPrice  ?? 0);
    const selling = Number(formData.sellingPrice ?? 0);
    if (buying > 0 && selling > 0 && buying > selling) {
      showToast(
        `Prix d'achat (${buying} XOF) supérieur au prix de vente (${selling} XOF) — impossible d'enregistrer`,
        "error"
      );
      return;
    }
    if (selling > 0 && buying === 0) {
      // autorisé mais on laisse passer (achat non renseigné)
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
      loadProducts();
    } catch (error) {
      console.error("Erreur save:", error);
      showToast("Erreur lors de l'enregistrement", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateBarcode = () => {
    const randomDigits = Math.floor(Math.random() * 1000000000000)
      .toString()
      .padStart(12, "0");
    setFormData((prev) => ({
      ...prev,
      barcode: `200${randomDigits.slice(3)}`,
    }));
    showToast("Code-barres généré", "info");
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      await ProductService.delete(selectedProduct.id);
      showToast("Produit supprimé", "success");
      setIsConfirmOpen(false);
      loadProducts();
    } catch (error) {
      showToast("Erreur lors de la suppression", "error");
    }
  };

  // ── Batch (lots) modal ──────────────────────────────────────────────────
  const openBatchModal = async (product: Product) => {
    setProductForDetail(product);
    setIsBatchModalOpen(true);
    setLoadingDetail(true);
    setBatchForm({ batchNumber: "", quantity: 0, buyingPrice: product.buyingPrice, expiresAt: "", receivedAt: "" });
    try {
      const data = await ProductBatchService.getByProduct(product.id);
      setBatches(Array.isArray(data) ? data : []);
    } catch {
      setBatches([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForDetail || !batchForm.batchNumber || !batchForm.quantity) {
      showToast("Numéro de lot et quantité obligatoires", "error");
      return;
    }
    setSubmittingBatch(true);
    try {
      const dto: CreateProductBatchDto = {
        productId: productForDetail.id,
        batchNumber: batchForm.batchNumber!,
        quantity: Number(batchForm.quantity),
        buyingPrice: Number(batchForm.buyingPrice ?? 0),
        expiresAt: batchForm.expiresAt || undefined,
        receivedAt: batchForm.receivedAt || undefined,
      };
      const created = await ProductBatchService.create(dto);
      setBatches((prev) => [created, ...prev]);
      setBatchForm({ batchNumber: "", quantity: 0, buyingPrice: productForDetail.buyingPrice, expiresAt: "", receivedAt: "" });
      showToast("Lot enregistré", "success");
    } catch {
      showToast("Erreur lors de l'enregistrement du lot", "error");
    } finally {
      setSubmittingBatch(false);
    }
  };

  // ── Kit (composition) modal ─────────────────────────────────────────────
  const openKitModal = async (product: Product) => {
    setProductForDetail(product);
    setIsKitModalOpen(true);
    setLoadingDetail(true);
    setComponentForm({ componentProductId: "", quantity: 1 });
    try {
      const data = await ProductComponentService.getByKit(product.id);
      setKitComponents(Array.isArray(data) ? data : []);
    } catch {
      setKitComponents([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForDetail || !componentForm.componentProductId || !componentForm.quantity) {
      showToast("Produit composant et quantité obligatoires", "error");
      return;
    }
    setSubmittingComponent(true);
    try {
      const dto: CreateProductComponentDto = {
        kitProductId: productForDetail.id,
        componentProductId: componentForm.componentProductId!,
        quantity: Number(componentForm.quantity),
      };
      const created = await ProductComponentService.create(dto);
      setKitComponents((prev) => [...prev, created]);
      setComponentForm({ componentProductId: "", quantity: 1 });
      showToast("Composant ajouté", "success");
    } catch {
      showToast("Erreur lors de l'ajout du composant", "error");
    } finally {
      setSubmittingComponent(false);
    }
  };

  const handleDeleteComponent = async (id: string) => {
    try {
      await ProductComponentService.delete(id);
      setKitComponents((prev) => prev.filter((c) => c.id !== id));
      showToast("Composant retiré", "success");
    } catch {
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return format(parseISO(dateStr), "dd MMM yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages.map((p, idx) => {
      if (p === "...") {
        return (
          <span key={`dots-${idx}`} className="px-2 text-xs font-bold text-zinc-400">
            ...
          </span>
        );
      }

      const isCurrent = p === page;
      return (
        <button
          key={`page-${p}`}
          type="button"
          onClick={() => setPage(p as number)}
          className={`h-8 min-w-[32px] px-2 rounded-xl text-xs font-black transition-all ${
            isCurrent
              ? "bg-primary text-white shadow-sm shadow-primary/30"
              : "border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          }`}
        >
          {p}
        </button>
      );
    });
  };

  const columns: any[] = [
    {
      header: "Produit",
      accessor: (item: Product) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-primary">
            <Package className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-zinc-900 dark:text-zinc-50">{item.name}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              {item.barcode || "Pas de code-barres"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Boutique",
      accessor: (item: Product) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-3 w-3 text-zinc-400" />
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
            {shops.find((s) => s.id === item.shopId)?.name}
          </span>
        </div>
      ),
    },
    {
      header: "Prix Vente",
      accessor: (item: Product) => (
        <span className="font-black text-zinc-900 dark:text-zinc-100">
          {formatPrice(item.sellingPrice)}
        </span>
      ),
    },
    {
      header: "Stock",
      accessor: (item: Product) => (
        <div className="flex items-center gap-2">
          <span className={`font-black ${item.stockQty <= item.minStockQty ? "text-red-500" : "text-emerald-500"}`}>
            {item.stockQty}
          </span>
          {item.stockQty <= item.minStockQty && <AlertTriangle className="h-3 w-3 text-red-500" />}
        </div>
      ),
    },
    {
      header: "Statut",
      accessor: (item: Product) => (
        <Badge variant={item.isActive ? "success" : "outline"}>
          {item.isActive ? "Actif" : "Désactivé"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessor: (item: Product) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenModal(item)}
            title="Modifier"
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Edit2 className="h-4 w-4 text-zinc-500" />
          </button>
          <button
            onClick={() => openBatchModal(item)}
            title="Lots / Arrivages"
            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
          >
            <Archive className="h-4 w-4 text-blue-500" />
          </button>
          <button
            onClick={() => openKitModal(item)}
            title="Composition kit"
            className="p-2 hover:bg-violet-50 dark:hover:bg-violet-950/20 rounded-lg transition-colors"
          >
            <Layers className="h-4 w-4 text-violet-500" />
          </button>
          <button
            onClick={() => {
              setSelectedProduct(item);
              setIsConfirmOpen(true);
            }}
            title="Supprimer"
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout title="Gestion du Catalogue" subtitle="Produits, prix et inventaire global">
      <div className="flex flex-col gap-4 md:gap-6 max-w-7xl mx-auto pb-12 px-2 md:px-0">
        
        {/* BARRE DE RECHERCHE & FILTRES OPTIMISÉS */}
        <Card className="p-3 md:p-4 border-none shadow-sm flex flex-col gap-3">
          <div className="flex flex-col gap-3 w-full">
            {/* Input de recherche pleine largeur sur mobile */}
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher un produit, code-barres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 md:py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-xl md:rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            
            {/* Conteneur des filtres et du bouton d'action */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full">
              <select
                value={filterShop}
                onChange={(e) => setFilterShop(e.target.value)}
                className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-primary cursor-pointer h-11"
              >
                <option value="">Toutes les boutiques</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-primary cursor-pointer h-11"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <Button
                onClick={() => handleOpenModal()}
                variant="primary"
                className="h-11 sm:h-11 px-4 text-xs font-black w-full sm:w-auto shrink-0"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Nouveau
              </Button>
            </div>

            {/* ── Exports Stock ── */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Exporter :</span>
              <ExportButton
                endpoint="/reports/stock/export"
                params={{ shopId: filterShop, categoryId: filterCategory || undefined, stockFilter: "all" }}
                label="Tout le stock"
                alignRight={false}
              />
              <ExportButton
                endpoint="/reports/stock/export"
                params={{ shopId: filterShop, categoryId: filterCategory || undefined, stockFilter: "low" }}
                label="Stock bas"
                alignRight={false}
              />
              <ExportButton
                endpoint="/reports/stock/export"
                params={{ shopId: filterShop, categoryId: filterCategory || undefined, stockFilter: "out" }}
                label="Ruptures"
                alignRight={false}
              />
            </div>
          </div>
        </Card>

        {/* 💻 VUE DESKTOP : Affichage classique du tableau */}
        <div className="hidden md:block">
          <Card className="overflow-hidden border-none shadow-xl">
            <DataTable columns={columns} data={products} isLoading={loading} />
          </Card>
        </div>

        {/* 📱 VUE MOBILE REEL : Cartes fluides de type application native */}
        <div className="block md:hidden space-y-2.5">
          {loading ? (
            <div className="text-center py-8 text-xs font-bold text-zinc-500">Chargement du catalogue...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-xs font-bold text-zinc-500">Aucun produit trouvé</div>
          ) : (
            products.map((item) => (
              <div 
                key={item.id} 
                className="p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 shadow-sm flex items-center justify-between gap-3 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl flex items-center justify-center text-primary shrink-0">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-black text-sm text-zinc-900 dark:text-zinc-50 truncate">{item.name}</span>
                    <span className="text-[10px] text-zinc-400 font-bold tracking-tight truncate mb-1">
                      {item.barcode || "Pas de code-barres"}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-primary">{formatPrice(item.sellingPrice)}</span>
                      <span className="text-[10px] text-zinc-300 dark:text-zinc-700">•</span>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-black ${item.stockQty <= item.minStockQty ? "text-red-500" : "text-emerald-500"}`}>
                          Stock: {item.stockQty}
                        </span>
                        {item.stockQty <= item.minStockQty && <AlertTriangle className="h-3 w-3 text-red-500" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions alignées à droite en mode mobile */}
                <div className="flex flex-col gap-2 shrink-0 border-l border-zinc-100 dark:border-zinc-800 pl-2">
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="p-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-500 flex items-center justify-center"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProduct(item);
                      setIsConfirmOpen(true);
                    }}
                    className="p-1.5 bg-red-50 dark:bg-red-950/20 rounded-lg text-red-500 flex items-center justify-center"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Section Pagination Moderne & Premium */}
        {!loading && products.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/60 rounded-2xl p-4 shadow-md mt-4 transition-all">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              <span>Affichage de</span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {Math.min((page - 1) * limit + 1, totalProducts)}
              </span>
              <span>à</span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {Math.min(page * limit, totalProducts)}
              </span>
              <span>sur</span>
              <span className="text-primary font-black">{totalProducts}</span>
              <span>produits</span>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Sélecteur de taille de page */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Taille :</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-1.5 text-xs font-bold outline-none cursor-pointer focus:border-primary transition-colors"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                </select>
              </div>

              {/* Boutons de navigation de page */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {renderPageNumbers()}

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modale d'ajout/édition - Formulaire Intelligemment Responsive */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProduct ? "Modifier le produit" : "Nouveau produit catalogue"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-1 max-h-[80vh] overflow-y-auto">
          {/* Section Informations de base */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Package className="h-3 w-3" /> Informations de base
            </h4>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Nom du produit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Savon Fanico..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 md:py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Code-barres <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Scanner ou saisir..."
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full pl-10 pr-12 py-2.5 md:py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={generateBarcode}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-primary transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  Boutique <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.shopId}
                  onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                  className="w-full px-3 py-2.5 md:py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                >
                  <option value="">Sélectionner...</option>
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Catégorie</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2.5 md:py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                >
                  <option value="">Sélectionner...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section Prix et Stock */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              <DollarSign className="h-3 w-3" /> Prix et Inventaire
            </h4>
            {(() => {
              const buying  = Number(formData.buyingPrice  ?? 0);
              const selling = Number(formData.sellingPrice ?? 0);
              const hasError = buying > 0 && selling > 0 && buying > selling;
              const margin   = hasError ? null : (selling > 0 && buying > 0 ? Math.round(((selling - buying) / selling) * 100) : null);
              return (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className={`text-[10px] font-black uppercase tracking-widest ${hasError ? "text-rose-500" : "text-zinc-500"}`}>
                        Achat (XOF)
                      </label>
                      <input
                        type="number"
                        value={formData.buyingPrice}
                        onChange={(e) => setFormData({ ...formData, buyingPrice: parseFloat(e.target.value) })}
                        className={`w-full px-4 py-2.5 md:py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-xs font-bold outline-none transition-all border ${hasError ? "border-rose-400 dark:border-rose-500 focus:border-rose-500" : "border-zinc-200 dark:border-zinc-700 focus:border-primary"}`}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={`text-[10px] font-black uppercase tracking-widest ${hasError ? "text-rose-500" : "text-zinc-500"}`}>
                        Vente (XOF)
                      </label>
                      <input
                        type="number"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })}
                        className={`w-full px-4 py-2.5 md:py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-xs font-bold outline-none transition-all border ${hasError ? "border-rose-400 dark:border-rose-500 focus:border-rose-500 text-rose-600" : "border-zinc-200 dark:border-zinc-700 focus:border-primary text-primary"}`}
                      />
                    </div>
                  </div>
                  {hasError && (
                    <div className="flex items-start gap-2 px-3 py-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 leading-snug">
                        Le prix d&apos;achat ({Number(formData.buyingPrice).toLocaleString("fr-FR")} XOF) est supérieur au prix de vente ({Number(formData.sellingPrice).toLocaleString("fr-FR")} XOF). Vous vendrez à perte — corrigez les prix avant de continuer.
                      </p>
                    </div>
                  )}
                  {!hasError && margin !== null && (
                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                      Marge : {margin}% — {(Number(formData.sellingPrice) - Number(formData.buyingPrice)).toLocaleString("fr-FR")} XOF par unité
                    </p>
                  )}
                </>
              );
            })()}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Stock</label>
                <input
                  type="number"
                  value={formData.stockQty}
                  onChange={(e) => setFormData({ ...formData, stockQty: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2.5 md:py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Alerte</label>
                <input
                  type="number"
                  value={formData.minStockQty}
                  onChange={(e) => setFormData({ ...formData, minStockQty: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2.5 md:py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Unité</label>
              <select
                value={formData.unitId}
                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                className="w-full px-3 py-2.5 md:py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
                ))}
              </select>
            </div>

            <div className="mt-1 flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-primary border-zinc-300 rounded"
              />
              <label htmlFor="isActive" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Produit disponible à la vente
              </label>
            </div>
          </div>

          <div className="md:col-span-2 flex gap-3 mt-4 border-t pt-4 border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" className="flex-1 h-11 text-xs" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" className="flex-1 h-11 text-xs" loading={isSubmitting}>
              {selectedProduct ? "Enregistrer" : "Ajouter"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer ?"
        message={`Retirer "${selectedProduct?.name}" du catalogue ?`}
      />

      {/* ── Modal : Lots / Arrivages ───────────────────────────────────── */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title={`Lots — ${productForDetail?.name ?? ""}`}
        size="lg"
      >
        <div className="flex flex-col gap-5 p-1 max-h-[80vh] overflow-y-auto">

          {/* Historique des lots */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-3 w-3" /> Historique des lots
            </h4>
            {loadingDetail ? (
              <div className="flex justify-center py-6">
                <RefreshCw className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            ) : batches.length === 0 ? (
              <p className="text-[11px] text-zinc-400 font-bold py-4 text-center">Aucun lot enregistré</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {batches.map((b) => (
                  <div
                    key={b.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                      b.isExpired
                        ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50"
                        : b.isExpiringSoon
                        ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50"
                        : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-black text-foreground">#{b.batchNumber}</p>
                      <p className="text-[10px] font-bold text-zinc-500">
                        {b.quantity} unité{b.quantity !== 1 ? "s" : ""} · {formatPrice(b.buyingPrice)} /u
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {b.expiresAt && (
                        <p className={`text-[10px] font-black uppercase tracking-wider ${
                          b.isExpired ? "text-red-600" : b.isExpiringSoon ? "text-orange-600" : "text-zinc-500"
                        }`}>
                          {b.isExpired ? "Expiré" : b.isExpiringSoon ? "Bientôt" : "Exp."} {formatDate(b.expiresAt)}
                        </p>
                      )}
                      <p className="text-[10px] text-zinc-400 font-bold">Reçu {formatDate(b.receivedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulaire arrivage */}
          <form onSubmit={handleAddBatch} className="flex flex-col gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Archive className="h-3 w-3" /> Enregistrer un arrivage
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">N° de lot <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="LOT-2026-001"
                  value={batchForm.batchNumber}
                  onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Quantité <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min={1}
                  value={batchForm.quantity}
                  onChange={(e) => setBatchForm({ ...batchForm, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Prix d'achat /u</label>
                <input
                  type="number"
                  min={0}
                  value={batchForm.buyingPrice}
                  onChange={(e) => setBatchForm({ ...batchForm, buyingPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Date de péremption</label>
                <input
                  type="date"
                  value={batchForm.expiresAt}
                  onChange={(e) => setBatchForm({ ...batchForm, expiresAt: e.target.value })}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Date de réception</label>
                <input
                  type="date"
                  value={batchForm.receivedAt}
                  onChange={(e) => setBatchForm({ ...batchForm, receivedAt: e.target.value })}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-11 text-xs" onClick={() => setIsBatchModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" className="flex-1 h-11 text-xs" loading={submittingBatch}>
                Enregistrer le lot
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── Modal : Composition du kit ─────────────────────────────────── */}
      <Modal
        isOpen={isKitModalOpen}
        onClose={() => setIsKitModalOpen(false)}
        title={`Composition kit — ${productForDetail?.name ?? ""}`}
        size="lg"
      >
        <div className="flex flex-col gap-5 p-1 max-h-[80vh] overflow-y-auto">

          {/* Liste des composants */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Layers className="h-3 w-3" /> Composants du kit
            </h4>
            {loadingDetail ? (
              <div className="flex justify-center py-6">
                <RefreshCw className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            ) : kitComponents.length === 0 ? (
              <p className="text-[11px] text-zinc-400 font-bold py-4 text-center">
                Aucun composant — ce produit n'est pas encore configuré comme kit
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {kitComponents.map((comp) => (
                  <div
                    key={comp.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-black text-foreground truncate">
                        {comp.componentProduct?.name ?? comp.componentProductId}
                      </p>
                      <p className="text-[10px] font-bold text-zinc-500">
                        × {comp.quantity} · Stock: {comp.componentProduct?.stockQty ?? "—"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteComponent(comp.id)}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/20 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulaire ajout composant */}
          <form onSubmit={handleAddComponent} className="flex flex-col gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Plus className="h-3 w-3" /> Ajouter un composant
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Produit composant <span className="text-red-500">*</span></label>
                <select
                  value={componentForm.componentProductId}
                  onChange={(e) => setComponentForm({ ...componentForm, componentProductId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                >
                  <option value="">Sélectionner un produit...</option>
                  {products
                    .filter((p) => p.id !== productForDetail?.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.sku ? `(${p.sku})` : ""}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Quantité <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min={1}
                  value={componentForm.quantity}
                  onChange={(e) => setComponentForm({ ...componentForm, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-11 text-xs" onClick={() => setIsKitModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" className="flex-1 h-11 text-xs" loading={submittingComponent}>
                Ajouter
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </AppLayout>
  );
}