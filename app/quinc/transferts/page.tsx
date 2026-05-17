"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import StockTransferService from "@/services/super/stockTransfer.service";
import { StockTransfer } from "@/types/super";
import {
  ArrowRightLeft,
  Search,
  Calendar,
  Truck,
  ArrowRight,
  Eye,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function QuincTransfertsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // View Modal States
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);

  const loadData = async () => {
    if (!user) return;
    if (!user.shopId) {
      showToast("Erreur: Votre compte n'est associé à aucune boutique.", "error");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Fetch incoming transfers
      const incoming = await StockTransferService.getAll({ toShopId: user.shopId });
      // Fetch outgoing transfers
      const outgoing = await StockTransferService.getAll({ fromShopId: user.shopId });
      
      const allTransfers = [
        ...(Array.isArray(incoming) ? incoming : incoming.data || []),
        ...(Array.isArray(outgoing) ? outgoing : outgoing.data || [])
      ];

      // Remove duplicates just in case, and sort by date
      const unique = allTransfers.filter(
        (t, idx, self) => self.findIndex((x) => x.id === t.id) === idx
      );
      
      unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setTransfers(unique);
    } catch (error) {
      showToast("Erreur lors du chargement des transferts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await StockTransferService.updateStatus(id, newStatus);
      showToast(`Transfert mis à jour : ${newStatus === "COMPLETED" ? "Reçu" : "Annulé"}`, "success");
      setIsViewOpen(false);
      loadData();
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Erreur lors de la mise à jour", "error");
    }
  };

  const getStatusBadge = (status: string) => {
    const map: any = {
      PENDING: <Badge variant="outline">En attente</Badge>,
      IN_TRANSIT: <Badge variant="warning">En transit</Badge>,
      COMPLETED: <Badge variant="success">Reçu</Badge>,
      CANCELLED: <Badge variant="danger">Annulé</Badge>
    };
    return map[status] || <Badge variant="outline">{status}</Badge>;
  };

  const filtered = transfers.filter((t) => {
    const searchLower = search.toLowerCase();
    const sourceName = t.fromShop?.name?.toLowerCase() || "";
    const destName = t.toShop?.name?.toLowerCase() || "";
    const notes = t.notes?.toLowerCase() || "";
    return sourceName.includes(searchLower) || destName.includes(searchLower) || notes.includes(searchLower);
  });

  const columns = [
    {
      header: "N° Transfert",
      accessor: (t: StockTransfer) => (
        <span className="font-black text-foreground">{t.id.slice(0, 8).toUpperCase()}</span>
      )
    },
    {
      header: "Type",
      accessor: (t: StockTransfer) => (
        <Badge variant={t.toShopId === user?.shopId ? "primary" : "secondary"}>
          {t.toShopId === user?.shopId ? "Entrant" : "Sortant"}
        </Badge>
      )
    },
    {
      header: "Boutique Partenaire",
      accessor: (t: StockTransfer) => (
        <span className="text-xs font-bold text-zinc-500">
          {t.toShopId === user?.shopId ? (t.fromShop?.name || "Source") : (t.toShop?.name || "Destination")}
        </span>
      )
    },
    {
      header: "Date",
      accessor: (t: StockTransfer) => (
        <span className="text-xs font-bold text-zinc-400">{new Date(t.createdAt).toLocaleDateString()}</span>
      )
    },
    {
      header: "Statut",
      accessor: (t: StockTransfer) => getStatusBadge(t.status)
    },
    {
      header: "Actions",
      accessor: (t: StockTransfer) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={() => {
            setSelectedTransfer(t);
            setIsViewOpen(true);
          }}
        >
          <Eye className="h-4 w-4 mr-1.5" />
          Détails
        </Button>
      ),
      className: "text-right"
    }
  ];

  return (
    <AppLayout
      title="Mouvements & Transferts"
      subtitle="Suivi des transferts de stock reçus et envoyés"
    >
      <div className="flex flex-col gap-6">
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher par boutique ou notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
          <DataTable columns={columns} data={filtered} isLoading={loading} />
        </Card>
      </div>

      {/* Details View Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Détails du Transfert de Stock">
        {selectedTransfer && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 text-xs font-bold">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase">Provenance :</span>
                <p className="text-sm font-black text-foreground">{selectedTransfer.fromShop?.name || "Boutique Source"}</p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase">Destination :</span>
                <p className="text-sm font-black text-foreground">{selectedTransfer.toShop?.name || "Boutique Destination"}</p>
              </div>
            </div>

            <div className="text-xs font-bold">
              <span className="text-[10px] text-zinc-400 uppercase">Notes :</span>
              <p className="text-foreground">{selectedTransfer.notes || "Aucune observation."}</p>
            </div>

            <div className="border rounded-xl overflow-hidden mt-2">
              <table className="w-full text-left text-xs font-bold">
                <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Désignation</th>
                    <th className="p-3">Quantité</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTransfer.items?.map((item, idx) => (
                    <tr key={idx} className="border-t border-zinc-150 dark:border-zinc-800">
                      <td className="p-3">{item.product?.name || item.productId}</td>
                      <td className="p-3">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions for recipient boutique */}
            {selectedTransfer.toShopId === user?.shopId && selectedTransfer.status === "IN_TRANSIT" && (
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
                <Button variant="primary" onClick={() => handleUpdateStatus(selectedTransfer.id, "COMPLETED")}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Valider la Réception & Intégrer au Stock
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
