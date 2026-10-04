"use client";

import React, { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import StockTransferService from "@/services/super/stockTransfer.service";
import ShopService, { Shop } from "@/services/shop.service";
import ProductService, { Product } from "@/services/product.service";
import { StockTransfer, StockTransferStatus } from "@/types/super";
import {
  Plus,
  Search,
  Building2,
  Calendar,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowRight,
  Eye,
  Trash2,
  Package,
  Boxes,
  Clock,
  Check,
  X,
  Barcode,
  Scan,
} from "lucide-react";
import { BarcodeScannerModal } from "@/components/ui/BarcodeScannerModal";

interface SelectedTransferItem {
  productId: string;
  name: string;
  sku?: string;
  barcode?: string;
  quantity: number;
}

type StatusFilter = "ALL" | "PENDING" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";

export default function AdminTransfertsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Creation States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [fromShopId, setFromShopId] = useState("");
  const [toShopId, setToShopId] = useState("");
  const [notes, setNotes] = useState("");
  
  // Products list of the selected source shop
  const [sourceProducts, setSourceProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedTransferItem[]>([]);
  const [tempProductId, setTempProductId] = useState("");
  const [tempQty, setTempQty] = useState(1);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // View Modal States
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);

  // Quick Action Confirmation State
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    status: string;
    title: string;
    message: string;
    confirmLabel: string;
    variant: "primary" | "danger";
  } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transRes, shopsRes] = await Promise.all([
        StockTransferService.getAll(),
        ShopService.getAll()
      ]);
      setTransfers(Array.isArray(transRes) ? transRes : transRes.data || []);
      setShops(Array.isArray(shopsRes) ? shopsRes : shopsRes?.data || []);
    } catch (error) {
      showToast("Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  };

  /** Nom de boutique : relation renvoyée par l'API, sinon recherche par ID dans la liste chargée */
  const getShopName = (embedded?: { name?: string } | null, id?: string) =>
    embedded?.name || shops.find((s) => s.id === id)?.name || "Boutique inconnue";

  // Noms et détails complets des produits résolus par ID (l'API ne renvoie que productId sur les lignes de transfert)
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [productDetails, setProductDetails] = useState<Record<string, Product>>({});

  useEffect(() => {
    if (!selectedTransfer?.items?.length) return;
    const missingIds = selectedTransfer.items
      .filter((i) => !i.product?.name && i.productId && !productDetails[i.productId])
      .map((i) => i.productId);
    if (missingIds.length === 0) return;

    let cancelled = false;
    Promise.all(
      Array.from(new Set(missingIds)).map((id) =>
        ProductService.getById(id)
          .then((p) => [id, p] as const)
          .catch(() => [id, undefined] as const)
      )
    ).then((entries) => {
      if (cancelled) return;
      setProductDetails((prev) => {
        const next = { ...prev };
        entries.forEach(([id, p]) => {
          if (p) next[id] = p;
        });
        return next;
      });
      setProductNames((prev) => {
        const next = { ...prev };
        entries.forEach(([id, p]) => {
          if (p?.name) next[id] = p.name;
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [selectedTransfer]);

  useEffect(() => {
    loadData();
  }, []);

  // Fetch products of fromShopId when it changes
  useEffect(() => {
    if (!fromShopId) {
      setSourceProducts([]);
      return;
    }
    const fetchProducts = async () => {
      try {
        const prodRes = await ProductService.getAll({ shopId: fromShopId, limit: 1000, isActive: true });
        const list = (Array.isArray(prodRes) ? prodRes : prodRes.data || []).filter(
          (p: Product) => p.isActive !== false
        );
        setSourceProducts(list);
      } catch (error) {
        showToast("Erreur lors du chargement des produits de la boutique source", "error");
      }
    };
    fetchProducts();
    setSelectedItems([]);
  }, [fromShopId]);

  // Bip sonore synthétisé lors d'un scan réussi
  const playBeep = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext optionnel selon permissions du navigateur
    }
  };

  // Traitement direct d'un scan code-barres (douchette ou caméra)
  const handleBarcodeScan = (scannedCode: string) => {
    const code = scannedCode.trim();
    if (!code) return;
    if (!fromShopId) {
      showToast("Veuillez d'abord sélectionner une boutique source", "error");
      return;
    }

    // Recherche par code-barres exact ou SKU
    const found = sourceProducts.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase() === code.toLowerCase())
    );

    if (!found) {
      showToast("Produit non trouvé avec ce code-barres dans la boutique source", "error");
      return;
    }

    if (found.stockQty <= 0) {
      showToast(`Stock épuisé pour « ${found.name} » (0 dispo)`, "error");
      return;
    }

    const existingIdx = selectedItems.findIndex((i) => i.productId === found.id);
    const currentQty = existingIdx > -1 ? selectedItems[existingIdx].quantity : 0;

    if (currentQty + 1 > found.stockQty) {
      showToast(`Stock insuffisant (${found.stockQty} maximum disponibles pour « ${found.name} »)`, "error");
      return;
    }

    playBeep();

    if (existingIdx > -1) {
      const updated = [...selectedItems];
      updated[existingIdx].quantity += 1;
      setSelectedItems(updated);
      showToast(`Quantité incrémentée : ${found.name} (${currentQty + 1})`, "success");
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          productId: found.id,
          name: found.name,
          sku: found.sku,
          barcode: found.barcode,
          quantity: 1,
        },
      ]);
      showToast(`Produit ajouté au transfert : ${found.name} (+1)`, "success");
    }

    setBarcodeInput("");
  };

  const handleAddItem = () => {
    if (!tempProductId || tempQty <= 0) return;
    const prod = sourceProducts.find((p) => p.id === tempProductId);
    if (!prod) return;

    if (prod.stockQty <= 0) {
      showToast(`Le produit « ${prod.name} » est en rupture de stock`, "error");
      return;
    }

    const existingIdx = selectedItems.findIndex((i) => i.productId === tempProductId);
    const currentQty = existingIdx > -1 ? selectedItems[existingIdx].quantity : 0;

    if (currentQty + tempQty > prod.stockQty) {
      showToast(`Stock insuffisant (${prod.stockQty} maximum disponibles)`, "error");
      return;
    }

    if (existingIdx > -1) {
      const updated = [...selectedItems];
      updated[existingIdx].quantity += tempQty;
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          productId: tempProductId,
          name: prod.name,
          sku: prod.sku,
          barcode: prod.barcode,
          quantity: tempQty,
        },
      ]);
    }
    setTempProductId("");
    setTempQty(1);
    setProductSearch("");
  };

  const handleRemoveItem = (idx: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== idx));
  };

  const handleCreateTransfer = async () => {
    if (!fromShopId || !toShopId || selectedItems.length === 0 || !user) {
      showToast("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }
    if (fromShopId === toShopId) {
      showToast("Les boutiques source et destination doivent être différentes", "error");
      return;
    }

    try {
      const created = await StockTransferService.create({
        fromShopId,
        toShopId,
        userId: user.id,
        notes,
        items: selectedItems.map(item => {
          const prod = sourceProducts.find(p => p.id === item.productId)!;
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitCost: prod.buyingPrice || 0
          };
        })
      });
      setTransfers(prev => [created, ...prev]);
      showToast("Transfert de stock initié avec succès !", "success");
      ProductService.invalidateCache();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("catalog-updated", { detail: { fromShopId, toShopId } }));
      }
      setIsCreateOpen(false);
      setFromShopId("");
      setToShopId("");
      setNotes("");
      setSelectedItems([]);
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Erreur lors du transfert", "error");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const updated = await StockTransferService.updateStatus(id, newStatus);
      setTransfers(prev => prev.map(t => t.id === id ? updated : t));
      if (selectedTransfer?.id === id) setSelectedTransfer(updated);
      showToast(`Statut du transfert mis à jour : ${newStatus}`, "success");
      ProductService.invalidateCache();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("catalog-updated", { detail: { transferId: id, status: newStatus } }));
      }
      setIsViewOpen(false);
      setConfirmAction(null);
      // Rechargement immédiat des transferts et des stocks
      await loadData();
      if (fromShopId) {
        const prodRes = await ProductService.getAll({ shopId: fromShopId, limit: 1000, isActive: true });
        const list = (Array.isArray(prodRes) ? prodRes : prodRes.data || []).filter(
          (p: Product) => p.isActive !== false
        );
        setSourceProducts(list);
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Erreur lors de la mise à jour", "error");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            En attente
          </span>
        );
      case "IN_TRANSIT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <Truck className="w-3 h-3" />
            En transit
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Reçu / Validé
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            Annulé
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {status}
          </span>
        );
    }
  };

  // Statistiques en direct
  const countsByStatus = useMemo(() => {
    return {
      all: transfers.length,
      pending: transfers.filter(t => t.status === "PENDING").length,
      inTransit: transfers.filter(t => t.status === "IN_TRANSIT").length,
      completed: transfers.filter(t => t.status === "COMPLETED").length,
      cancelled: transfers.filter(t => t.status === "CANCELLED").length,
    };
  }, [transfers]);

  // Filtrage combiné : Statut + Recherche textuelle
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchStatus;

      const fromName = getShopName(t.fromShop, t.fromShopId).toLowerCase();
      const toName = getShopName(t.toShop, t.toShopId).toLowerCase();
      const idMatch = t.id.toLowerCase().includes(q);
      const notesMatch = t.notes?.toLowerCase().includes(q);
      
      return matchStatus && (idMatch || fromName.includes(q) || toName.includes(q) || notesMatch);
    });
  }, [transfers, statusFilter, searchQuery, shops]);

  // Colonnes pour la vue Desktop DataTable
  const columns = [
    {
      header: "N° Transfert",
      accessor: (t: StockTransfer) => (
        <div className="flex flex-col">
          <span className="font-mono font-black text-xs text-foreground tracking-wider">
            #{t.id.slice(0, 8).toUpperCase()}
          </span>
          <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
            <Calendar className="h-3 w-3" />
            {new Date(t.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )
    },
    {
      header: "Itinéraire (Source ➜ Destination)",
      accessor: (t: StockTransfer) => (
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-zinc-500" />
            {getShopName(t.fromShop, t.fromShopId)}
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-blue-500" />
            {getShopName(t.toShop, t.toShopId)}
          </span>
        </div>
      )
    },
    {
      header: "Articles & Volume",
      accessor: (t: StockTransfer) => {
        const totalItems = t.items?.length || 0;
        const totalQty = t.items?.reduce((acc, i) => acc + (i.quantity || 0), 0) || 0;
        return (
          <div className="flex flex-col">
            <span className="text-xs font-black text-foreground">
              {totalItems} article{totalItems > 1 ? "s" : ""}
            </span>
            <span className="text-[11px] font-bold text-zinc-400">
              {totalQty} unité{totalQty > 1 ? "s" : ""} transférée{totalQty > 1 ? "s" : ""}
            </span>
          </div>
        );
      }
    },
    {
      header: "Statut",
      accessor: (t: StockTransfer) => getStatusBadge(t.status)
    },
    {
      header: "Actions",
      accessor: (t: StockTransfer) => (
        <div className="flex items-center justify-end gap-2">
          {/* Quick Validate Button directly in table if actionable */}
          {(t.status === "PENDING" || t.status === "IN_TRANSIT") && (
            <Button
              variant="primary"
              size="sm"
              className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmAction({
                  id: t.id,
                  status: "COMPLETED",
                  title: "Valider la Réception",
                  message: `Confirmer la réception du transfert #${t.id.slice(0, 8).toUpperCase()} vers « ${getShopName(t.toShop, t.toShopId)} » ? Les stocks seront immédiatement mis à jour.`,
                  confirmLabel: "Confirmer la Réception",
                  variant: "primary"
                });
              }}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Valider
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs"
            onClick={() => {
              setSelectedTransfer(t);
              setIsViewOpen(true);
            }}
          >
            <Eye className="h-3.5 w-3.5 mr-1 text-zinc-500" />
            Détails
          </Button>
        </div>
      ),
      className: "text-right"
    }
  ];

  return (
    <AppLayout
      title="Transferts de Stock Inter-Boutiques"
      subtitle="Supervision et validation en temps réel des flux de marchandises"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)} className="font-bold">
          <Plus className="h-4 w-4 mr-1.5" />
          Nouveau Transfert
        </Button>
      }
    >
      <div className="flex flex-col gap-6 pb-6 sm:pb-0">

        {/* ── CARTES KPI RÉCAPITULATIVES (EXECUTIVE SUMMARY) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div 
            onClick={() => setStatusFilter("ALL")}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              statusFilter === "ALL" 
                ? "bg-blue-50/80 dark:bg-blue-950/30 border-blue-500/50 shadow-md shadow-blue-500/10" 
                : "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total</span>
              <Boxes className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-foreground">{countsByStatus.all}</div>
            <span className="text-[11px] font-bold text-zinc-400 mt-1 block">Tous les mouvements</span>
          </div>

          <div 
            onClick={() => setStatusFilter("PENDING")}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              statusFilter === "PENDING" 
                ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-500/50 shadow-md shadow-amber-500/10" 
                : "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between text-amber-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">En Attente</span>
              <Clock className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{countsByStatus.pending}</div>
            <span className="text-[11px] font-bold text-amber-600/80 dark:text-amber-400/80 mt-1 block">À valider rapidement</span>
          </div>

          <div 
            onClick={() => setStatusFilter("IN_TRANSIT")}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              statusFilter === "IN_TRANSIT" 
                ? "bg-blue-50/80 dark:bg-blue-950/30 border-blue-500/50 shadow-md shadow-blue-500/10" 
                : "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between text-blue-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">En Transit</span>
              <Truck className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{countsByStatus.inTransit}</div>
            <span className="text-[11px] font-bold text-blue-600/80 dark:text-blue-400/80 mt-1 block">En cours d'expédition</span>
          </div>

          <div 
            onClick={() => setStatusFilter("COMPLETED")}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              statusFilter === "COMPLETED" 
                ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-500/10" 
                : "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between text-emerald-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Réceptionnés</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{countsByStatus.completed}</div>
            <span className="text-[11px] font-bold text-emerald-600/80 dark:text-emerald-400/80 mt-1 block">Stock réceptionné</span>
          </div>
        </div>

        {/* ── BARRE DE FILTRES PAR STATUTS & RECHERCHE ── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Onglets Filtre par Statut */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                statusFilter === "ALL"
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100"
              }`}
            >
              <span>Tous</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-700/20 dark:bg-zinc-300/20">{countsByStatus.all}</span>
            </button>

            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                statusFilter === "PENDING"
                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 border-zinc-200 dark:border-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-950/20"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>En attente</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20">{countsByStatus.pending}</span>
            </button>

            <button
              onClick={() => setStatusFilter("IN_TRANSIT")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                statusFilter === "IN_TRANSIT"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 border-zinc-200 dark:border-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              }`}
            >
              <Truck className="w-3 h-3" />
              <span>En transit</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20">{countsByStatus.inTransit}</span>
            </button>

            <button
              onClick={() => setStatusFilter("COMPLETED")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                statusFilter === "COMPLETED"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 border-zinc-200 dark:border-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              }`}
            >
              <Check className="w-3 h-3" />
              <span>Reçus</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20">{countsByStatus.completed}</span>
            </button>

            <button
              onClick={() => setStatusFilter("CANCELLED")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                statusFilter === "CANCELLED"
                  ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 border-zinc-200 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              }`}
            >
              <X className="w-3 h-3" />
              <span>Annulés</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20">{countsByStatus.cancelled}</span>
            </button>
          </div>

          {/* Recherche textuelle */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par N°, boutique..."
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── VUE MOBILE DÉDIÉE (CARDS TOUCH-FRIENDLY & VALIDATION DIRECTE) ── */}
        <div className="block md:hidden space-y-3">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
              ))}
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6">
              <Boxes className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-zinc-500">Aucun transfert trouvé</p>
            </div>
          ) : (
            filteredTransfers.map((t) => {
              const totalItems = t.items?.length || 0;
              const totalQty = t.items?.reduce((acc, i) => acc + (i.quantity || 0), 0) || 0;
              const isActionable = t.status === "PENDING" || t.status === "IN_TRANSIT";

              return (
                <div
                  key={t.id}
                  className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm space-y-3"
                >
                  {/* Ligne 1 : N° et Statut */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-black text-xs text-foreground tracking-wider block">
                        #{t.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(t.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {getStatusBadge(t.status)}
                  </div>

                  {/* Ligne 2 : Itinéraire visuel */}
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-1.5 truncate">
                      <Building2 className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate text-zinc-700 dark:text-zinc-200">{getShopName(t.fromShop, t.fromShopId)}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mx-2" />
                    <div className="flex items-center gap-1.5 truncate">
                      <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="truncate text-blue-700 dark:text-blue-300">{getShopName(t.toShop, t.toShopId)}</span>
                    </div>
                  </div>

                  {/* Ligne 3 : Aperçu des articles */}
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="font-bold flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-zinc-400" />
                      {totalItems} article{totalItems > 1 ? "s" : ""} ({totalQty} unité{totalQty > 1 ? "s" : ""})
                    </span>
                    {t.notes && (
                      <span className="text-[11px] text-zinc-400 italic truncate max-w-[140px]">
                        "{t.notes}"
                      </span>
                    )}
                  </div>

                  {/* Ligne 4 : Boutons d'Action Mobile Ergonomiques */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2">
                    {/* Bouton de validation immédiate */}
                    {isActionable && (
                      <button
                        onClick={() => {
                          setConfirmAction({
                            id: t.id,
                            status: "COMPLETED",
                            title: "Valider la Réception",
                            message: `Confirmer la réception de ce transfert vers « ${getShopName(t.toShop, t.toShopId)} » ? Le stock sera immédiatement réceptionné.`,
                            confirmLabel: "Valider la Réception",
                            variant: "primary"
                          });
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                      >
                        <Check className="h-4 w-4" />
                        <span>Valider Réception</span>
                      </button>
                    )}

                    {/* Bouton Voir Détails */}
                    <button
                      onClick={() => {
                        setSelectedTransfer(t);
                        setIsViewOpen(true);
                      }}
                      className={`${isActionable ? "px-3" : "w-full"} py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer`}
                    >
                      <Eye className="h-4 w-4 text-zinc-500" />
                      <span>{isActionable ? "Détails" : "Voir le détail complet"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── VUE DESKTOP (TABLEAU AVANCÉ AVEC VALIDATION RAPIDE) ── */}
        <div className="hidden md:block">
          <Card className="p-6">
            <DataTable columns={columns} data={filteredTransfers} isLoading={loading} />
          </Card>
        </div>

      </div>

      {/* ── MODAL CRÉATION DE TRANSFERT ── */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Créer un Transfert de Stock" size="lg">
        <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Boutique Source (Départ)</label>
              <select
                value={fromShopId}
                onChange={(e) => setFromShopId(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
              >
                <option value="">Sélectionner source...</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id} disabled={s.id === toShopId}>
                    {s.name} {s.id === toShopId ? "(Destination sélectionnée)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Boutique Destination (Arrivée)</label>
              <select
                value={toShopId}
                onChange={(e) => setToShopId(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
              >
                <option value="">Sélectionner destination...</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id} disabled={s.id === fromShopId}>
                    {s.name} {s.id === fromShopId ? "(Source sélectionnée)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Notes / Motif du transfert</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Réassort hebdomadaire boutique centrale..."
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
            />
          </div>

          {/* Item addition section */}
          {fromShopId && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-2 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black text-foreground uppercase flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-blue-500" />
                  Sélection des Articles à Déplacer
                </h5>
                <span className="text-[10px] font-black text-zinc-400">
                  {sourceProducts.length} référence{sourceProducts.length > 1 ? "s" : ""} disponible{sourceProducts.length > 1 ? "s" : ""}
                </span>
              </div>

              {/* ── BARRE DE SCAN CODE-BARRES / DOUCHETTE / CAMÉRA ── */}
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                <div className="relative flex-1">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleBarcodeScan(barcodeInput);
                      }
                    }}
                    placeholder="Scanner au lecteur (douchette) ou saisir code / SKU + Entrée..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold font-mono outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="text-xs font-black gap-1.5"
                    onClick={() => handleBarcodeScan(barcodeInput)}
                    disabled={!barcodeInput.trim()}
                  >
                    Valider Code
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs font-black gap-1.5"
                    onClick={() => setIsScannerOpen(true)}
                    title="Ouvrir la caméra pour scanner"
                  >
                    <Scan className="h-4 w-4 text-blue-500" />
                    Caméra
                  </Button>
                </div>
              </div>

              {/* ── RECHERCHE MULTI-CRITÈRES (NOM, SKU, CODE-BARRES) & DROPDOWN ── */}
              <div className="flex flex-col gap-2 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    Recherche par Nom, SKU ou Code-barres
                  </label>
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch("")}
                      className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600"
                    >
                      Effacer filtre
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Filtrer la liste (ex: Paracétamol, REF-01, 37000...)"
                    className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-1">
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <select
                      value={tempProductId}
                      onChange={(e) => setTempProductId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500 font-mono"
                    >
                      <option value="">-- Choisir un produit source ({sourceProducts.length}) --</option>
                      {sourceProducts
                        .filter((p) => {
                          if (!productSearch.trim()) return true;
                          const q = productSearch.toLowerCase().trim();
                          return (
                            p.name.toLowerCase().includes(q) ||
                            (p.sku && p.sku.toLowerCase().includes(q)) ||
                            (p.barcode && p.barcode.toLowerCase().includes(q))
                          );
                        })
                        .map((p) => (
                          <option key={p.id} value={p.id} disabled={p.stockQty <= 0}>
                            [{p.sku || "SANS-SKU"}] {p.name} (Code-barres: {p.barcode || "N/A"}) - Stock source: {p.stockQty} {p.stockQty <= 0 ? "· ÉPUISÉ" : ""}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex flex-col gap-1 w-24">
                      <label className="text-[10px] font-bold text-zinc-400">Qté</label>
                      <input
                        type="number"
                        min="1"
                        max={sourceProducts.find((p) => p.id === tempProductId)?.stockQty || undefined}
                        value={tempQty}
                        onChange={(e) => setTempQty(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none text-center font-mono"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-4 h-[38px] font-black shrink-0"
                      onClick={handleAddItem}
                      disabled={!tempProductId || (sourceProducts.find((p) => p.id === tempProductId)?.stockQty ?? 0) <= 0}
                    >
                      + Ajouter
                    </Button>
                  </div>
                </div>

                {/* Carte récapitulative du produit sélectionné */}
                {(() => {
                  const selectedProd = sourceProducts.find((p) => p.id === tempProductId);
                  if (!selectedProd) return null;
                  return (
                    <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-3">
                        <p className="font-black text-foreground truncate">
                          [{selectedProd.sku || "SANS-SKU"}] {selectedProd.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          Code-barres: {selectedProd.barcode || "N/A"}
                          {selectedProd.sellingPrice ? ` · Prix vente: ${selectedProd.sellingPrice} XOF` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] uppercase font-bold text-zinc-400 block">Stock Source</span>
                        <span
                          className={`font-mono font-black text-sm ${
                            selectedProd.stockQty > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                          }`}
                        >
                          {selectedProd.stockQty} unité(s)
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Items Table inside modal */}
              {selectedItems.length > 0 && (
                <div className="mt-2 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs font-bold">
                    <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Désignation</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Code-barres</th>
                        <th className="p-3 text-center">Quantité</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {selectedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                          <td className="p-3 text-foreground font-black">{item.name}</td>
                          <td className="p-3 text-zinc-500 font-mono text-[11px]">{item.sku || "—"}</td>
                          <td className="p-3 text-zinc-500 font-mono text-[11px]">{item.barcode || "—"}</td>
                          <td className="p-3 text-center font-black text-blue-600">{item.quantity}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Retirer cet article"
                            >
                              <Trash2 className="h-4 w-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <Button 
            variant="primary" 
            className="mt-4 w-full py-3.5 font-black text-xs uppercase tracking-wider" 
            onClick={handleCreateTransfer}
            disabled={selectedItems.length === 0}
          >
            Confirmer & Initier le Transfert ({selectedItems.length} article{selectedItems.length > 1 ? "s" : ""})
          </Button>
        </div>
      </Modal>

      {/* ── MODAL DÉTAILS DU TRANSFERT & VALIDATION FLUIDE ── */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Détails du Transfert de Stock" size="lg">
        {selectedTransfer && (
          <div className="flex flex-col gap-4">
            
            {/* Header avec N° et Statut */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Identifiant Transfert</span>
                <span className="font-mono font-black text-sm text-foreground">#{selectedTransfer.id.slice(0, 8).toUpperCase()}</span>
              </div>
              {getStatusBadge(selectedTransfer.status)}
            </div>

            {/* Trajet Source ➜ Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80">
                <span className="text-[10px] text-zinc-400 uppercase block mb-1">Depuis (Boutique Source) :</span>
                <p className="text-sm font-black text-foreground flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-zinc-500" />
                  {getShopName(selectedTransfer.fromShop, selectedTransfer.fromShopId)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60">
                <span className="text-[10px] text-blue-500 uppercase block mb-1">Vers (Boutique Destinataire) :</span>
                <p className="text-sm font-black text-blue-600 dark:text-blue-300 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  {getShopName(selectedTransfer.toShop, selectedTransfer.toShopId)}
                </p>
              </div>
            </div>

            {/* Notes / Motif */}
            {selectedTransfer.notes && (
              <div className="text-xs p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-0.5">Observations :</span>
                <p className="text-foreground font-semibold">{selectedTransfer.notes}</p>
              </div>
            )}

            {/* Liste détaillée des articles */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden mt-1">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs font-black">
                <span className="uppercase text-zinc-500 text-[10px]">Marchandises Transférées</span>
                <span className="text-blue-500">{selectedTransfer.items?.length || 0} référence(s)</span>
              </div>
              
              <table className="w-full text-left text-xs font-bold">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Article</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Code-barres</th>
                    <th className="p-3 text-center">Quantité</th>
                    <th className="p-3 text-right">Coût Est.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {selectedTransfer.items?.map((item, idx) => {
                    const prod = (item.product as any) || productDetails[item.productId];
                    return (
                      <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                        <td className="p-3 text-foreground font-black">
                          {prod?.name || productNames[item.productId] || "Chargement..."}
                        </td>
                        <td className="p-3 text-zinc-500 font-mono text-[11px]">
                          {prod?.sku || "—"}
                        </td>
                        <td className="p-3 text-zinc-500 font-mono text-[11px]">
                          {prod?.barcode || "—"}
                        </td>
                        <td className="p-3 text-center font-black text-blue-600">
                          {item.quantity}
                        </td>
                        <td className="p-3 text-right text-zinc-500 font-bold">
                          {item.unitCost != null ? `${item.unitCost} FCFA` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Boutons d'Action Rapide de Validation */}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              {selectedTransfer.status === "PENDING" && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setConfirmAction({
                        id: selectedTransfer.id,
                        status: "COMPLETED",
                        title: "Valider la Réception",
                        message: `Confirmer la réception définitive des articles vers « ${getShopName(selectedTransfer.toShop, selectedTransfer.toShopId)} » ?`,
                        confirmLabel: "Confirmer la Réception",
                        variant: "primary"
                      });
                    }}
                    className="font-black bg-emerald-600 hover:bg-emerald-500 text-white py-3 shadow-lg shadow-emerald-600/20"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valider la Réception en Destination
                  </Button>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedTransfer.id, "IN_TRANSIT")}
                      className="text-xs font-bold"
                    >
                      <Truck className="h-4 w-4 mr-1.5 text-blue-500" />
                      Marquer en Transit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        setConfirmAction({
                          id: selectedTransfer.id,
                          status: "CANCELLED",
                          title: "Annuler le Transfert",
                          message: "Voulez-vous vraiment annuler ce transfert ? Les articles seront réintégrés au stock de la boutique source.",
                          confirmLabel: "Annuler le Transfert",
                          variant: "danger"
                        });
                      }}
                      className="text-xs font-bold"
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Annuler le Transfert
                    </Button>
                  </div>
                </>
              )}

              {selectedTransfer.status === "IN_TRANSIT" && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setConfirmAction({
                        id: selectedTransfer.id,
                        status: "COMPLETED",
                        title: "Confirmer la Réception",
                        message: `Confirmer la réception de la marchandise arrivée à « ${getShopName(selectedTransfer.toShop, selectedTransfer.toShopId)} » ?`,
                        confirmLabel: "Confirmer la Réception",
                        variant: "primary"
                      });
                    }}
                    className="font-black bg-emerald-600 hover:bg-emerald-500 text-white py-3 shadow-lg shadow-emerald-600/20"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmer la Réception des Marchandises
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => {
                      setConfirmAction({
                        id: selectedTransfer.id,
                        status: "CANCELLED",
                        title: "Annuler le Transfert",
                        message: "Annuler ce transfert en transit ? Les quantités seront restituées à la boutique de départ.",
                        confirmLabel: "Confirmer l'annulation",
                        variant: "danger"
                      });
                    }}
                    className="text-xs font-bold mt-1"
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Annuler le Transfert
                  </Button>
                </>
              )}
            </div>

          </div>
        )}
      </Modal>

      {/* ── CONFIRMATION MODAL POUR ÉVITER LES ERREURS SUR MOBILE ET DESKTOP ── */}
      {confirmAction && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => handleUpdateStatus(confirmAction.id, confirmAction.status)}
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          variant={confirmAction.variant}
        />
      )}

      {/* ── SCANNER MODAL (CAMÉRA) ── */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScan}
        title="Scanner un Produit pour Transfert"
        subtitle="Scannez le code-barres de l'article à transférer depuis la boutique source"
      />

    </AppLayout>
  );
}
