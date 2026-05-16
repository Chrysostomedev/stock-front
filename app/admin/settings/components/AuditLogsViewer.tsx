"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Search, ShieldCheck, Plus, Edit2, Trash2, Clock, Eye, Activity, Database, Server, User } from "lucide-react";
import AuditLogService from "@/services/admin/auditLog.service";
import { AuditLog } from "@/types/auditLog";
import { useToast } from "@/contexts/ToastContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AuditLogsViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuditLogsViewer({ isOpen, onClose }: AuditLogsViewerProps) {
  const { showToast } = useToast();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLogs(1);
    }
  }, [isOpen]);

  const loadLogs = async (pageNumber: number) => {
    try {
      setLoading(true);
      const res = await AuditLogService.getLogs(pageNumber, 10);
      setLogs(res.data || []);
      setTotalPages(res.totalPages || 1);
      setPage(res.page || 1);
    } catch (error) {
      showToast("Erreur lors du chargement des logs", "error");
    } finally {
      setLoading(false);
    }
  };

  const getActionConfig = (action: string) => {
    switch (action) {
      case "CREATE": return { icon: <Plus className="w-4 h-4" />, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-900", label: "Création" };
      case "UPDATE": return { icon: <Edit2 className="w-4 h-4" />, color: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400", border: "border-blue-200 dark:border-blue-900", label: "Modification" };
      case "DELETE": return { icon: <Trash2 className="w-4 h-4" />, color: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400", border: "border-red-200 dark:border-red-900", label: "Suppression" };
      default: return { icon: <Activity className="w-4 h-4" />, color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", border: "border-zinc-200 dark:border-zinc-700", label: action };
    }
  };

  const filteredLogs = logs.filter(l => 
    l.entityType.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (l.notes && l.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
    l.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Journal d'Audit Système" size="xl">
        <div className="flex flex-col md:flex-row gap-6 h-[600px] -mx-2">
          
          {/* LEFT PANE: Logs List */}
          <div className="w-full md:w-1/2 flex flex-col border-r border-zinc-100 dark:border-zinc-800 pr-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher par entité, action, note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {loading && logs.length === 0 ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-3">
                  <Database className="h-8 w-8 opacity-20" />
                  <span className="text-xs font-bold">Aucun log trouvé</span>
                </div>
              ) : (
                filteredLogs.map(log => {
                  const config = getActionConfig(log.action);
                  return (
                    <div 
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all border flex flex-col gap-2 ${
                        selectedLog?.id === log.id 
                          ? 'bg-primary/5 border-primary/30 dark:bg-primary/10 dark:border-primary/40 shadow-sm' 
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg border ${config.color} ${config.border}`}>
                            {config.icon}
                          </div>
                          <span className="text-xs font-black text-foreground">{log.entityType}</span>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-medium line-clamp-1">
                        {log.notes || `Action ${log.action} sur ${log.entityType}`}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => loadLogs(page - 1)} 
                  disabled={page === 1 || loading}
                >
                  Précédent
                </Button>
                <span className="text-xs font-bold text-zinc-500">
                  Page {page} / {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => loadLogs(page + 1)} 
                  disabled={page === totalPages || loading}
                >
                  Suivant
                </Button>
              </div>
            )}
          </div>

          {/* RIGHT PANE: Log Details */}
          <div className="w-full md:w-1/2 flex flex-col pl-2">
            {!selectedLog ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 space-y-4">
                <div className="h-20 w-20 rounded-3xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                  <ShieldCheck className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-black text-foreground">Détails de l'audit</h3>
                  <p className="text-xs mt-1">Sélectionnez un événement pour voir les détails</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 overflow-y-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2.5 rounded-xl border ${getActionConfig(selectedLog.action).color} ${getActionConfig(selectedLog.action).border}`}>
                    {getActionConfig(selectedLog.action).icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-foreground tracking-tight">{selectedLog.entityType}</h4>
                    <p className="text-xs text-zinc-500 font-bold">{getActionConfig(selectedLog.action).label} effectuée le {format(new Date(selectedLog.createdAt), "dd/MM/yyyy à HH:mm")}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-black text-zinc-400 flex items-center gap-1.5"><User className="w-3 h-3"/> ID Utilisateur</span>
                    <span className="text-xs font-bold text-foreground truncate" title={selectedLog.userId}>{selectedLog.userId || "Système"}</span>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-black text-zinc-400 flex items-center gap-1.5"><Server className="w-3 h-3"/> IP Source</span>
                    <span className="text-xs font-bold text-foreground truncate">{selectedLog.ipAddress || "Inconnue"}</span>
                  </div>
                </div>

                {selectedLog.notes && (
                  <div className="mb-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-xl">
                    <h5 className="text-[10px] uppercase font-black text-amber-600/70 dark:text-amber-500/70 mb-1.5">Notes de l'événement</h5>
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-400 leading-relaxed">{selectedLog.notes}</p>
                  </div>
                )}

                <div className="flex-1 flex flex-col gap-4">
                  {(selectedLog.action === "UPDATE" || selectedLog.action === "DELETE") && selectedLog.dataBefore && (
                    <div className="flex flex-col gap-2">
                      <h5 className="text-[10px] uppercase font-black text-zinc-500 flex items-center gap-1.5">
                        <Activity className="w-3 h-3"/> Données Avant
                      </h5>
                      <div className="bg-zinc-950 dark:bg-black rounded-xl p-3.5 overflow-x-auto border border-zinc-800">
                        <pre className="text-[10px] font-mono text-zinc-300 leading-relaxed">
                          {JSON.stringify(selectedLog.dataBefore, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {(selectedLog.action === "CREATE" || selectedLog.action === "UPDATE") && selectedLog.dataAfter && (
                    <div className="flex flex-col gap-2">
                      <h5 className="text-[10px] uppercase font-black text-zinc-500 flex items-center gap-1.5">
                        <Activity className="w-3 h-3"/> Données Après
                      </h5>
                      <div className="bg-zinc-950 dark:bg-black rounded-xl p-3.5 overflow-x-auto border border-zinc-800">
                        <pre className="text-[10px] font-mono text-zinc-300 leading-relaxed">
                          {JSON.stringify(selectedLog.dataAfter, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
                
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
