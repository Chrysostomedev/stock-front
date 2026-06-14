"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Clock, RefreshCw, Package } from "lucide-react";
import ProductBatchService from "@/services/super/productBatch.service";
import ProductService from "@/services/product.service";
import { ProductBatch } from "@/types/super";
import { Shop } from "@/types/admin";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface ExpirationWidgetProps {
  shops: Shop[];
}
export default function ExpirationWidget({ shops }: ExpirationWidgetProps) {
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (shops.length > 0 && !selectedShopId) {
      setSelectedShopId(shops[0].id);
    }
  }, [shops, selectedShopId]);

  useEffect(() => {
    if (!selectedShopId) return;
    const load = async () => {
      setLoading(true);
      try {
        // Chargement des lots ET des produits de la boutique en parallèle
        const [batchData, productData] = await Promise.all([
          ProductBatchService.getExpiring(selectedShopId, days),
          ProductService.getAll({ shopId: selectedShopId, limit: 500 }),
        ]);

        const batchList = Array.isArray(batchData) ? batchData : [];
        setBatches(batchList);

        // Construire un dictionnaire productId → nom
        const rawProducts = Array.isArray(productData)
          ? productData
          : productData?.data ?? [];
        const nameMap: Record<string, string> = {};
        for (const p of rawProducts) {
          nameMap[p.id] = p.name;
        }
        setProductNames(nameMap);
      } catch {
        setBatches([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedShopId, days]);

  const expired = batches.filter((b) => b.isExpired);
  const expiringSoon = batches.filter((b) => b.isExpiringSoon && !b.isExpired);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return format(parseISO(dateStr), "dd MMM yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };
  return (
    <div className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-500/10">
            <Clock className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <p className="text-xs font-black text-foreground">Alertes Péremption</p>
            <p className="text-[10px] font-bold text-zinc-400">
              {expired.length} expiré{expired.length !== 1 ? "s" : ""} · {expiringSoon.length} bientôt
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Days selector */}
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] font-black outline-none"
          >
            <option value={7}>7 jours</option>
            <option value={15}>15 jours</option>
            <option value={30}>30 jours</option>
            <option value={60}>60 jours</option>
            <option value={90}>90 jours</option>
          </select>

          {/* Shop selector */}
          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] font-black outline-none max-w-[140px]"
          >
            {shops.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {loading && <RefreshCw className="h-3.5 w-3.5 text-zinc-400 animate-spin" />}
        </div>
      </div>

      {/* Content */}
      {loading && batches.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-zinc-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
      ) : batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-zinc-400">
          <Package className="h-8 w-8 opacity-30" />
          <p className="text-[10px] font-bold">Aucun lot expirant dans {days} jours</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
          {/* Expired first */}
          {expired.map((batch) => (
            <div
              key={batch.id}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-red-700 dark:text-red-400 truncate">
                    {batch.product?.name ?? productNames[batch.productId] ?? batch.productId}
                  </p>
                  <p className="text-[10px] font-bold text-red-500">
                    Lot #{batch.batchNumber} · {batch.quantity} unité{batch.quantity !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-wider">Expiré</p>
                <p className="text-[10px] font-bold text-red-400">{formatDate(batch.expiresAt)}</p>
              </div>
            </div>
          ))}

          {/* Expiring soon */}
          {expiringSoon.map((batch) => (
            <div
              key={batch.id}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-orange-700 dark:text-orange-400 truncate">
                    {batch.product?.name ?? productNames[batch.productId] ?? batch.productId}
                  </p>
                  <p className="text-[10px] font-bold text-orange-500">
                    Lot #{batch.batchNumber} · {batch.quantity} unité{batch.quantity !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-wider">Bientôt</p>
                <p className="text-[10px] font-bold text-orange-400">{formatDate(batch.expiresAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary badges */}
      {batches.length > 0 && (
        <div className="flex items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-black">
            <AlertTriangle className="h-3 w-3" />
            {expired.length} expiré{expired.length !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-lg text-[10px] font-black">
            <Clock className="h-3 w-3" />
            {expiringSoon.length} bientôt expiré{expiringSoon.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
