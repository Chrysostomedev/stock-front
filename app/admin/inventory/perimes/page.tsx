"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { useDashboardShop } from "@/contexts/DashboardShopContext";
import InventoryService, {
  ExpiryAlertsResponse,
  ExpiredProductItem,
  ExpiringSoonProductItem,
  LossReason,
} from "@/services/inventory.service";
import ReportsService, { LossesReportResponse } from "@/services/reports.service";
import { downloadReport } from "@/services/export.service";
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  Trash2,
  FileDown,
  RefreshCw,
  Search,
  BarChart3,
  ClipboardCheck,
  TrendingDown,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Info,
  PackageX,
  PieChart,
} from "lucide-react";

export default function InventoryPerimesPage() {
  const { showToast } = useToast();
  const { shopId, shopName } = useDashboardShop();

  // Navigation interne
  const [activeTab, setActiveTab] = useState<"alerts" | "losses">("alerts");

  // Données Alertes Péremption
  const [alertsData, setAlertsData] = useState<ExpiryAlertsResponse | null>(null);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [thresholdDays, setThresholdDays] = useState(30);
  const [alertSearch, setAlertSearch] = useState("");

  // Modale de Déclassement / Mise au rebut
  const [selectedProductForWriteOff, setSelectedProductForWriteOff] = useState<{
    id: string;
    name: string;
    stockQty: number;
    buyingPrice: number;
    barcode?: string;
  } | null>(null);
  const [writeOffQty, setWriteOffQty] = useState(1);
  const [writeOffReason, setWriteOffReason] = useState<LossReason>("EXPIRED");
  const [writeOffNotes, setWriteOffNotes] = useState("");
  const [isWriteOffSubmitting, setIsWriteOffSubmitting] = useState(false);

  // Données Rapport des Pertes (Phase 7.C)
  const [lossesData, setLossesData] = useState<LossesReportResponse | null>(null);
  const [loadingLosses, setLoadingLosses] = useState(false);
  const [lossesFromDate, setLossesFromDate] = useState("");
  const [lossesToDate, setLossesToDate] = useState("");
  const [isExporting, setIsExporting] = useState<"pdf" | "xlsx" | null>(null);

  useEffect(() => {
    const d = new Date();
    d.setDate(1);
    setLossesFromDate(d.toISOString().split("T")[0]);
    setLossesToDate(new Date().toISOString().split("T")[0]);
  }, []);

  // ── Chargement des alertes de péremption ──
  const loadAlerts = useCallback(async () => {
    if (!shopId) return;
    setLoadingAlerts(true);
    try {
      const data = await InventoryService.getExpiryAlerts(shopId, thresholdDays);
      setAlertsData(data);
    } catch {
      showToast("Erreur lors de la récupération des alertes de péremption", "error");
    } finally {
      setLoadingAlerts(false);
    }
  }, [shopId, thresholdDays, showToast]);

  // ── Chargement du rapport des pertes ──
  const loadLosses = useCallback(async () => {
    if (!shopId) return;
    setLoadingLosses(true);
    try {
      const data = await ReportsService.getLosses({
        shopId,
        fromDate: lossesFromDate ? new Date(lossesFromDate).toISOString() : undefined,
        toDate: lossesToDate ? new Date(`${lossesToDate}T23:59:59.999Z`).toISOString() : undefined,
      });
      setLossesData(data);
    } catch {
      showToast("Erreur lors du chargement du rapport des pertes", "error");
    } finally {
      setLoadingLosses(false);
    }
  }, [shopId, lossesFromDate, lossesToDate, showToast]);

  useEffect(() => {
    if (activeTab === "alerts") {
      loadAlerts();
    } else {
      loadLosses();
    }
  }, [activeTab, loadAlerts, loadLosses]);

  // ── Action Déclassement / Mise au rebut ──
  const handleOpenWriteOff = (prod: {
    id: string;
    name: string;
    stockQty: number;
    buyingPrice: number;
    barcode?: string;
  }) => {
    setSelectedProductForWriteOff(prod);
    setWriteOffQty(Math.min(prod.stockQty || 1, 1));
    setWriteOffReason("EXPIRED");
    setWriteOffNotes("");
  };

  const handleExecuteWriteOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForWriteOff || !shopId) return;

    if (writeOffQty <= 0 || writeOffQty > selectedProductForWriteOff.stockQty) {
      showToast(`Quantité invalide (Max disponible: ${selectedProductForWriteOff.stockQty})`, "error");
      return;
    }

    setIsWriteOffSubmitting(true);
    try {
      await InventoryService.writeOff({
        shopId,
        lossReason: writeOffReason,
        notes: writeOffNotes.trim() || undefined,
        items: [
          {
            productId: selectedProductForWriteOff.id,
            quantity: writeOffQty,
            notes: writeOffNotes.trim() || undefined,
          },
        ],
      });

      showToast(
        `${writeOffQty} unité(s) de "${selectedProductForWriteOff.name}" déclassée(s) et retirée(s) du stock`,
        "success"
      );
      setSelectedProductForWriteOff(null);
      loadAlerts();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Erreur lors du déclassement", "error");
    } finally {
      setIsWriteOffSubmitting(false);
    }
  };

  // ── Exports PDF & Excel ──
  const handleExportLosses = async (format: "pdf" | "xlsx") => {
    if (!shopId) return;
    setIsExporting(format);
    try {
      await downloadReport(
        "/reports/losses/export",
        {
          shopId,
          format,
          fromDate: lossesFromDate ? new Date(lossesFromDate).toISOString() : undefined,
          toDate: lossesToDate ? new Date(`${lossesToDate}T23:59:59.999Z`).toISOString() : undefined,
        },
        `rapport-pertes-${shopId}.${format}`
      );
      showToast(`Export ${format.toUpperCase()} téléchargé avec succès`, "success");
    } catch {
      showToast(`Échec du téléchargement du fichier ${format.toUpperCase()}`, "error");
    } finally {
      setIsExporting(null);
    }
  };

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: alertsData?.currency || "XOF",
      maximumFractionDigits: 0,
    }).format(n);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("fr-FR");
    } catch {
      return d;
    }
  };

  // Filtrage local des alertes
  const filteredExpired = (alertsData?.expiredProducts || []).filter((p) => {
    const term = alertSearch.toLowerCase();
    return (
      !term ||
      p.productName.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.includes(term)) ||
      (p.sku && p.sku.toLowerCase().includes(term))
    );
  });

  const filteredExpiringSoon = (alertsData?.expiringSoonProducts || []).filter((p) => {
    const term = alertSearch.toLowerCase();
    return (
      !term ||
      p.productName.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.includes(term)) ||
      (p.sku && p.sku.toLowerCase().includes(term))
    );
  });

  return (
    <AppLayout
      title="Alertes Péremptions, Déclassement & Pertes"
      subtitle="Supervision des dates limites (DLC), retraits de stock et analyse comptable des pertes"
    >
      <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-28 md:pb-12">
        {/* ── Navigation Secondaire Inventaire ── */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 flex-wrap">
          <Link
            href="/admin/inventory"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <BarChart3 className="h-4 w-4" />
            Tableau de Bord & Valorisation
          </Link>
          <Link
            href="/admin/inventory/physique"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <ClipboardCheck className="h-4 w-4" />
            Inventaire Physique (Comptage & Régularisation)
          </Link>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black bg-primary text-white shadow-sm shadow-primary/20">
            <AlertCircle className="h-4 w-4" />
            Alertes DLC & Rapport des Pertes
          </div>
        </div>

        {/* ── Switcher d'onglet : Alertes DLC vs Rapport des Pertes ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("alerts")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "alerts"
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Tableau de Bord des DLC</span>
              {alertsData?.summary && alertsData.summary.expiredCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
                  {alertsData.summary.expiredCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("losses")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "losses"
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <TrendingDown className="h-4 w-4" />
              <span>Rapport Financier des Pertes</span>
            </button>
          </div>

          <div className="flex items-center gap-2 px-2">
            <span className="text-xs text-muted-foreground font-bold">Boutique :</span>
            <span className="text-xs font-black text-foreground">{shopName}</span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            VUE 1 : TABLEAU DE BORD DES DATES LIMITES (DLC & ALERTES)
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "alerts" && (
          <div className="flex flex-col gap-6">
            {/* KPI Cards DLC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4.5 rounded-2xl border-rose-200 dark:border-rose-950/50 bg-rose-50/25 dark:bg-rose-950/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-rose-600">
                    Produits Déjà Périmés
                  </span>
                  <div className="h-8 w-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
                    <PackageX className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className="text-2xl font-black text-rose-600">
                    {alertsData?.summary.expiredCount ?? 0}{" "}
                    <span className="text-sm font-bold">références</span>
                  </span>
                  <p className="text-[11px] font-bold text-rose-500 mt-0.5">
                    {alertsData?.summary.expiredTotalUnits ?? 0} unités en rayon
                  </p>
                </div>
              </Card>

              <Card className="p-4.5 rounded-2xl border-rose-200 dark:border-rose-950/50 bg-rose-50/25 dark:bg-rose-950/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-rose-600">
                    Pertes Financières Dépassées
                  </span>
                  <div className="h-8 w-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className="text-2xl font-black text-rose-600">
                    {fmtCurrency(alertsData?.summary.expiredTotalLoss ?? 0)}
                  </span>
                  <p className="text-[11px] font-bold text-rose-500 mt-0.5">
                    Valeur d&apos;achat nette à déclasser
                  </p>
                </div>
              </Card>

              <Card className="p-4.5 rounded-2xl border-amber-200 dark:border-amber-950/50 bg-amber-50/25 dark:bg-amber-950/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-600">
                    Expirant sous {thresholdDays} jours
                  </span>
                  <div className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className="text-2xl font-black text-amber-600">
                    {alertsData?.summary.expiringSoonCount ?? 0}{" "}
                    <span className="text-sm font-bold">références</span>
                  </span>
                  <p className="text-[11px] font-bold text-amber-500 mt-0.5">
                    {alertsData?.summary.expiringSoonTotalUnits ?? 0} unités à surveiller
                  </p>
                </div>
              </Card>

              <Card className="p-4.5 rounded-2xl border-amber-200 dark:border-amber-950/50 bg-amber-50/25 dark:bg-amber-950/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-600">
                    Valeur en Risque (DLC proche)
                  </span>
                  <div className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className="text-2xl font-black text-amber-600">
                    {fmtCurrency(alertsData?.summary.expiringSoonTotalValue ?? 0)}
                  </span>
                  <p className="text-[11px] font-bold text-amber-500 mt-0.5">
                    Articles vendables avec promotion
                  </p>
                </div>
              </Card>
            </div>

            {/* Barre de Filtres et Seuil */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Recherche par produit ou code-barres..."
                  value={alertSearch}
                  onChange={(e) => setAlertSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                    Seuil d&apos;alerte :
                  </span>
                  <select
                    value={thresholdDays}
                    onChange={(e) => setThresholdDays(Number(e.target.value))}
                    className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-primary transition-all"
                  >
                    <option value={7}>7 jours</option>
                    <option value={15}>15 jours</option>
                    <option value={30}>30 jours</option>
                    <option value={60}>60 jours</option>
                    <option value={90}>90 jours</option>
                  </select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAlerts}
                  disabled={loadingAlerts}
                  className="rounded-xl h-9"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loadingAlerts ? "animate-spin" : ""}`} />
                  Actualiser
                </Button>
              </div>
            </div>

            {/* 🔴 Section 1 : Produits Déjà Périmés */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500 animate-pulse" />
                  <h3 className="text-sm font-black text-foreground">
                    Produits Déjà Périmés en Rayon ({filteredExpired.length})
                  </h3>
                </div>
                <span className="text-xs text-rose-500 font-bold">
                  Action recommandée : Déclassement immédiat
                </span>
              </div>

              <Card className="overflow-hidden border-none shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider">
                        <th className="py-3 px-4">Produit</th>
                        <th className="py-3 px-4">Catégorie</th>
                        <th className="py-3 px-4 text-center">Stock Rayon</th>
                        <th className="py-3 px-4 text-center">DLC Dépassée</th>
                        <th className="py-3 px-4 text-right">Perte Financière</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                      {loadingAlerts ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground font-bold">
                            Vérification des dates limites...
                          </td>
                        </tr>
                      ) : filteredExpired.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-emerald-600 font-bold">
                            ✨ Aucun produit périmé détecté dans ce magasin !
                          </td>
                        </tr>
                      ) : (
                        filteredExpired.map((item) => (
                          <tr key={item.productId} className="hover:bg-rose-50/20 dark:hover:bg-rose-950/10">
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-black text-foreground">{item.productName}</span>
                                <span className="text-[10px] text-zinc-400 font-bold">
                                  {item.barcode || item.sku || "Sans code"}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground font-bold">
                              {item.categoryName || "Général"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-black text-rose-600 px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/40">
                                {item.stockQty}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-black text-rose-600">
                                  Dépassée de {item.daysExpired} jour{item.daysExpired > 1 ? "s" : ""}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  ({formatDate(item.expiryDate)})
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-black text-rose-600">
                              {fmtCurrency(item.totalLossValue)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleOpenWriteOff({
                                    id: item.productId,
                                    name: item.productName,
                                    stockQty: item.stockQty,
                                    buyingPrice: item.buyingPrice,
                                    barcode: item.barcode,
                                  })
                                }
                                className="h-8 px-3 rounded-xl border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-bold"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                Mettre au Rebut
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* 🟡 Section 2 : Produits Expirant Bientôt */}
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <h3 className="text-sm font-black text-foreground">
                    Produits Expirant sous {thresholdDays} jours ({filteredExpiringSoon.length})
                  </h3>
                </div>
                <span className="text-xs text-amber-500 font-bold">
                  Opportunité : Réduction ou déstockage rapide
                </span>
              </div>

              <Card className="overflow-hidden border-none shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                        <th className="py-3 px-4">Produit</th>
                        <th className="py-3 px-4">Catégorie</th>
                        <th className="py-3 px-4 text-center">Stock</th>
                        <th className="py-3 px-4 text-center">Jours Restants</th>
                        <th className="py-3 px-4 text-right">Valeur en Risque</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                      {loadingAlerts ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground font-bold">
                            Analyse en cours...
                          </td>
                        </tr>
                      ) : filteredExpiringSoon.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground font-bold">
                            Aucun produit n&apos;arrive à expiration dans les {thresholdDays} prochains jours
                          </td>
                        </tr>
                      ) : (
                        filteredExpiringSoon.map((item) => (
                          <tr key={item.productId} className="hover:bg-amber-50/20 dark:hover:bg-amber-950/10">
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-black text-foreground">{item.productName}</span>
                                <span className="text-[10px] text-zinc-400 font-bold">
                                  {item.barcode || item.sku || "Sans code"}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground font-bold">
                              {item.categoryName || "Général"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-black text-amber-600 px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/40">
                                {item.stockQty}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-black text-amber-600">
                                  {item.daysRemaining} jour{item.daysRemaining > 1 ? "s" : ""}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  ({formatDate(item.expiryDate)})
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-black text-amber-600">
                              {fmtCurrency(item.atRiskValue)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleOpenWriteOff({
                                    id: item.productId,
                                    name: item.productName,
                                    stockQty: item.stockQty,
                                    buyingPrice: item.buyingPrice,
                                    barcode: item.barcode,
                                  })
                                }
                                className="h-8 px-3 rounded-xl border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold"
                              >
                                Déclasser
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            VUE 2 : RAPPORT DES PERTES FINANCIÈRES (PHASE 7.C)
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "losses" && (
          <div className="flex flex-col gap-6">
            {/* Contrôles de dates et Exports */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Du :</span>
                  <input
                    type="date"
                    value={lossesFromDate}
                    onChange={(e) => setLossesFromDate(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Au :</span>
                  <input
                    type="date"
                    value={lossesToDate}
                    onChange={(e) => setLossesToDate(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none cursor-pointer"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadLosses}
                  disabled={loadingLosses}
                  className="rounded-xl h-9"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loadingLosses ? "animate-spin" : ""}`} />
                  Filtrer
                </Button>
              </div>

              {/* Boutons d'Exportation PDF et Excel */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportLosses("pdf")}
                  disabled={isExporting !== null}
                  className="rounded-xl h-9 text-rose-600 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold"
                >
                  <FileDown className={`h-3.5 w-3.5 mr-1.5 ${isExporting === "pdf" ? "animate-spin" : ""}`} />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportLosses("xlsx")}
                  disabled={isExporting !== null}
                  className="rounded-xl h-9 text-emerald-600 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold"
                >
                  <FileSpreadsheet className={`h-3.5 w-3.5 mr-1.5 ${isExporting === "xlsx" ? "animate-spin" : ""}`} />
                  Export Excel
                </Button>
              </div>
            </div>

            {/* Bilan Financier des Pertes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4.5 rounded-2xl border-rose-200 dark:border-rose-950/60 bg-rose-50/20 dark:bg-rose-950/10">
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-600">
                  Total des Pertes Financières
                </span>
                <p className="text-2xl font-black text-rose-600 mt-2">
                  {fmtCurrency(lossesData?.totalLossValue ?? 0)}
                </p>
                <p className="text-[11px] font-bold text-rose-500 mt-0.5">
                  Coût net d&apos;achat supporté sur la période
                </p>
              </Card>

              <Card className="p-4.5 rounded-2xl border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  Unités Physiques Perdues
                </span>
                <p className="text-2xl font-black text-foreground mt-2">
                  {lossesData?.totalLossQuantity ?? 0} <span className="text-sm font-bold">articles</span>
                </p>
                <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
                  Tous motifs de perte confondus
                </p>
              </Card>

              <Card className="p-4.5 rounded-2xl border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  Incidents Journalisés
                </span>
                <p className="text-2xl font-black text-foreground mt-2">
                  {lossesData?.incidentsCount ?? (lossesData?.items?.length || 0)}
                </p>
                <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
                  Déclarations de mise au rebut
                </p>
              </Card>
            </div>

            {/* Tableau Détaillé des Pertes */}
            <Card className="overflow-hidden border-none shadow-md">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Journal Chronologique des Pertes & Rebuts
                </h4>
                <span className="text-xs font-bold text-muted-foreground">
                  {lossesData?.items?.length || 0} enregistrements
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-100/50 dark:bg-zinc-800/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Produit</th>
                      <th className="py-3 px-4 text-center">Quantité</th>
                      <th className="py-3 px-4 text-center">Motif de Perte</th>
                      <th className="py-3 px-4 text-right">Perte Montant</th>
                      <th className="py-3 px-4">Remarques</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                    {loadingLosses ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground font-bold">
                          Chargement du rapport des pertes...
                        </td>
                      </tr>
                    ) : !lossesData?.items || lossesData.items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground font-bold">
                          Aucune perte enregistrée sur cette période
                        </td>
                      </tr>
                    ) : (
                      lossesData.items.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="py-3 px-4 text-zinc-500 font-bold whitespace-nowrap">
                            {formatDate(item.createdAt || item.date)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-black text-foreground">
                              {item.productName || item.product?.name || "Article"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-black text-rose-600">
                            -{item.quantity}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge
                              variant={
                                item.reason === "EXPIRED"
                                  ? "danger"
                                  : item.reason === "THEFT"
                                  ? "outline"
                                  : "warning"
                              }
                              className="font-black text-[10px]"
                            >
                              {item.reason}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-rose-600">
                            -{fmtCurrency(item.totalLoss || item.quantity * (item.unitCost || 0))}
                          </td>
                          <td className="py-3 px-4 text-zinc-500 italic">
                            {item.notes || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── Modale de Déclassement / Mise au Rebut ── */}
        <Modal
          isOpen={selectedProductForWriteOff !== null}
          onClose={() => setSelectedProductForWriteOff(null)}
          title="Déclaration de Déclassement / Mise au Rebut"
        >
          {selectedProductForWriteOff && (
            <form onSubmit={handleExecuteWriteOff} className="flex flex-col gap-4 p-2">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-3">
                <PackageX className="h-6 w-6 text-rose-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-foreground">
                    {selectedProductForWriteOff.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground font-bold">
                    Stock actuel : {selectedProductForWriteOff.stockQty} • Coût d&apos;achat :{" "}
                    {fmtCurrency(selectedProductForWriteOff.buyingPrice)}
                  </p>
                </div>
              </div>

              {/* Quantité à retirer */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  Quantité à déclasser <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={selectedProductForWriteOff.stockQty}
                    value={writeOffQty}
                    onChange={(e) => setWriteOffQty(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-black outline-none focus:border-primary"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setWriteOffQty(selectedProductForWriteOff.stockQty)}
                    className="whitespace-nowrap rounded-xl text-[10px] font-bold"
                  >
                    Tout ({selectedProductForWriteOff.stockQty})
                  </Button>
                </div>
                <span className="text-[10px] text-zinc-400 font-bold">
                  Perte estimée : {fmtCurrency(writeOffQty * selectedProductForWriteOff.buyingPrice)}
                </span>
              </div>

              {/* Motif de perte */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  Motif de la perte / du déclassement <span className="text-red-500">*</span>
                </label>
                <select
                  value={writeOffReason}
                  onChange={(e) => setWriteOffReason(e.target.value as LossReason)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-primary"
                >
                  <option value="EXPIRED">Périmé (DLC Dépassée)</option>
                  <option value="DAMAGED">Endommagé / Abîmé</option>
                  <option value="SPOILED">Avarié / Gâté</option>
                  <option value="BROKEN">Casse accidentelle</option>
                  <option value="THEFT">Vol / Disparition</option>
                  <option value="OTHER">Autre motif</option>
                </select>
              </div>

              {/* Notes / Remarques */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  Notes / Précisions
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: DLC dépassée de 5 jours, retrait du rayon..."
                  value={writeOffNotes}
                  onChange={(e) => setWriteOffNotes(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProductForWriteOff(null)}
                  disabled={isWriteOffSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={isWriteOffSubmitting}
                  className="font-black px-4 shadow-lg shadow-rose-500/20"
                >
                  {isWriteOffSubmitting ? "Traitement..." : "Confirmer le Rebut"}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
}
