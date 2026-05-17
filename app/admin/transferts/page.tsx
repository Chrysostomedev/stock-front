"use client";

import React, { useState, useEffect } from "react";
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
  ArrowRightLeft,
  Plus,
  Search,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Truck,
  ArrowRight,
  Eye,
  Trash2
} from "lucide-react";

export default function AdminTransfertsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Creation States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [fromShopId, setFromShopId] = useState("");
  const [toShopId, setToShopId] = useState("");
  const [notes, setNotes] = useState("");
  
  // Products list of the selected source shop
  const [sourceProducts, setSourceProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ productId: string; name: string; quantity: number }[]>([]);
  const [tempProductId, setTempProductId] = useState("");
  const [tempQty, setTempQty] = useState(1);

  // View Modal States
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transRes, shopsRes] = await Promise.all([
        StockTransferService.getAll(),
        ShopService.getAll()
      ]);
      setTransfers(Array.isArray(transRes) ? transRes : transRes.data || []);
      setShops(shopsRes);
    } catch (error) {
      showToast("Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  };

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
        const prodRes = await ProductService.getAll({ shopId: fromShopId });
        setSourceProducts(Array.isArray(prodRes) ? prodRes : prodRes.data || []);
      } catch (error) {
        showToast("Erreur lors du chargement des produits de la boutique source", "error");
      }
    };
    fetchProducts();
    setSelectedItems([]);
  }, [fromShopId]);

  const handleAddItem = () => {
    if (!tempProductId || tempQty <= 0) return;
    const prod = sourceProducts.find(p => p.id === tempProductId);
    if (!prod) return;

    if (tempQty > prod.stockQty) {
      showToast(`Stock insuffisant (${prod.stockQty} disponibles)`, "error");
      return;
    }

    const existingIdx = selectedItems.findIndex(i => i.productId === tempProductId);
    if (existingIdx > -1) {
      const updated = [...selectedItems];
      updated[existingIdx].quantity += tempQty;
      setSelectedItems(updated);
    } else {
      setSelectedItems([...selectedItems, { productId: tempProductId, name: prod.name, quantity: tempQty }]);
    }
    setTempProductId("");
    setTempQty(1);
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
      await StockTransferService.create({
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

      showToast("Transfert de stock initié avec succès !", "success");
      setIsCreateOpen(false);
      // Reset form
      setFromShopId("");
      setToShopId("");
      setNotes("");
      setSelectedItems([]);
      loadData();
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Erreur lors du transfert", "error");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await StockTransferService.updateStatus(id, newStatus);
      showToast(`Statut du transfert mis à jour : ${newStatus}`, "success");
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

  const columns = [
    {
      header: "N° Transfert",
      accessor: (t: StockTransfer) => (
        <span className="font-black text-foreground">{t.id.slice(0, 8).toUpperCase()}</span>
      )
    },
    {
      header: "Source",
      accessor: (t: StockTransfer) => (
        <span className="text-xs font-bold text-zinc-500">{t.fromShop?.name || t.fromShopId}</span>
      )
    },
    {
      header: "",
      accessor: () => <ArrowRight className="h-4 w-4 text-zinc-400" />
    },
    {
      header: "Destination",
      accessor: (t: StockTransfer) => (
        <span className="text-xs font-bold text-zinc-500">{t.toShop?.name || t.toShopId}</span>
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
      title="Transferts de Stock Inter-Boutiques"
      subtitle="Supervision globale des mouvements de marchandises"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Transfert
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <Card className="p-6">
          <DataTable columns={columns} data={transfers} isLoading={loading} />
        </Card>
      </div>

      {/* Creation Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Créer un Transfert de Stock">
        <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Boutique Source</label>
              <select
                value={fromShopId}
                onChange={(e) => setFromShopId(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
              >
                <option value="">Sélectionner source...</option>
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Boutique Destination</label>
              <select
                value={toShopId}
                onChange={(e) => setToShopId(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
              >
                <option value="">Sélectionner destination...</option>
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Notes / Observations</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Raison du transfert ou détails..."
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
            />
          </div>

          {/* Item addition section */}
          {fromShopId && (
            <div className="border-t border-zinc-150 dark:border-zinc-800 pt-4 mt-2">
              <h5 className="text-xs font-black text-foreground uppercase mb-3">Ajouter des Articles</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400">Produit</label>
                  <select
                    value={tempProductId}
                    onChange={(e) => setTempProductId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="">Sélectionner produit...</option>
                    {sourceProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQty})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex flex-col gap-1.5 w-24">
                    <label className="text-[10px] font-bold text-zinc-400">Qté</label>
                    <input
                      type="number"
                      value={tempQty}
                      onChange={(e) => setTempQty(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <Button variant="secondary" className="px-4 h-[42px]" onClick={handleAddItem}>
                    +
                  </Button>
                </div>
              </div>

              {/* Items Table inside modal */}
              {selectedItems.length > 0 && (
                <div className="mt-4 border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs font-bold">
                    <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Désignation</th>
                        <th className="p-3">Quantité</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map((item, idx) => (
                        <tr key={idx} className="border-t border-zinc-150 dark:border-zinc-800">
                          <td className="p-3">{item.name}</td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700">
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

          <Button variant="primary" className="mt-4 w-full" onClick={handleCreateTransfer}>
            Confirmer le Transfert
          </Button>
        </div>
      </Modal>

      {/* Details View Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Détails du Transfert">
        {selectedTransfer && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 text-xs font-bold">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase">Depuis :</span>
                <p className="text-sm font-black text-foreground">{selectedTransfer.fromShop?.name || selectedTransfer.fromShopId}</p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase">Vers :</span>
                <p className="text-sm font-black text-foreground">{selectedTransfer.toShop?.name || selectedTransfer.toShopId}</p>
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
                    <th className="p-3">Article</th>
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

            {/* Quick transition action buttons */}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
              {selectedTransfer.status === "PENDING" && (
                <>
                  <Button variant="primary" onClick={() => handleUpdateStatus(selectedTransfer.id, "IN_TRANSIT")}>
                    Mettre en Transit (Expédier)
                  </Button>
                  <Button variant="danger" onClick={() => handleUpdateStatus(selectedTransfer.id, "CANCELLED")}>
                    Annuler le transfert
                  </Button>
                </>
              )}
              {selectedTransfer.status === "IN_TRANSIT" && (
                <>
                  <Button variant="primary" onClick={() => handleUpdateStatus(selectedTransfer.id, "COMPLETED")}>
                    Confirmer la Réception (Valider)
                  </Button>
                  <Button variant="danger" onClick={() => handleUpdateStatus(selectedTransfer.id, "CANCELLED")}>
                    Annuler le transfert
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
