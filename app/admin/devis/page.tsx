"use client";

import React, { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import ShopService, { Shop } from "@/services/shop.service";
import ProductService, { Product } from "@/services/product.service";
import SupplierService from "@/services/super/supplier.service";
import PurchaseOrderService from "@/services/super/purchaseOrder.service";
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus, Supplier } from "@/types/super";
import {
  FileText,
  Search,
  Printer,
  TrendingUp,
  Plus,
  Trash2,
  Calendar,
  Truck,
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Package,
  ChevronRight,
  Info,
  Layers,
  Archive,
  RefreshCw
} from "lucide-react";
import Image from "next/image";

interface NewOrderItem {
  productId: string;
  name: string;
  sku?: string;
  quantityOrdered: number;
  unitCost: number;
}

interface NewReceptionItem {
  productId: string;
  name: string;
  quantityOrdered: number;
  quantityAlreadyReceived: number;
  quantityReceived: number; // Newly received count in this transaction
}

export default function AdminDevisPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  // Active loaded datasets
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShop, setSelectedShop] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Create wizard state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createShopId, setCreateShopId] = useState("");
  const [createSupplierId, setCreateSupplierId] = useState("");
  const [expectedAt, setExpectedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [newOrderItems, setNewOrderItems] = useState<NewOrderItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogSearch, setCatalogSearch] = useState("");

  // Reset catalog search and page when the modal closes/opens
  useEffect(() => {
    if (!isCreateOpen) {
      setCatalogPage(1);
      setCatalogSearch("");
    }
  }, [isCreateOpen]);

  // Details Modal state
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Receive Modal state
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [receptionItems, setReceptionItems] = useState<NewReceptionItem[]>([]);
  const [isSubmittingReception, setIsSubmittingReception] = useState(false);

  // Status transitions loading state
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Cancel Confirm Modal state
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [poToCancel, setPoToCancel] = useState<string | null>(null);

  // Initial load
  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch core datasets
      const [shopRes, supplierRes, prodRes, poRes] = await Promise.all([
        ShopService.getAll(),
        SupplierService.getAll({ limit: 200 }),
        ProductService.getAll({ limit: 200 }),
        PurchaseOrderService.getAll({ limit: 200 })
      ]);

      const activeShops = Array.isArray(shopRes) ? shopRes : shopRes?.data || [];
      const activeSuppliers = Array.isArray(supplierRes) ? supplierRes : supplierRes?.data || [];
      const activeProducts = Array.isArray(prodRes) ? prodRes : prodRes?.data || [];
      const activeOrders = Array.isArray(poRes) ? poRes : poRes?.data || [];

      setShops(activeShops);
      setSuppliers(activeSuppliers);
      setProducts(activeProducts);
      setOrders(activeOrders);

      // Pre-fill creation shop if user has a default one
      if (user?.shopId) {
        setCreateShopId(user.shopId);
      } else if (activeShops.length > 0) {
        setCreateShopId(activeShops[0].id);
      }

      if (activeSuppliers.length > 0) {
        setCreateSupplierId(activeSuppliers[0].id);
      }
    } catch (error) {
      console.error("Error loading PO data:", error);
      showToast("Erreur lors du chargement des données", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Utility Resolvers
  const getProductName = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    return prod ? prod.name : "Produit inconnu";
  };

  const getProductSku = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    return prod ? prod.sku || "N/A" : "N/A";
  };

  const getShopName = (shopId: string) => {
    const shop = shops.find(s => s.id === shopId);
    return shop ? shop.name : "Global / Boutique inconnue";
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : "Fournisseur inconnu";
  };

  // Status mapping to French badges
  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case PurchaseOrderStatus.DRAFT:
        return <Badge variant="outline">Brouillon</Badge>;
      case PurchaseOrderStatus.SENT:
        return <Badge variant="primary">Envoyé</Badge>;
      case PurchaseOrderStatus.PARTIAL:
        return <Badge variant="warning">Réception Partielle</Badge>;
      case PurchaseOrderStatus.RECEIVED:
        return <Badge variant="success">Entièrement Reçu</Badge>;
      case PurchaseOrderStatus.CANCELLED:
        return <Badge variant="danger">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  // Creation Wizard Methods
  const addProductToOrder = (product: Product) => {
    const alreadyExists = newOrderItems.some(item => item.productId === product.id);
    if (alreadyExists) {
      showToast("Ce produit est déjà présent dans la commande", "error");
      return;
    }
    setNewOrderItems(prev => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantityOrdered: 1,
        unitCost: product.buyingPrice || 0
      }
    ]);
    setProductSearch("");
  };

  const removeProductFromOrder = (productId: string) => {
    setNewOrderItems(prev => prev.filter(item => item.productId !== productId));
  };

  const updateOrderItemQuantity = (productId: string, quantity: number) => {
    setNewOrderItems(prev =>
      prev.map(item => (item.productId === productId ? { ...item, quantityOrdered: Math.max(1, quantity) } : item))
    );
  };

  const updateOrderItemCost = (productId: string, cost: number) => {
    setNewOrderItems(prev =>
      prev.map(item => (item.productId === productId ? { ...item, unitCost: Math.max(0, cost) } : item))
    );
  };

  const getOrderTotal = () => {
    return newOrderItems.reduce((acc, item) => acc + item.quantityOrdered * item.unitCost, 0);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createShopId) {
      showToast("Veuillez sélectionner un point de vente", "error");
      return;
    }
    if (!createSupplierId) {
      showToast("Veuillez sélectionner un fournisseur", "error");
      return;
    }
    if (newOrderItems.length === 0) {
      showToast("Veuillez ajouter au moins un produit à la commande", "error");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const payload = {
        shopId: createShopId,
        supplierId: createSupplierId,
        expectedAt: expectedAt ? new Date(expectedAt).toISOString() : undefined,
        notes: notes || undefined,
        items: newOrderItems.map(item => ({
          productId: item.productId,
          quantityOrdered: item.quantityOrdered,
          unitCost: item.unitCost
        }))
      };

      await PurchaseOrderService.create(payload);
      showToast("Bon de commande créé avec succès !", "success");
      
      // Reset wizard
      setIsCreateOpen(false);
      setNewOrderItems([]);
      setExpectedAt("");
      setNotes("");
      
      // Reload list
      await loadData();
    } catch (error) {
      console.error("Error creating PO:", error);
      showToast("Erreur lors de la création du bon de commande", "error");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Status transitions execution
  const handleTransitionStatus = async (id: string, newStatus: PurchaseOrderStatus) => {
    setIsTransitioning(true);
    try {
      const updated = await PurchaseOrderService.updateStatus(id, newStatus);
      showToast(`Statut mis à jour : ${newStatus === PurchaseOrderStatus.SENT ? 'Envoyé au fournisseur' : 'Annulé'}`, "success");
      
      // Update local state cleanly
      setOrders(prev => prev.map(o => (o.id === id ? updated : o)));
      if (selectedPO?.id === id) {
        setSelectedPO(updated);
      }
    } catch (error) {
      console.error("Error updating PO status:", error);
      showToast("Erreur lors de la mise à jour du statut", "error");
    } finally {
      setIsTransitioning(false);
    }
  };

  // Item Reception Methods
  const openReceptionWizard = (po: PurchaseOrder) => {
    const items = po.items || [];
    const mapping: NewReceptionItem[] = items.map(item => ({
      productId: item.productId,
      name: getProductName(item.productId),
      quantityOrdered: item.quantityOrdered,
      quantityAlreadyReceived: item.quantityReceived || 0,
      quantityReceived: 0 // Initialize incoming received count as 0
    }));

    setReceptionItems(mapping);
    setIsReceiveOpen(true);
  };

  const updateReceptionQuantity = (productId: string, quantity: number) => {
    setReceptionItems(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          const maxRemaining = item.quantityOrdered - item.quantityAlreadyReceived;
          const capped = Math.min(maxRemaining, Math.max(0, quantity));
          return { ...item, quantityReceived: capped };
        }
        return item;
      })
    );
  };

  const autoFillReception = () => {
    setReceptionItems(prev =>
      prev.map(item => ({
        ...item,
        quantityReceived: item.quantityOrdered - item.quantityAlreadyReceived
      }))
    );
    showToast("Quantités pré-remplies pour réception complète !", "success");
  };

  const handleConfirmReception = async () => {
    if (!selectedPO) return;
    if (!user?.id) {
      showToast("Erreur d'authentification : Utilisateur non connecté", "error");
      return;
    }

    const validItems = receptionItems.filter(item => item.quantityReceived > 0);
    if (validItems.length === 0) {
      showToast("Veuillez déclarer au moins un article reçu (quantité > 0)", "error");
      return;
    }

    setIsSubmittingReception(true);
    try {
      const payload = {
        userId: user.id,
        items: validItems.map(item => ({
          productId: item.productId,
          quantityReceived: item.quantityReceived
        }))
      };

      const updated = await PurchaseOrderService.receiveItems(selectedPO.id, payload as any);
      showToast("Réception enregistrée avec succès !", "success");
      
      // Update local state
      setOrders(prev => prev.map(o => (o.id === selectedPO.id ? updated : o)));
      setSelectedPO(updated);
      setIsReceiveOpen(false);
      
      // Reload products catalog in case prices/stocks updated
      const prodRes = await ProductService.getAll({ limit: 200 });
      setProducts(Array.isArray(prodRes) ? prodRes : prodRes?.data || []);
    } catch (error) {
      console.error("Error receiving items:", error);
      showToast("Erreur lors de la validation de la réception", "error");
    } finally {
      setIsSubmittingReception(false);
    }
  };

  // Printing & Document Actions
  const handlePrint = () => {
    window.print();
  };

  // Filter application
  const filteredOrders = orders.filter(po => {
    const matchesSearch =
      po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSupplierName(po.supplierId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesShop = !selectedShop || po.shopId === selectedShop;
    const matchesSupplier = !selectedSupplier || po.supplierId === selectedSupplier;
    const matchesStatus = !selectedStatus || po.status === selectedStatus;

    return matchesSearch && matchesShop && matchesSupplier && matchesStatus;
  });

  // Calculate filtered products for autocomplete creation
  const filteredSearchProducts = productSearch.trim() === ""
    ? []
    : products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.barcode?.includes(productSearch)
      ).slice(0, 5);

  // Paginated catalog stock products for the new grid interface
  const catalogFilteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    p.barcode?.includes(catalogSearch)
  );

  const totalCatalogPages = Math.ceil(catalogFilteredProducts.length / 5) || 1;
  const paginatedCatalogProducts = catalogFilteredProducts.slice(
    (catalogPage - 1) * 5,
    catalogPage * 5
  );
  // DataTable configuration
  const columns = [
    {
      header: "Référence",
      accessor: (po: PurchaseOrder) => (
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="font-black text-zinc-800 dark:text-zinc-150 font-mono text-[11px]">
              {po.id.slice(0, 8).toUpperCase()}...
            </p>
            <p className="text-[10px] text-zinc-400">Créé le: {new Date(po.createdAt).toLocaleDateString("fr-FR")}</p>
          </div>
        </div>
      )
    },
    {
      header: "Point de Vente",
      accessor: (po: PurchaseOrder) => (
        <span className="text-xs font-bold text-zinc-500">
          {getShopName(po.shopId)}
        </span>
      )
    },
    {
      header: "Fournisseur",
      accessor: (po: PurchaseOrder) => (
        <div className="text-xs">
          <p className="font-black text-zinc-700 dark:text-zinc-300">{getSupplierName(po.supplierId)}</p>
        </div>
      )
    },
    {
      header: "Articles",
      accessor: (po: PurchaseOrder) => (
        <Badge variant="outline" className="font-black">
          {po.items?.length || 0} Prod
        </Badge>
      )
    },
    {
      header: "Montant Net",
      accessor: (po: PurchaseOrder) => (
        <span className="font-black text-zinc-800 dark:text-zinc-100 font-mono text-xs">
          {new Intl.NumberFormat("fr-FR").format(po.totalAmount || 0)} XOF
        </span>
      )
    },
    {
      header: "Livraison prévue",
      accessor: (po: PurchaseOrder) => (
        <span className="text-xs font-bold text-zinc-500 font-mono">
          {po.expectedAt ? new Date(po.expectedAt).toLocaleDateString("fr-FR") : "Non définie"}
        </span>
      )
    },
    {
      header: "Statut",
      accessor: (po: PurchaseOrder) => getStatusBadge(po.status)
    },
    {
      header: "Actions",
      accessor: (po: PurchaseOrder) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => { setSelectedPO(po); setIsViewOpen(true); }}
          className="hover:border-primary hover:text-primary transition-all font-black text-[10px]"
        >
          Consulter
        </Button>
      )
    }
  ];

  return (
    <AppLayout
      title="Bons de Commande Professionnels"
      subtitle="Création, suivi, et réception des approvisionnements fournisseurs"
      rightElement={
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" className="gap-2 sm:px-4">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} variant="primary" className="gap-2 sm:px-4">
            <Plus className="h-4 w-4" />
            Nouveau Bon
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 pb-28 md:pb-12">
        {/* KPI Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="flex items-center justify-between border-none shadow-lg bg-gradient-to-br from-indigo-500/10 to-indigo-100/5 p-5">
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Bons</p>
              <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-150 mt-1 font-mono">
                {orders.length}
              </h3>
            </div>
            <div className="p-3 bg-indigo-500/15 rounded-xl text-indigo-500">
              <FileText className="h-5 w-5" />
            </div>
          </Card>
          <Card className="flex items-center justify-between border-none shadow-lg bg-gradient-to-br from-emerald-500/10 to-emerald-100/5 p-5">
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Valeur Commande</p>
              <h3 className="text-2xl font-black text-zinc-850 dark:text-zinc-50 mt-1 font-mono text-emerald-600 dark:text-emerald-400">
                {new Intl.NumberFormat("fr-FR").format(orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0))} XOF
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/15 rounded-xl text-emerald-500">
              <TrendingUp className="h-5 w-5" />
            </div>
          </Card>
          <Card className="flex items-center justify-between border-none shadow-lg bg-gradient-to-br from-amber-500/10 to-amber-100/5 p-5">
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">En Cours de Réception</p>
              <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-150 mt-1 font-mono">
                {orders.filter(o => o.status === PurchaseOrderStatus.SENT || o.status === PurchaseOrderStatus.PARTIAL).length}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/15 rounded-xl text-amber-500">
              <Truck className="h-5 w-5" />
            </div>
          </Card>
          <Card className="flex items-center justify-between border-none shadow-lg bg-gradient-to-br from-teal-500/10 to-teal-100/5 p-5">
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Entièrement Reçus</p>
              <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-150 mt-1 font-mono">
                {orders.filter(o => o.status === PurchaseOrderStatus.RECEIVED).length}
              </h3>
            </div>
            <div className="p-3 bg-teal-500/15 rounded-xl text-teal-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </Card>
        </div>
        {/* Search & Advanced Filters */}
        <Card className="p-4 border-none shadow-xl bg-white dark:bg-zinc-900/50 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher par référence, fournisseur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all text-zinc-750 dark:text-zinc-200"
              />
            </div>
            {/* Shop filter */}
            <div>
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all text-zinc-750 dark:text-zinc-200"
              >
                <option value="">-- Tous les points de vente --</option>
                {shops.map(shop => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
            </div>

            {/* Supplier filter */}
            <div>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all text-zinc-750 dark:text-zinc-200"
              >
                <option value="">-- Tous les fournisseurs --</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all text-zinc-750 dark:text-zinc-200"
              >
                <option value="">-- Tous les statuts --</option>
                <option value={PurchaseOrderStatus.DRAFT}>Brouillon</option>
                <option value={PurchaseOrderStatus.SENT}>Envoyé</option>
                <option value={PurchaseOrderStatus.PARTIAL}>Réception Partielle</option>
                <option value={PurchaseOrderStatus.RECEIVED}>Entièrement Reçu</option>
                <option value={PurchaseOrderStatus.CANCELLED}>Annulé</option>
              </select>
            </div>
          </div>
        </Card>

        {/* DataTable List */}
        <Card className="overflow-hidden border-none shadow-xl bg-white dark:bg-zinc-900 rounded-3xl">
          <DataTable
            columns={columns}
            data={filteredOrders}
            isLoading={loading}
          />
        </Card>
      </div>

      {/* -------------------- WIZARD : CRÉATION DE BON DE COMMANDE -------------------- */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Créer un nouveau Bon de Commande Fournisseur"
        size="xl"
      >
        <form onSubmit={handleCreateOrder} className="flex flex-col gap-6 text-zinc-800 dark:text-zinc-150">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Form configuration parameters (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-5 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 max-h-[70vh] overflow-y-auto">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-2">
                <Info className="h-4.5 w-4.5 text-primary" />
                Configuration
              </h3>

              {/* Point de vente */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Point de Vente</label>
                <select
                  value={createShopId}
                  onChange={(e) => setCreateShopId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none"
                  required
                >
                  <option value="">Sélectionner...</option>
                  {shops.map(shop => (
                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                  ))}
                </select>
              </div>

              {/* Fournisseur */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Fournisseur</label>
                <select
                  value={createSupplierId}
                  onChange={(e) => setCreateSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none"
                  required
                >
                  <option value="">Sélectionner...</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>

              {/* Expected Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Livraison prévue le</label>
                <input
                  type="date"
                  value={expectedAt}
                  onChange={(e) => setExpectedAt(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Instructions / Notes</label>
                <textarea
                  placeholder="Écrire des consignes pour la livraison..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none resize-none"
                />
              </div>

              {/* Financial Recap & CTA */}
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-4">
                <div>
                  <span className="text-[9px] uppercase tracking-widest font-black text-zinc-400">Montant Total Net Estimé</span>
                  <h4 className="text-xl font-black text-primary font-mono mt-0.5">
                    {new Intl.NumberFormat("fr-FR").format(getOrderTotal())} <span className="text-xs font-bold text-zinc-450 dark:text-zinc-300">XOF</span>
                  </h4>
                  <span className="text-[9px] text-zinc-450 dark:text-zinc-450 font-bold block mt-1">{newOrderItems.length} article(s) sélectionné(s)</span>
                </div>

                <div className="flex flex-col gap-2">
                  <Button type="submit" variant="primary" loading={isSubmittingOrder} disabled={newOrderItems.length === 0} className="w-full">
                    Créer le Bon
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="w-full">
                    Annuler
                  </Button>
                </div>
              </div>
            </div>

            {/* Catalog Browser & Selected Items (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-1">
              
              {/* Product catalog with pagination */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <Package className="h-4.5 w-4.5 text-primary" />
                    Catalogue des Produits en Stock
                  </h3>
                  
                  {/* Small Search Bar */}
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un produit..."
                      value={catalogSearch}
                      onChange={(e) => {
                        setCatalogSearch(e.target.value);
                        setCatalogPage(1); // Reset page to 1 when searching
                      }}
                      className="w-full pl-8 pr-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all text-zinc-750 dark:text-zinc-200"
                    />
                  </div>
                </div>

                {/* Paginated Products List */}
                <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                  <table className="w-full text-left text-xs font-bold">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-150 dark:border-zinc-800/80 text-[10px] text-zinc-400 uppercase tracking-wider">
                        <th className="p-2.5">Produit</th>
                        <th className="p-2.5 text-center">Stock Actuel</th>
                        <th className="p-2.5 text-right">Prix d'Achat</th>
                        <th className="p-2.5 text-center w-24">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                      {paginatedCatalogProducts.map(product => {
                        const alreadyInList = newOrderItems.some(i => i.productId === product.id);
                        return (
                          <tr key={product.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                            <td className="p-2.5">
                              <p className="font-black text-zinc-800 dark:text-zinc-150 text-[11px]">{product.name}</p>
                              <p className="text-[9px] font-mono text-zinc-400">SKU: {product.sku || "N/A"}</p>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                product.stockQty <= product.minStockQty
                                  ? "bg-red-500/10 text-red-600 border-red-500/20"
                                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              }`}>
                                {product.stockQty} en stock
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono text-[10px] text-zinc-700 dark:text-zinc-300">
                              {new Intl.NumberFormat("fr-FR").format(product.buyingPrice || 0)} XOF
                            </td>
                            <td className="p-2.5 text-center">
                              {alreadyInList ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Ajouté
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => addProductToOrder(product)}
                                  className="inline-flex items-center gap-1 text-[9px] font-black text-primary hover:text-white bg-primary/10 hover:bg-primary px-2.5 py-1 rounded-lg border border-primary/20 hover:border-primary transition-all"
                                >
                                  <Plus className="h-3 w-3" />
                                  Ajouter
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {paginatedCatalogProducts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-zinc-400 font-bold">
                            Aucun produit disponible.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Catalog Pagination Footer */}
                  {totalCatalogPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                      <button
                        type="button"
                        disabled={catalogPage <= 1}
                        onClick={() => setCatalogPage(prev => Math.max(1, prev - 1))}
                        className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border border-zinc-200 dark:border-zinc-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-750 dark:text-zinc-200"
                      >
                        Précédent
                      </button>
                      <span className="text-[10px] font-bold text-zinc-500">
                        Page {catalogPage} sur {totalCatalogPages}
                      </span>
                      <button
                        type="button"
                        disabled={catalogPage >= totalCatalogPages}
                        onClick={() => setCatalogPage(prev => Math.min(totalCatalogPages, prev + 1))}
                        className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border border-zinc-200 dark:border-zinc-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-750 dark:text-zinc-200"
                      >
                        Suivant
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected items table (Le Panier) */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <Layers className="h-4.5 w-4.5 text-primary" />
                  Articles Sélectionnés pour le Bon ({newOrderItems.length})
                </h3>

                <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                  <table className="w-full text-left text-xs font-bold">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-150 dark:border-zinc-800/80 text-[10px] text-zinc-400 uppercase tracking-wider">
                        <th className="p-3">Désignation</th>
                        <th className="p-3 text-center w-28">Quantité</th>
                        <th className="p-3 text-right w-36">Coût Unit (XOF)</th>
                        <th className="p-3 text-right w-32">Total</th>
                        <th className="p-3 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-855">
                      {newOrderItems.map(item => (
                        <tr key={item.productId} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-800/10">
                          <td className="p-3">
                            <p className="font-black text-zinc-800 dark:text-zinc-150 text-[11px]">{item.name}</p>
                            <p className="text-[9px] font-mono text-zinc-400">SKU: {item.sku || "N/A"}</p>
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantityOrdered}
                              onChange={(e) => updateOrderItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-center font-bold text-xs"
                              required
                            />
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.unitCost}
                              onChange={(e) => updateOrderItemCost(item.productId, parseInt(e.target.value) || 0)}
                              className="w-28 px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-right font-bold text-xs font-mono"
                              required
                            />
                          </td>
                          <td className="p-3 text-right font-mono text-zinc-900 dark:text-zinc-50">
                            {new Intl.NumberFormat("fr-FR").format(item.quantityOrdered * item.unitCost)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeProductFromOrder(item.productId)}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {newOrderItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-zinc-450 opacity-40">
                            <Archive className="h-10 w-10 mx-auto mb-2 text-zinc-400" />
                            <p className="text-xs uppercase tracking-widest font-black">Aucun produit sélectionné</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        </form>
      </Modal>

      {/* -------------------- VIEW & INSPECTION DRAWER -------------------- */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Consultation du Bon de Commande"
        size="lg"
      >
        {selectedPO && (
          <div className="flex flex-col gap-6 text-zinc-800 dark:text-zinc-150 print:p-0">
            {/* Header section */}
            <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-black text-zinc-850 dark:text-zinc-100 uppercase tracking-wider font-mono">
                    BON DE COMMANDE FOURNISSEUR
                  </h3>
                  {getStatusBadge(selectedPO.status)}
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                  Réf. UUID: {selectedPO.id}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                  {getShopName(selectedPO.shopId)}
                </p>
                <p className="text-[10px] text-zinc-400">Date d'émission: {new Date(selectedPO.createdAt).toLocaleDateString("fr-FR")}</p>
              </div>
            </div>

            {/* Partner/Conditions cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
              <div className="bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-100 dark:border-zinc-850">
                <p className="text-[9px] text-zinc-400 uppercase tracking-wider mb-1">Fournisseur Partenaire</p>
                <p className="text-sm font-black text-zinc-800 dark:text-zinc-200">{getSupplierName(selectedPO.supplierId)}</p>
                {suppliers.find(s => s.id === selectedPO.supplierId)?.phone && (
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">Tel: {suppliers.find(s => s.id === selectedPO.supplierId)?.phone}</p>
                )}
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-100 dark:border-zinc-850">
                <p className="text-[9px] text-zinc-400 uppercase tracking-wider mb-1">Livraison & Conditions</p>
                <p className="text-zinc-650 dark:text-zinc-300">
                  Prévue le : <span className="font-mono text-zinc-800 dark:text-zinc-100">{selectedPO.expectedAt ? new Date(selectedPO.expectedAt).toLocaleDateString("fr-FR") : "Non définie"}</span>
                </p>
                {selectedPO.notes && (
                  <p className="text-[10px] text-zinc-400 italic mt-1.5 font-normal">Notes: "{selectedPO.notes}"</p>
                )}
              </div>
            </div>

            {/* Ordered Items with Progress Bars */}
            <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs font-bold">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-150 dark:border-zinc-850 text-zinc-400 text-[10px] uppercase tracking-wider">
                    <th className="p-3">Désignation</th>
                    <th className="p-3 text-center w-28">Quantités</th>
                    <th className="p-3 w-40">Progression Réception</th>
                    <th className="p-3 text-right w-28">Coût Unit</th>
                    <th className="p-3 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {selectedPO.items?.map((item: PurchaseOrderItem, idx) => {
                    const ordered = item.quantityOrdered;
                    const received = item.quantityReceived || 0;
                    const percent = Math.min(100, Math.round((received / ordered) * 100));
                    return (
                      <tr key={item.id || `po-item-${item.productId || idx}`}>
                        <td className="p-3">
                          <p className="font-black text-zinc-855 dark:text-zinc-100">{getProductName(item.productId)}</p>
                          <p className="text-[9px] font-mono text-zinc-400">SKU: {getProductSku(item.productId)}</p>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-mono">{received}</span> / <span className="font-mono text-zinc-800 dark:text-zinc-200">{ordered}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  percent >= 100
                                    ? "bg-emerald-500"
                                    : percent > 0
                                    ? "bg-amber-500"
                                    : "bg-zinc-300 dark:bg-zinc-700"
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-bold text-zinc-500 font-mono">{percent}% reçu</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono">{new Intl.NumberFormat("fr-FR").format(item.unitCost)} XOF</td>
                        <td className="p-3 text-right font-mono text-zinc-900 dark:text-zinc-50">
                          {new Intl.NumberFormat("fr-FR").format(ordered * item.unitCost)} XOF
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-zinc-50/50 dark:bg-zinc-850/20 font-black text-zinc-800 dark:text-zinc-100 border-t border-zinc-200 dark:border-zinc-700">
                    <td colSpan={4} className="p-3 text-right uppercase tracking-wider text-[9px] text-zinc-400">Montant Total Net Réel</td>
                    <td className="p-3 text-right text-indigo-500 font-mono text-sm">
                      {new Intl.NumberFormat("fr-FR").format(selectedPO.totalAmount || 0)} XOF
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Audit trail */}
            {selectedPO.status === PurchaseOrderStatus.RECEIVED && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs">
                <CheckCircle2 className="h-4.5 w-4.5" />
                <span className="font-bold">Ce bon de commande a été entièrement livré et réceptionné en stock.</span>
              </div>
            )}
            {/* Actions for workflow status updates */}
            <div className="flex flex-wrap justify-between items-center gap-3 pt-2 print:hidden">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrint} className="gap-2 text-xs font-black">
                  <Printer className="h-4 w-4" />
                  Imprimer
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsViewOpen(false)} className="text-xs">
                  Fermer
                </Button>
                {/* Workflow Actions */}
                {selectedPO.status === PurchaseOrderStatus.DRAFT && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPoToCancel(selectedPO.id);
                        setIsCancelConfirmOpen(true);
                      }}
                      loading={isTransitioning}
                      className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-black"
                    >
                      Annuler la commande
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleTransitionStatus(selectedPO.id, PurchaseOrderStatus.SENT)}
                      loading={isTransitioning}
                      className="gap-1.5 text-xs font-black"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      Envoyer au fournisseur
                    </Button>
                  </>
                )}

                {(selectedPO.status === PurchaseOrderStatus.SENT || selectedPO.status === PurchaseOrderStatus.PARTIAL) && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPoToCancel(selectedPO.id);
                        setIsCancelConfirmOpen(true);
                      }}
                      loading={isTransitioning}
                      className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-black"
                    >
                      Annuler la commande
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => openReceptionWizard(selectedPO)}
                      className="gap-2 text-xs font-black"
                    >
                      <Truck className="h-4 w-4" />
                      Réceptionner du stock
                    </Button>
                  </>
                )}
              </div>
            </div>

          </div>
        )}
      </Modal>

      {/* -------------------- INTERFACE : RÉCEPTION DE MARCHANDISES -------------------- */}
      <Modal
        isOpen={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
        title="Enregistrer la Réception de Stock (Arrivage)"
        size="md"
      >
        {selectedPO && (
          <div className="flex flex-col gap-5 text-zinc-800 dark:text-zinc-150">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl flex items-center gap-3">
              <Info className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-black text-amber-800 dark:text-amber-400">Renseignez les quantités physiques comptées à la livraison.</p>
                <p className="text-[10px] text-amber-700/80 dark:text-amber-500 mt-0.5">La validation augmentera le stock des produits et mettra à jour leur dernier prix d'achat.</p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Matériaux à réceptionner</span>
              <button
                type="button"
                onClick={autoFillReception}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
              >
                Tout Réceptionner (Complet)
              </button>
            </div>

            {/* Checklist items to receive */}
            <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-850">
              {receptionItems.map(item => {
                const maxRemaining = item.quantityOrdered - item.quantityAlreadyReceived;
                return (
                  <div key={item.productId} className="flex items-center justify-between p-3.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-xs font-black text-zinc-800 dark:text-zinc-100 truncate">{item.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Commandé: <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{item.quantityOrdered}</span> | Déjà reçu: <span className="font-mono text-emerald-600 font-bold">{item.quantityAlreadyReceived}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <input
                          type="number"
                          min="0"
                          max={maxRemaining}
                          value={item.quantityReceived}
                          onChange={(e) => updateReceptionQuantity(item.productId, parseInt(e.target.value) || 0)}
                          className="w-24 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-center font-bold font-mono text-xs text-zinc-800 dark:text-zinc-100 focus:border-primary outline-none"
                        />
                        <span className="text-[8px] text-zinc-400 mt-1 font-bold">Reste max: {maxRemaining}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsReceiveOpen(false)}>
                Fermer
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmReception}
                loading={isSubmittingReception}
                className="gap-2 font-black"
              >
                <CheckCircle2 className="h-4 w-4" />
                Valider la Réception
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* -------------------- CONFIRMER L'ANNULATION DU BON -------------------- */}
      <ConfirmModal
        isOpen={isCancelConfirmOpen}
        onClose={() => {
          setIsCancelConfirmOpen(false);
          setPoToCancel(null);
        }}
        onConfirm={() => {
          if (poToCancel) {
            handleTransitionStatus(poToCancel, PurchaseOrderStatus.CANCELLED);
          }
        }}
        title="Annuler le bon de commande"
        message="Êtes-vous sûr de vouloir annuler ce bon de commande ? Cette action est irréversible et annulera tout arrivage de stock futur lié à cette commande."
        confirmLabel="Oui, annuler"
        variant="danger"
      />

      {/* Feuille de style globale d'impression */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Masquage de l'interface entière excepté la section d'impression */
          body * {
            visibility: hidden !important;
          }
          /* Rendre uniquement visible la section d'impression */
          #print-section, #print-section * {
            visibility: visible !important;
          }
          #print-section {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background-color: white !important;
            color: #111827 !important;
            padding: 24px !important;
          }
          /* ensure background colors are printed exactly */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          /* Empêcher les sauts de page disgracieux */
          tr {
            page-break-inside: avoid !important;
          }
        }
      `}} />

      {/* SECTION D'IMPRESSION PREMIUM STYLE (MOVEX LOGISTICS INSPIRED) */}
      {selectedPO && (
        <div id="print-section" className="hidden print:block bg-white text-zinc-900 font-sans p-8 select-none">
          {/* Ligne bleue d'en-tête */}
          <div className="h-2 bg-[#00a3e0] w-full mb-6"></div>

          {/* En-tête : Marque & Infos Bon */}
          <div className="flex justify-between items-stretch mb-8">
            {/* Logo et Nom à gauche */}
            <div className="bg-[#003b95] text-white pl-6 pr-12 py-5 rounded-br-[40px] flex items-center gap-4 min-w-[280px]">
              <div className="p-2 bg-white/10 rounded-xl">
                <Image src="/img/logo.png" alt="" width={20} height={20} className="rounded-xl" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight leading-none text-white">SP SERVICES</h1>
                <p className="text-[9px] text-[#00a3e0] font-bold uppercase tracking-widest mt-1">Gestion de Stock Pro</p>
              </div>
            </div>
            {/* Numéro et date à droite */}
            <div className="bg-[#003b95] text-white px-8 py-5 rounded-bl-[40px] text-right flex flex-col justify-center">
              <span className="text-[9px] uppercase tracking-widest text-zinc-300 font-black">BON DE COMMANDE FOURNISSEUR</span>
              <h2 className="text-sm font-black font-mono mt-1 text-[#00a3e0]">N° {selectedPO.id.slice(0, 8).toUpperCase()}-{selectedPO.id.slice(-4).toUpperCase()}</h2>
              <p className="text-[9px] text-zinc-200 font-bold mt-1">Date: {new Date(selectedPO.createdAt).toLocaleDateString("fr-FR")}</p>
            </div>
          </div>

          {/* Informations de paiement & Facturation */}
          <div className="grid grid-cols-2 gap-8 mb-8 text-xs font-bold">
            {/* Bloc de Paiement (Gauche) */}
            <div className="border border-[#003b95]/20 p-5 rounded-2xl bg-zinc-50/50">
              <h3 className="font-black text-[#003b95] uppercase tracking-wider mb-3 text-[10px]">Payment information:</h3>
              <div className="grid grid-cols-3 gap-y-1.5 font-bold text-zinc-500">
                <span className="col-span-1">Account:</span>
                <span className="col-span-2 font-mono text-zinc-800">4568789465132156</span>
                <span className="col-span-1">A/C Name:</span>
                <span className="col-span-2 text-zinc-800">SP SERVICES STOCK</span>
                <span className="col-span-1">Bank Detail:</span>
                <span className="col-span-2 text-zinc-800">ECOBANK CÔTE D'IVOIRE</span>
              </div>
            </div>

            {/* Bloc Fournisseur (Droite) */}
            <div className="p-1">
              <h3 className="font-black text-[#003b95] uppercase tracking-wider mb-3 text-[10px]">Fournisseur Partenaire:</h3>
              <div className="grid grid-cols-3 gap-y-1.5 font-bold text-zinc-500">
                <span className="col-span-1">Nom / Cie:</span>
                <span className="col-span-2 text-zinc-850 font-black">{getSupplierName(selectedPO.supplierId)}</span>
                <span className="col-span-1">Téléphone:</span>
                <span className="col-span-2 font-mono text-zinc-800">{suppliers.find(s => s.id === selectedPO.supplierId)?.phone || "Non renseigné"}</span>
                <span className="col-span-1">Adresse:</span>
                <span className="col-span-2 text-zinc-800">{suppliers.find(s => s.id === selectedPO.supplierId)?.address || "Abidjan, Côte d'Ivoire"}</span>
              </div>
            </div>
          </div>

          {/* Tableau des Articles Commandés */}
          <div className="border border-zinc-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
            <table className="w-full text-left text-xs font-bold">
              <thead>
                <tr className="bg-[#003b95] text-white text-[9px] uppercase tracking-wider border-b border-zinc-200">
                  <th className="p-3.5 text-center w-12 bg-[#003b95]">N°</th>
                  <th className="p-3.5 pl-6">Désignation des Articles</th>
                  <th className="p-3.5 text-right w-36">Prix Unitaire</th>
                  <th className="p-3.5 text-center w-24">Quantité</th>
                  <th className="p-3.5 text-right w-40">Montant Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {selectedPO.items?.map((item, idx) => (
                  <tr key={item.id || `print-item-${item.productId || idx}`} className="hover:bg-zinc-50/50">
                    <td className="p-3.5 text-center bg-[#003b95] text-white font-mono text-[10px]">{String(idx + 1).padStart(2, "0")}</td>
                    <td className="p-3.5 pl-6 text-zinc-800 text-[11px] font-black">{getProductName(item.productId)}</td>
                    <td className="p-3.5 text-right font-mono text-zinc-650">{new Intl.NumberFormat("fr-FR").format(item.unitCost)} XOF</td>
                    <td className="p-3.5 text-center font-mono text-zinc-650">{item.quantityOrdered}</td>
                    <td className="p-3.5 text-right font-mono text-zinc-900 font-black">{new Intl.NumberFormat("fr-FR").format(item.quantityOrdered * item.unitCost)} XOF</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Zone inférieure : CGV et Totaux */}
          <div className="grid grid-cols-12 gap-8 mb-12 text-xs">
            {/* Conditions Générales (Gauche) */}
            <div className="col-span-7 pr-4">
              <h4 className="font-black text-[#003b95] uppercase tracking-wider mb-2 text-[10px]">TERMS & CONDITIONS:</h4>
              <p className="text-[10px] text-zinc-400 leading-relaxed font-normal font-sans">
                Les marchandises livrées restent la propriété exclusive de SP SERVICES jusqu'au paiement intégral de la commande. Toute divergence ou contestation de quantité/qualité doit être notifiée par écrit sous un délai de 48 heures suivant la réception effective dans nos locaux.
              </p>
            </div>

            {/* Totaux (Droite) */}
            <div className="col-span-5 flex flex-col gap-2 text-right font-bold text-zinc-500">
              <div className="flex justify-between">
                <span>Sous-total:</span>
                <span className="font-mono text-zinc-700">{new Intl.NumberFormat("fr-FR").format(selectedPO.totalAmount || 0)} XOF</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span>Taxes (0%):</span>
                <span className="font-mono text-zinc-700">0 XOF</span>
              </div>
              <div className="flex justify-between text-sm font-black text-[#003b95] pt-1">
                <span>Montant Net à Payer:</span>
                <span className="font-mono text-[#00a3e0] text-base">{new Intl.NumberFormat("fr-FR").format(selectedPO.totalAmount || 0)} XOF</span>
              </div>
            </div>
          </div>

          {/* Pied de page décoratif */}
          <div className="relative mt-auto pt-8 border-t border-zinc-150 flex flex-col items-center">
            <p className="text-[9px] font-black text-[#003b95] uppercase tracking-widest">SP SERVICES - SYSTÈME D'APPROVISIONNEMENT ET DE STOCK</p>
            <p className="text-[9px] text-[#00a3e0] font-bold mt-1">Visit us at www.spservices.ci</p>
            
            {/* Bande bleue de pied de page */}
            <div className="h-1.5 bg-[#00a3e0] w-full mt-4 rounded-full"></div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}