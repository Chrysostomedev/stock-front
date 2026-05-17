/**
 * ============================================================================
 * PAGE : PERTES & PÉRIMÉS SUPERETTE
 * ============================================================================
 * 
 * Affiche les lots de produits arrivant à expiration, permettant au
 * manager de prendre des mesures (retrait, promotion, destruction).
 * 
 * Connecté au backend via :
 *   - ProductBatchService.getExpiring(shopId, days) → Lots expirant bientôt
 *   - ProductBatchService.update(id, dto) → Mettre à jour la quantité (perte)
 * 
 * Le backend filtre automatiquement les lots dont la date d'expiration
 * est comprise dans les N prochains jours.
 * 
 * @see back-spservice/src/modules/product-batch
 * ============================================================================
 */
"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import ProductBatchService from "@/services/super/productBatch.service";
import { ProductBatch } from "@/types/super";
import {
  AlertCircle,
  Search,
  Calendar,
  Package,
  TrendingDown,
  RefreshCw,
  Clock,
} from "lucide-react";

export default function SuperPerimesPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  // === État du composant ===
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [daysFilter, setDaysFilter] = useState(30); // Nombre de jours avant expiration

  /**
   * Charge les lots expirant dans les N prochains jours.
   * 
   * Le backend filtre côté serveur :
   *   GET /product-batches/expiring/:shopId?days=30
   * 
   * Retourne uniquement les lots avec une date d'expiration définie
   * et qui expire dans la fenêtre de temps demandée.
   */
  const loadExpiring = async () => {
    if (!user?.shopId) return;
    setLoading(true);
    try {
      const data = await ProductBatchService.getExpiring(user.shopId, daysFilter);
      // Extraction robuste — le backend peut renvoyer un tableau ou un objet
      const list = Array.isArray(data) ? data : (data as any)?.data || [];
      setBatches(list);
    } catch (error) {
      showToast("Erreur lors du chargement des lots expirables", "error");
    } finally {
      setLoading(false);
    }
  };

  // Recharger quand l'utilisateur ou le filtre de jours change
  useEffect(() => {
    loadExpiring();
  }, [user, daysFilter]);

  // === Filtrage côté client (recherche textuelle) ===
  const filteredBatches = batches.filter((b) => {
    const productName = b.product?.name || "";
    const batchNum = b.batchNumber || "";
    return (
      productName.toLowerCase().includes(search.toLowerCase()) ||
      batchNum.toLowerCase().includes(search.toLowerCase())
    );
  });

  // === KPIs calculés ===
  const totalLots = batches.length;
  const totalQuantity = batches.reduce((acc, b) => acc + b.quantity, 0);
  const totalValue = batches.reduce(
    (acc, b) => acc + b.quantity * b.buyingPrice,
    0
  );
  // Lots déjà expirés (date passée)
  const expiredCount = batches.filter(
    (b) => b.expiresAt && new Date(b.expiresAt) < new Date()
  ).length;

  /**
   * Calcule le nombre de jours restants avant expiration.
   * Retourne un nombre négatif si le lot est déjà expiré.
   */
  const getDaysUntilExpiry = (expiresAt?: string): number | null => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  // === Colonnes du tableau ===
  const columns: {
    header: string;
    accessor: (item: ProductBatch) => React.ReactNode;
    className?: string;
  }[] = [
    {
      header: "Produit / Lot",
      accessor: (b: ProductBatch) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">
            {b.product?.name || "Produit inconnu"}
          </span>
          <span className="text-[10px] text-zinc-400 font-bold">
            Lot: {b.batchNumber}
          </span>
        </div>
      ),
    },
    {
      header: "Date Expiration",
      accessor: (b: ProductBatch) => {
        const days = getDaysUntilExpiry(b.expiresAt);
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-zinc-400" />
              <span className="text-xs font-bold text-zinc-500">
                {b.expiresAt
                  ? new Date(b.expiresAt).toLocaleDateString("fr-FR")
                  : "N/A"}
              </span>
            </div>
            {days !== null && (
              <span
                className={`text-[10px] font-black ${
                  days < 0
                    ? "text-red-600"
                    : days <= 7
                    ? "text-amber-600"
                    : "text-zinc-400"
                }`}
              >
                {days < 0
                  ? `Expiré depuis ${Math.abs(days)}j`
                  : `${days}j restants`}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Quantité",
      accessor: (b: ProductBatch) => (
        <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">
          {b.quantity}
        </span>
      ),
    },
    {
      header: "Valeur Perte",
      accessor: (b: ProductBatch) => (
        <span className="text-sm font-black text-red-600">
          {new Intl.NumberFormat("fr-FR").format(b.quantity * b.buyingPrice)} XOF
        </span>
      ),
    },
    {
      header: "Statut",
      accessor: (b: ProductBatch) => {
        const days = getDaysUntilExpiry(b.expiresAt);
        if (days === null) return <Badge variant="outline">N/A</Badge>;
        if (days < 0) return <Badge variant="danger">EXPIRÉ</Badge>;
        if (days <= 7) return <Badge variant="outline" className="text-amber-600 border-amber-300">URGENT</Badge>;
        return <Badge variant="outline" className="text-zinc-500">À SURVEILLER</Badge>;
      },
    },
  ];

  return (
    <AppLayout
      title="Pertes & Périmés"
      subtitle="Lots de produits arrivant à expiration — données en temps réel"
      rightElement={
        <button
          onClick={loadExpiring}
          className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
        {/* === KPIs dynamiques === */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Lots concernés */}
          <div className="p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Lots à surveiller
              </p>
            </div>
            <h4 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {totalLots}
            </h4>
          </div>

          {/* Déjà expirés */}
          <div className="p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 text-red-600 rounded-xl">
                <AlertCircle className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Déjà expirés
              </p>
            </div>
            <h4 className="text-2xl font-black text-red-600">{expiredCount}</h4>
          </div>

          {/* Quantité totale */}
          <div className="p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <Package className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Unités à retirer
              </p>
            </div>
            <h4 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {totalQuantity}
            </h4>
          </div>

          {/* Valeur perte */}
          <div className="p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 text-red-600 rounded-xl">
                <TrendingDown className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Valeur perte
              </p>
            </div>
            <h4 className="text-lg font-black text-red-600">
              {new Intl.NumberFormat("fr-FR").format(totalValue)} XOF
            </h4>
          </div>
        </div>

        {/* === Tableau des lots === */}
        <Card className="p-0 overflow-hidden shadow-xl border-none">
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800">
            {/* Barre de recherche */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher par produit ou numéro de lot..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Sélecteur de fenêtre temporelle */}
            <div className="flex items-center gap-2">
              {[7, 14, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDaysFilter(d)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    daysFilter === d
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {d}j
                </button>
              ))}
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredBatches}
            isLoading={loading}
          />
        </Card>
      </div>
    </AppLayout>
  );
}
