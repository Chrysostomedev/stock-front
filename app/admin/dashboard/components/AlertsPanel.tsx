"use client";

import React, { useState } from "react";
import { AlertsResponse } from "@/types/dashboard";
import {
  AlertTriangle, PackageX, Clock, Banknote,
  RefreshCw, Wifi, WifiOff,
} from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface AlertsPanelProps {
  data: AlertsResponse | null;
  loading: boolean;
}

type AlertTab = "stock" | "sessions" | "cash" | "sync";

export default function AlertsPanel({ data, loading }: AlertsPanelProps) {
  const [activeTab, setActiveTab] = useState<AlertTab>("stock");

  // Unpack alerts from array format returned by backend
  const alertsList = data?.alerts ?? [];

  const stockAlert = alertsList.find((a) => a.type === "LOW_STOCK");
  const lowStock = stockAlert?.details?.items ?? [];
  const stockCount = stockAlert?.count ?? lowStock.length;

  const sessionAlert = alertsList.find((a) => a.type === "UNCLOSED_SESSIONS");
  const unclosedSessions = sessionAlert?.details?.items ?? [];
  const sessionCount = sessionAlert?.count ?? unclosedSessions.length;

  const cashAlert = alertsList.find((a) => a.type === "ABNORMAL_CASH_SESSIONS");
  const abnormalCashSessions = cashAlert?.details?.items ?? [];
  const cashCount = cashAlert?.count ?? abnormalCashSessions.length;

  const syncAlert = alertsList.find((a) => a.type === "SYNC_STATUS" || a.type === "SYNC");
  const syncErrors = syncAlert?.details?.errors ?? syncAlert?.count ?? 0;
  const syncPending = syncAlert?.details?.pending ?? 0;

  const TABS: { key: AlertTab; label: string; count: number; icon: React.ReactNode; color: string }[] = [
    {
      key: "stock",
      label: "Stocks bas",
      count: stockCount,
      icon: <PackageX className="h-3.5 w-3.5" />,
      color: "text-rose-500",
    },
    {
      key: "sessions",
      label: "Sessions",
      count: sessionCount,
      icon: <Clock className="h-3.5 w-3.5" />,
      color: "text-amber-500",
    },
    {
      key: "cash",
      label: "Écarts caisse",
      count: cashCount,
      icon: <Banknote className="h-3.5 w-3.5" />,
      color: "text-orange-500",
    },
    {
      key: "sync",
      label: "Sync",
      count: syncErrors,
      icon: <RefreshCw className="h-3.5 w-3.5" />,
      color: "text-blue-500",
    },
  ];

  const totalAlerts = stockCount + sessionCount + cashCount + syncErrors;

  return (
    <div className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 relative">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 rounded-full flex items-center justify-center text-[9px] font-black text-white">
                {totalAlerts > 9 ? "9+" : totalAlerts}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">Alertes Opérationnelles</h3>
            <p className="text-[10px] text-zinc-400 font-bold">
              {totalAlerts === 0 ? "Tout est en ordre ✓" : `${totalAlerts} alerte(s) nécessitant attention`}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            id={`alert-tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === tab.key
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-foreground"
            }`}
          >
            <span className={tab.color}>{tab.icon}</span>
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                activeTab === tab.key
                  ? "bg-white/20 text-white"
                  : "bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ))
        ) : (
          <>
            {/* Low Stock */}
            {activeTab === "stock" && (
              lowStock.length === 0 ? (
                <EmptyState icon={<PackageX />} message="Aucun stock critique" />
              ) : (
                lowStock.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl">
                    <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex-shrink-0">
                      <PackageX className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-foreground truncate">{item.name ?? "Produit"}</p>
                      <p className="text-[10px] text-zinc-500 font-bold">{item.shopName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-black text-rose-600 dark:text-rose-400">{item.stockQty ?? 0}</p>
                      <p className="text-[10px] text-zinc-400 font-bold">/ {item.minStockQty ?? 0} min</p>
                    </div>
                  </div>
                ))
              )
            )}

            {/* Unclosed Sessions */}
            {activeTab === "sessions" && (
              unclosedSessions.length === 0 ? (
                <EmptyState icon={<Clock />} message="Toutes les sessions sont fermées" />
              ) : (
                unclosedSessions.map((sess) => (
                  <div key={sess.id} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                    <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex-shrink-0">
                      <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-foreground">{sess.cashierName ?? "Caissier"}</p>
                      <p className="text-[10px] text-zinc-500 font-bold">{sess.shopName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] font-black text-amber-600 dark:text-amber-400">
                        {sess.openedAt ? formatDistanceToNow(parseISO(sess.openedAt), { addSuffix: true, locale: fr }) : "—"}
                      </p>
                    </div>
                  </div>
                ))
              )
            )}

            {/* Abnormal Cash Sessions */}
            {activeTab === "cash" && (
              abnormalCashSessions.length === 0 ? (
                <EmptyState icon={<Banknote />} message="Aucun écart de caisse anormal" />
              ) : (
                abnormalCashSessions.map((sess) => (
                  <div key={sess.id} className={`flex items-center gap-3 p-3 border rounded-xl ${
                    (sess.difference ?? 0) < 0
                      ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30"
                      : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
                  }`}>
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                      (sess.difference ?? 0) < 0
                        ? "bg-rose-100 dark:bg-rose-900/30"
                        : "bg-emerald-100 dark:bg-emerald-900/30"
                    }`}>
                      <Banknote className={`h-3.5 w-3.5 ${
                        (sess.difference ?? 0) < 0 ? "text-rose-600" : "text-emerald-600"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-foreground">{sess.cashierName ?? "Caissier"}</p>
                      <p className="text-[10px] text-zinc-500 font-bold">{sess.shopName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-black ${(sess.difference ?? 0) < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {(sess.difference ?? 0) > 0 ? "+" : ""}{new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(sess.difference ?? 0)} FCFA
                      </p>
                      <p className="text-[10px] text-zinc-400 font-bold">
                        {sess.closedAt ? format(parseISO(sess.closedAt), "dd/MM HH:mm") : "—"}
                      </p>
                    </div>
                  </div>
                ))
              )
            )}

            {/* Sync Status */}
            {activeTab === "sync" && (
              <div className="space-y-2">
                <div className={`flex items-center gap-3 p-3.5 border rounded-xl ${
                  syncErrors > 0
                    ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30"
                    : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
                }`}>
                  {syncErrors > 0
                    ? <WifiOff className="h-5 w-5 text-rose-500 flex-shrink-0" />
                    : <Wifi className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  }
                  <div>
                    <p className="text-xs font-black text-foreground">
                      {syncErrors > 0 ? "Erreurs de synchronisation" : "Synchronisation OK"}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-bold">
                      {syncPending} en attente · {syncErrors} erreurs
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-zinc-400 gap-2">
      <div className="opacity-20 scale-150">{icon}</div>
      <p className="text-xs font-bold">{message}</p>
    </div>
  );
}
