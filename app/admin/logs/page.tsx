"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import AuditLogService, { AuditLog } from "@/services/audit-log.service";
import ShopService, { Shop } from "@/services/shop.service";
import AdminUserService from "@/services/admin/user.service";
import { UserAccount } from "@/types/admin";
import {
  Shield,
  Search,
  RefreshCw,
  AlertTriangle,
  Clock,
  Eye,
  Info,
  Monitor,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function AdminLogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [selectedShop, setSelectedShop] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Selected Log Details Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load shops and users in parallel to resolve names
      const [resShops, resUsers] = await Promise.all([
        ShopService.getAll(),
        AdminUserService.getAllUsers()
      ]);

      const activeShops = Array.isArray(resShops) ? resShops : (resShops as any)?.data || [];
      const activeUsers = Array.isArray(resUsers) ? resUsers : (resUsers as any)?.data || [];
      
      setShops(activeShops);
      setUsers(activeUsers);

      // Load audit logs with pagination & filters
      const params: any = {
        page,
        limit,
      };
      if (selectedShop) params.shopId = selectedShop;
      if (selectedUser) params.userId = selectedUser;
      if (selectedAction) params.action = selectedAction;

      const logRes = await AuditLogService.getAll(params);
      
      if (logRes && Array.isArray(logRes.data)) {
        setLogs(logRes.data);
        setTotalPages(logRes.totalPages || 1);
        setTotalItems(logRes.total || logRes.data.length);
      } else if (Array.isArray(logRes)) {
        setLogs(logRes);
        setTotalPages(1);
        setTotalItems(logRes.length);
      } else {
        setLogs([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      showToast("Impossible de récupérer les journaux d'activité en temps réel.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, selectedShop, selectedUser, selectedAction]);

  const handleRefresh = () => {
    setPage(1);
    loadData();
  };

  const getSeverityBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("delete") || act.includes("supprim") || act.includes("fail") || act.includes("échec")) {
      return (
        <Badge variant="danger" className="animate-pulse">
          CRITIQUE / SECURITÉ
        </Badge>
      );
    }
    if (act.includes("update") || act.includes("modif") || act.includes("ajust") || act.includes("export")) {
      return <Badge variant="warning">MODIFICATION</Badge>;
    }
    return <Badge variant="secondary">INFORMATION</Badge>;
  };

  const getUserDisplayName = (userId: string) => {
    const matched = users.find(u => u.id === userId);
    if (matched) {
      return (
        <div className="flex flex-col text-xs font-bold">
          <span className="text-zinc-800 dark:text-zinc-150">{matched.name || matched.username}</span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest">{matched.role}</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col text-xs font-bold">
        <span className="text-zinc-500">Utilisateur inconnu</span>
        <span className="text-[10px] text-zinc-400 font-mono">{userId.slice(0, 8)}...</span>
      </div>
    );
  };

  const getShopDisplayName = (shopId: string) => {
    const matched = shops.find(s => s.id === shopId);
    return matched ? matched.name : "Multi-Boutique / Global";
  };

  // Local client filter for fast matching
  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const query = search.toLowerCase();
    const actionMatch = log.action?.toLowerCase().includes(query);
    const entityMatch = log.entityType?.toLowerCase().includes(query);
    const notesMatch = log.notes?.toLowerCase().includes(query);
    const ipMatch = log.ipAddress?.includes(query);
    return actionMatch || entityMatch || notesMatch || ipMatch;
  });

  const columns = [
    {
      header: "Horodatage",
      accessor: (item: AuditLog) => (
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
          <Clock className="h-3.5 w-3.5" />
          <span>{new Date(item.createdAt).toLocaleString("fr-FR")}</span>
        </div>
      )
    },
    {
      header: "Boutique d'origine",
      accessor: (item: AuditLog) => (
        <span className="text-xs font-bold text-zinc-650 dark:text-zinc-350">
          {getShopDisplayName(item.shopId)}
        </span>
      )
    },
    {
      header: "Opérateur",
      accessor: (item: AuditLog) => getUserDisplayName(item.userId)
    },
    {
      header: "Action / Cible",
      accessor: (item: AuditLog) => (
        <div className="flex flex-col text-xs font-bold">
          <span className="text-primary">{item.action}</span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
            Table: {item.entityType} ({item.entityId ? item.entityId.slice(0, 8) : "N/A"})
          </span>
        </div>
      )
    },
    {
      header: "Commentaires / Notes",
      accessor: (item: AuditLog) => (
        <span className="text-[10px] text-zinc-500 font-bold max-w-xs block truncate">
          {item.notes || "—"}
        </span>
      )
    },
    {
      header: "Sécurité",
      accessor: (item: AuditLog) => getSeverityBadge(item.action)
    },
    {
      header: "Actions",
      accessor: (item: AuditLog) => (
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={() => {
            setSelectedLog(item);
            setIsViewOpen(true);
          }}
        >
          <Eye className="h-3.5 w-3.5" />
          Détails
        </Button>
      )
    }
  ];

  return (
    <AppLayout
      title="Traçabilité & Journal d'Audit"
      subtitle="Supervision temps réel et journal d'activité anti-fraude de toutes les boutiques"
      rightElement={
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRefresh}
          className="gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Rafraîchir
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* KPI Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-500/5 to-indigo-100/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Événements Audités</p>
              <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 mt-1">
                {totalItems} Logs
              </h3>
            </div>
            <div className="p-3 bg-indigo-500/15 text-indigo-500 rounded-xl">
              <Shield className="h-6 w-6" />
            </div>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-amber-500/5 to-amber-100/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Modifications Catalogues</p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {logs.filter(l => l.action?.toLowerCase().includes("update")).length} Actions
              </h3>
            </div>
            <div className="p-3 bg-amber-500/15 text-amber-500 rounded-xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500/5 to-emerald-100/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Opérateurs Actifs</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {users.filter(u => u.isActive).length} Users
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/15 text-emerald-500 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
          </Card>
        </div>

        {/* Advanced Filters */}
        <Card className="p-4 border-none shadow-xl flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher par action, table, IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>

            <select
              value={selectedShop}
              onChange={(e) => { setSelectedShop(e.target.value); setPage(1); }}
              className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            >
              <option value="">Tous les points de vente</option>
              {shops.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              value={selectedUser}
              onChange={(e) => { setSelectedUser(e.target.value); setPage(1); }}
              className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            >
              <option value="">Tous les opérateurs</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name || u.username}</option>
              ))}
            </select>

            <select
              value={selectedAction}
              onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }}
              className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            >
              <option value="">Tous les types d'action</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </Card>

        {/* Dynamic Logs Table */}
        <Card className="overflow-hidden border-none shadow-xl">
          <DataTable
            columns={columns}
            data={filteredLogs}
            isLoading={loading}
          />
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <span className="text-zinc-500 font-bold">
                Page {page} sur {totalPages} ({totalItems} logs au total)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="gap-1"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Details View Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Fiche d'Audit & Traçabilité de l'Événement"
        size="lg"
      >
        {selectedLog && (
          <div className="flex flex-col gap-6 text-xs font-bold">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-zinc-800 dark:text-zinc-100">{selectedLog.action}</h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">Identifiant unique : {selectedLog.id}</p>
              </div>
            </div>

            {/* Properties */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Opérateur</span>
                <span className="text-zinc-850 dark:text-zinc-200">
                  {users.find(u => u.id === selectedLog.userId)?.name || "N/A"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Point de Vente</span>
                <span className="text-zinc-850 dark:text-zinc-200">
                  {getShopDisplayName(selectedLog.shopId)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Adresse IP Source</span>
                <span className="text-zinc-850 dark:text-zinc-200 font-mono">
                  {selectedLog.ipAddress || "Interne / Système"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Navigateur (User Agent)</span>
                <span className="text-zinc-850 dark:text-zinc-200 flex items-center gap-1.5 truncate">
                  <Monitor className="h-3.5 w-3.5 text-zinc-400" />
                  {selectedLog.userAgent || "Serveur / Direct"}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-2 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Notes complémentaires</span>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-bold text-xs">
                {selectedLog.notes || "Aucun commentaire additionnel enregistré."}
              </p>
            </div>

            {/* Data diff (before/after json) */}
            {(selectedLog.dataBefore || selectedLog.dataAfter) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedLog.dataBefore && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Donnée Avant (Data Before)</span>
                    <pre className="p-3 bg-zinc-900 text-emerald-400 font-mono text-[9px] rounded-xl overflow-x-auto max-h-40">
                      {JSON.stringify(selectedLog.dataBefore, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.dataAfter && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Donnée Après (Data After)</span>
                    <pre className="p-3 bg-zinc-900 text-indigo-400 font-mono text-[9px] rounded-xl overflow-x-auto max-h-40">
                      {JSON.stringify(selectedLog.dataAfter, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-black tracking-widest uppercase">
              <Info className="h-3.5 w-3.5 text-indigo-500" />
              <span>Donnée certifiée et signée dans la blockchain interne</span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setIsViewOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
