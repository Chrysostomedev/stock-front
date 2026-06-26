"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import { useToast } from "@/contexts/ToastContext";
import { useDashboardShop } from "@/contexts/DashboardShopContext";
import InventoryDashboardService, {
  InventoryAlertsResponse,
} from "@/services/inventoryDashboard.service";
import { AlertTriangle, Package, RefreshCw, XCircle, Clock } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

export default function StockAlertsPage() {
  const { shopId } = useDashboardShop();
  const { showToast } = useToast();
  const [data, setData] = useState<InventoryAlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"outOfStock" | "lowStock" | "dormant">("outOfStock");

  const load = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      setData(await InventoryDashboardService.getAlerts(shopId));
    } catch {
      showToast("Impossible de charger les alertes stock", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [shopId]);

  const tabs = [
    { key: "outOfStock" as const, label: "Ruptures", count: data?.summary.outOfStockCount ?? 0, icon: <XCircle className="h-3.5 w-3.5" />, color: "text-red-500 border-red-500" },
    { key: "lowStock" as const, label: "Stock Bas", count: data?.summary.lowStockCount ?? 0, icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-amber-500 border-amber-500" },
    { key: "dormant" as const, label: "Dormants", count: data?.summary.dormantCount ?? 0, icon: <Clock className="h-3.5 w-3.5" />, color: "text-zinc-500 border-zinc-500" },
  ];

  return (
    <AppLayout
      title="Alertes Stock"
      subtitle={data ? `${data.summary.totalAlerts} alerte${data.summary.totalAlerts > 1 ? "s" : ""} au total` : "Chargement…"}
      backUrl="/dashboard"
      rightElement={
        <button onClick={load} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:text-primary transition-all">
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="flex flex-col gap-5 max-w-4xl mx-auto pb-12 px-2 sm:px-0">

        {/* ── Résumé ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-2xl">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-2xl font-black text-red-600">{loading ? "—" : (data?.summary.outOfStockCount ?? 0)}</span>
            <span className="text-[10px] font-black text-red-500 uppercase tracking-wider text-center">Ruptures</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span className="text-2xl font-black text-amber-600">{loading ? "—" : (data?.summary.lowStockCount ?? 0)}</span>
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider text-center">Stock Bas</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-4 bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-200 dark:border-zinc-700 rounded-2xl">
            <Clock className="h-5 w-5 text-zinc-500" />
            <span className="text-2xl font-black text-zinc-600 dark:text-zinc-400">{loading ? "—" : (data?.summary.dormantCount ?? 0)}</span>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider text-center">Dormants</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-black transition-all ${tab === t.key ? "bg-white dark:bg-zinc-900 shadow-sm " + t.color : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
            >
              {t.icon}
              <span>{t.label}</span>
              {!loading && t.count > 0 && (
                <span className={`inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[9px] font-black ${tab === t.key ? "bg-current/10" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Table ruptures / stock bas ── */}
        {(tab === "outOfStock" || tab === "lowStock") && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-12 text-center text-zinc-400 text-xs font-bold">Chargement…</div>
            ) : (tab === "outOfStock" ? (data?.outOfStock ?? []) : (data?.lowStock ?? [])).length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <Package className="h-8 w-8 text-zinc-200 dark:text-zinc-700" />
                <p className="text-sm font-black text-zinc-400">Aucun produit dans cette catégorie</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[9px] text-zinc-400 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left font-black">Produit</th>
                      <th className="px-3 py-3 text-left font-black">Catégorie</th>
                      <th className="px-3 py-3 text-center font-black">Stock</th>
                      <th className="px-3 py-3 text-center font-black">Minimum</th>
                      <th className="px-3 py-3 text-right font-black">Valeur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {(tab === "outOfStock" ? data!.outOfStock : data!.lowStock).map((p) => (
                      <tr key={p.productId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-black text-zinc-800 dark:text-zinc-100">{p.productName}</p>
                          {p.sku && <p className="text-[10px] font-bold text-zinc-400 mt-0.5">SKU: {p.sku}</p>}
                        </td>
                        <td className="px-3 py-3 text-zinc-500 font-bold">{p.categoryName ?? "—"}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-[11px] font-black ${p.stockQty <= 0 ? "bg-red-50 dark:bg-red-950/20 text-red-600" : "bg-amber-50 dark:bg-amber-950/20 text-amber-600"}`}>
                            {p.stockQty}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-zinc-400">{p.minStockQty}</td>
                        <td className="px-3 py-3 text-right font-black text-primary">{fmt(p.stockValue)} XOF</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Table dormants ── */}
        {tab === "dormant" && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-12 text-center text-zinc-400 text-xs font-bold">Chargement…</div>
            ) : (data?.dormantProducts ?? []).length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <Package className="h-8 w-8 text-zinc-200 dark:text-zinc-700" />
                <p className="text-sm font-black text-zinc-400">Aucun produit dormant</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[9px] text-zinc-400 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left font-black">Produit</th>
                      <th className="px-3 py-3 text-center font-black">Stock</th>
                      <th className="px-3 py-3 text-right font-black">Valeur</th>
                      <th className="px-3 py-3 text-right font-black">Sans Vente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {data!.dormantProducts.map((p) => (
                      <tr key={p.productId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="px-4 py-3 font-black text-zinc-800 dark:text-zinc-100">{p.productName}</td>
                        <td className="px-3 py-3 text-center font-bold text-zinc-500">{p.stockQty}</td>
                        <td className="px-3 py-3 text-right font-black text-primary">{fmt(p.stockValue)} XOF</td>
                        <td className="px-3 py-3 text-right">
                          <span className="inline-flex px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-black text-[10px] rounded-lg">
                            {p.daysSinceLastSale != null ? `${p.daysSinceLastSale}j` : "Jamais vendu"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
