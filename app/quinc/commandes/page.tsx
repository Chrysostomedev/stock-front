"use client";

import { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/contexts/ToastContext";
import SaleService from "@/services/sale.service";
import { useAuth } from "@/hooks/useAuth";
import {
  FileText, Search, Calendar, User, Clock,
  XCircle, RotateCcw, Printer, RefreshCw, ShoppingBag,
  ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  Package, ArrowLeftRight,
} from "lucide-react";
const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

const PAYMENT_METHODS = [
  { value: "CASH",         label: "Espèces" },
  { value: "MOBILE_MONEY", label: "Mobile Money (MTN / Orange)" },
  { value: "BANK_CARD",    label: "Carte bancaire" },
  { value: "CREDIT",       label: "Crédit client" },
  { value: "MIXED",        label: "Paiement mixte" },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return <Badge variant="success" className="text-[9px] uppercase tracking-wider">Complétée</Badge>;
    case "PARTIALLY_PAID":
      return <Badge variant="outline" className="text-[9px] uppercase tracking-wider border-amber-400 text-amber-600">Partiel</Badge>;
    case "VOIDED":
      return <Badge variant="danger" className="text-[9px] uppercase tracking-wider">Annulée</Badge>;
    case "REFUNDED":
      return <Badge variant="outline" className="text-[9px] uppercase tracking-wider border-violet-400 text-violet-600">Remboursée</Badge>;
    default:
      return <Badge className="text-[9px]">{status}</Badge>;
  }
}

function canAction(status: string) {
  return status === "COMPLETED" || status === "PARTIALLY_PAID";
}

export default function QuincCommandesPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const LIMIT = 100;

  /* ── State liste ── */
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<any>(null);

  /* ── State modal VOID ── */
  const [isVoidOpen, setIsVoidOpen] = useState(false);
  const [voidSale, setVoidSale] = useState<any>(null);
  const [voidReason, setVoidReason] = useState("");
  const [isVoidSubmitting, setIsVoidSubmitting] = useState(false);

  /* ── State modal REFUND ── */
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [refundSale, setRefundSale] = useState<any>(null);
  const [refundMode, setRefundMode] = useState<"total" | "partial">("total");
  const [refundItems, setRefundItems] = useState<
    { saleItemId: string; quantity: number; maxQty: number; productName: string }[]
  >([]);
  const [refundPaymentMethod, setRefundPaymentMethod] = useState("CASH");
  const [refundReference, setRefundReference] = useState("");
  const [returnToStock, setReturnToStock] = useState(true);
  const [refundReason, setRefundReason] = useState("");
  const [isRefundSubmitting, setIsRefundSubmitting] = useState(false);

  /* ── Chargement ── */
  const loadSales = async (page = 1) => {
    if (!user?.shopId) return;
    setLoading(true);
    try {
      const response = await SaleService.getAll({ shopId: user.shopId, page, limit: LIMIT });
      const list = response.data && Array.isArray(response.data)
        ? response.data
        : Array.isArray(response) ? response : [];
      setSales(list);
      setTotal(response.total ?? list.length);
      setTotalPages(response.totalPages ?? 1);
      setCurrentPage(page);
      if (page === 1 && list.length > 0) {
        const firstDateStr = new Date(list[0].createdAt).toLocaleDateString("fr-FR", {
          day: "numeric", month: "long", year: "numeric",
        });
        setExpandedDays({ [firstDateStr]: true });
      }
    } catch {
      showToast("Erreur lors du chargement des ventes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSales(1); }, [user]);

  const toggleDay = (dayStr: string) =>
    setExpandedDays((prev) => ({ ...prev, [dayStr]: !prev[dayStr] }));

  /* ── Filtrage ── */
  const filteredSales = useMemo(() => {
    if (!search.trim()) return sales;
    const q = search.toLowerCase();
    return sales.filter(
      (s) =>
        s.id?.toLowerCase().includes(q) ||
        s.receiptNumber?.toLowerCase().includes(q) ||
        s.customer?.name?.toLowerCase().includes(q),
    );
  }, [sales, search]);

  /* ── Regroupement par jour ── */
  const salesByDay = useMemo(() => {
    const groups: Record<string, { date: Date; sales: any[] }> = {};
    filteredSales.forEach((s) => {
      const date = new Date(s.createdAt);
      const dateStr = date.toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      });
      if (!groups[dateStr]) groups[dateStr] = { date, sales: [] };
      groups[dateStr].sales.push(s);
    });
    return Object.entries(groups).sort((a, b) => b[1].date.getTime() - a[1].date.getTime());
  }, [filteredSales]);

  /* ── Handlers VOID ── */
  const openVoidModal = (sale: any) => {
    setVoidSale(sale);
    setVoidReason("");
    setIsVoidOpen(true);
  };

  const handleVoid = async () => {
    if (!voidSale || !voidReason.trim()) return;
    setIsVoidSubmitting(true);
    try {
      const updated = await SaleService.void(voidSale.id, {
        userId: user!.id,
        reason: voidReason.trim(),
      });
      setSales((prev) =>
        prev.map((s) => s.id === voidSale.id ? { ...s, status: "VOIDED", notes: updated.notes } : s)
      );
      showToast(
        `Vente ${updated.receiptNumber || voidSale.receiptNumber} annulée — stock restitué`,
        "success"
      );
      setIsVoidOpen(false);
      setVoidSale(null);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Erreur lors de l'annulation", "error");
    } finally {
      setIsVoidSubmitting(false);
    }
  };

  /* ── Handlers REFUND ── */
  const openRefundModal = (sale: any) => {
    setRefundSale(sale);
    setRefundMode("total");
    setRefundReason("");
    setRefundReference("");
    setRefundPaymentMethod("CASH");
    setReturnToStock(true);
    setRefundItems(
      (sale.items || []).map((item: any) => ({
        saleItemId: item.id,
        quantity: 0,
        maxQty: Number(item.quantity),
        productName: item.productName || "Produit",
      }))
    );
    setIsRefundOpen(true);
  };

  const updateRefundItemQty = (saleItemId: string, qty: number) => {
    setRefundItems((prev) =>
      prev.map((i) =>
        i.saleItemId === saleItemId
          ? { ...i, quantity: Math.max(0, Math.min(qty, i.maxQty)) }
          : i
      )
    );
  };

  const refundTotal = useMemo(() => {
    if (!refundSale) return 0;
    if (refundMode === "total") return Number(refundSale.totalAmount || refundSale.total || 0);
    return refundItems.reduce((acc, ri) => {
      const item = refundSale.items?.find((i: any) => i.id === ri.saleItemId);
      if (!item || ri.quantity === 0) return acc;
      return acc + Number(item.unitPrice) * ri.quantity;
    }, 0);
  }, [refundSale, refundMode, refundItems]);

  const handleRefund = async () => {
    if (!refundSale || !refundReason.trim()) return;
    if (refundMode === "partial" && refundItems.every((i) => i.quantity === 0)) {
      showToast("Veuillez saisir au moins une quantité à rembourser", "error");
      return;
    }
    setIsRefundSubmitting(true);
    try {
      const dto: any = {
        userId: user!.id,
        paymentMethod: refundPaymentMethod,
        returnToStock,
        reason: refundReason.trim(),
      };
      if ((refundPaymentMethod === "MOBILE_MONEY" || refundPaymentMethod === "BANK_CARD") && refundReference.trim()) {
        dto.reference = refundReference.trim();
      }
      if (refundMode === "partial") {
        dto.items = refundItems
          .filter((i) => i.quantity > 0)
          .map((i) => ({ saleItemId: i.saleItemId, quantity: i.quantity }));
      }
      const refundResult = await SaleService.refund(refundSale.id, dto);
      setSales((prev) => [refundResult, ...prev]);
      showToast(
        `Remboursement ${refundResult.receiptNumber} créé — ${fmt(refundResult.totalAmount)} XOF remboursés`,
        "success"
      );
      setIsRefundOpen(false);
      setRefundSale(null);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Erreur lors du remboursement", "error");
    } finally {
      setIsRefundSubmitting(false);
    }
  };

  const needsReference = refundPaymentMethod === "MOBILE_MONEY" || refundPaymentMethod === "BANK_CARD";

  return (
    <AppLayout
      title="Historique des Ventes"
      subtitle="Journal des transactions — Quincaillerie"
      backUrl="/quinc"
      rightElement={
        <button
          onClick={() => loadSales()}
          className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-amber-500/10 hover:text-amber-600 transition-all cursor-pointer"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="flex flex-col gap-4 sm:gap-6 max-w-6xl mx-auto pb-12 px-2 sm:px-0">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-100 dark:border-zinc-800/50 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl sm:rounded-2xl shrink-0">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tickets Émis</p>
              <h4 className="text-base sm:text-xl font-black text-zinc-900 dark:text-zinc-50">{total}</h4>
            </div>
          </div>
          <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-100 dark:border-zinc-800/50 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl sm:rounded-2xl shrink-0">
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-500" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ventes affichées</p>
              <h4 className="text-base sm:text-xl font-black text-zinc-900 dark:text-zinc-50">{sales.length}</h4>
            </div>
          </div>
        </div>

        {/* ── Recherche ── */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher par ticket, N° reçu, client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-amber-500 transition-all shadow-sm"
          />
        </div>

        {/* ── Journal par jour ── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-foreground tracking-tight flex items-center gap-2">
              <Calendar className="h-5 w-5 text-zinc-400" />
              Journal des Ventes par Journée
            </h3>
            {totalPages > 1 && (
              <span className="text-[11px] font-bold text-zinc-400">
                Page {currentPage} / {totalPages}
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-20 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
              Chargement de l'historique…
            </div>
          ) : salesByDay.length === 0 ? (
            <Card className="p-12 text-center text-zinc-400 font-bold text-sm">
              Aucune vente trouvée.
            </Card>
          ) : (
            salesByDay.map(([dayStr, group]) => {
              const isOpen = !!expandedDays[dayStr];
              return (
                <Card key={dayStr} className="p-0 overflow-hidden border border-zinc-150 dark:border-zinc-800 shadow-md">
                  <button
                    onClick={() => toggleDay(dayStr)}
                    className="w-full flex items-center justify-between p-5 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-all border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      {isOpen ? <ChevronDown className="h-5 w-5 text-zinc-400" /> : <ChevronRight className="h-5 w-5 text-zinc-400" />}
                      <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">{dayStr}</span>
                    </div>
                    <span className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 rounded-full text-[10px] uppercase font-black tracking-wider text-zinc-500">
                      {group.sales.length} {group.sales.length > 1 ? "Ventes" : "Vente"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-bold border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider bg-white dark:bg-zinc-900">
                            <th className="py-2.5 px-4">Ticket</th>
                            <th className="py-2.5 px-4">Statut</th>
                            <th className="py-2.5 px-4">Heure</th>
                            <th className="py-2.5 px-4">Client</th>
                            <th className="py-2.5 px-4">Paiement</th>
                            <th className="py-2.5 px-4 text-right">Montant</th>
                            <th className="py-2.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.sales.map((sale) => {
                            const payMethod = sale.payments?.[0]?.method || "CASH";
                            const isActionable = canAction(sale.status || "COMPLETED");
                            const isVoided = sale.status === "VOIDED";
                            const isRefunded = sale.status === "REFUNDED";
                            return (
                              <tr
                                key={sale.id}
                                className={`border-b border-zinc-100/70 dark:border-zinc-800/40 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/20 ${
                                  isVoided || isRefunded ? "opacity-60" : ""
                                }`}
                              >
                                <td className="py-3 px-4">
                                  <p className="font-black text-foreground">
                                    {sale.receiptNumber || sale.id.slice(-6).toUpperCase()}
                                  </p>
                                  {sale.originalSaleId && (
                                    <p className="text-[9px] text-violet-500 font-bold mt-0.5 flex items-center gap-1">
                                      <ArrowLeftRight className="h-2.5 w-2.5" />
                                      Remb. de vente
                                    </p>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {getStatusBadge(sale.status || "COMPLETED")}
                                </td>
                                <td className="py-3 px-4 text-zinc-500">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 opacity-60" />
                                    {new Date(sale.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                                  <div className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 opacity-60" />
                                    {sale.customer?.name || "Client de passage"}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge
                                    variant={payMethod === "CASH" ? "success" : "primary"}
                                    className="text-[9px] uppercase tracking-wider"
                                  >
                                    {payMethod}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-right font-black text-amber-600">
                                  {fmt(sale.totalAmount || sale.total || 0)} XOF
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="py-1 px-2.5 text-[10px] font-black uppercase tracking-wider"
                                      onClick={() => setSelectedSaleDetail(sale)}
                                    >
                                      Détails
                                    </Button>
                                    <button
                                      onClick={() => showToast("Impression en cours...", "info")}
                                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-amber-600 transition-all"
                                      title="Imprimer"
                                    >
                                      <Printer className="h-3.5 w-3.5" />
                                    </button>
                                    {isActionable && (
                                      <>
                                        <button
                                          onClick={() => openVoidModal(sale)}
                                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-zinc-400 hover:text-red-600 transition-all"
                                          title="Annuler la vente"
                                        >
                                          <XCircle className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={() => openRefundModal(sale)}
                                          className="p-1.5 hover:bg-violet-50 dark:hover:bg-violet-950/30 rounded-lg text-zinc-400 hover:text-violet-600 transition-all"
                                          title="Rembourser"
                                        >
                                          <RotateCcw className="h-3.5 w-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              );
            })
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            limit={LIMIT}
            onPageChange={(page) => {
              loadSales(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      </div>

      {/* ══════════ MODAL DÉTAIL ══════════ */}
      <Modal
        isOpen={!!selectedSaleDetail}
        onClose={() => setSelectedSaleDetail(null)}
        title={`Détails — ${selectedSaleDetail?.receiptNumber || selectedSaleDetail?.id?.slice(-6)?.toUpperCase()}`}
        size="lg"
      >
        {selectedSaleDetail && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4 text-xs font-bold bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 uppercase text-[9px] tracking-wider font-black">Date & Heure</span>
                <span>{new Date(selectedSaleDetail.createdAt).toLocaleDateString("fr-FR")} à {new Date(selectedSaleDetail.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 uppercase text-[9px] tracking-wider font-black">Statut</span>
                {getStatusBadge(selectedSaleDetail.status || "COMPLETED")}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 uppercase text-[9px] tracking-wider font-black">Client</span>
                <span>{selectedSaleDetail.customer?.name || "Client de passage"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 uppercase text-[9px] tracking-wider font-black">Paiement</span>
                <span>{selectedSaleDetail.payments?.[0]?.method || "CASH"}</span>
              </div>
            </div>

            {selectedSaleDetail.originalSaleId && (
              <div className="flex items-center gap-2 p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-900/30 rounded-xl text-violet-700 dark:text-violet-400 text-xs">
                <ArrowLeftRight className="h-4 w-4 shrink-0" />
                <span className="font-bold">Remboursement lié à la vente <span className="font-mono">{selectedSaleDetail.originalSaleId.slice(0, 8).toUpperCase()}</span></span>
              </div>
            )}

            {selectedSaleDetail.notes && (
              <div className="text-xs text-zinc-500 italic bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                {selectedSaleDetail.notes}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4" /> Produits
              </h4>
              <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-bold">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[9px] text-zinc-400 uppercase tracking-widest">
                      <th className="py-2 px-3">Désignation</th>
                      <th className="py-2 px-3 text-center">Qté</th>
                      <th className="py-2 px-3 text-right">P.U.</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSaleDetail.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50">
                        <td className="py-2.5 px-3 font-black text-foreground">{item.productName || "Produit"}</td>
                        <td className="py-2.5 px-3 text-center text-zinc-600 dark:text-zinc-300 font-black">{Number(item.quantity)}</td>
                        <td className="py-2.5 px-3 text-right text-zinc-600 dark:text-zinc-300">{fmt(Number(item.unitPrice))}</td>
                        <td className="py-2.5 px-3 text-right text-amber-600 font-black">{fmt(Number(item.totalPrice || Number(item.quantity) * Number(item.unitPrice)))} XOF</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <div className="flex justify-between w-56 text-xs">
                <span className="text-zinc-400">Remise :</span>
                <span className="font-bold text-red-500">-{fmt(Number(selectedSaleDetail.discountAmount || 0))} XOF</span>
              </div>
              <div className="flex justify-between w-56 text-sm font-black border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-1.5 mt-1">
                <span>Total payé :</span>
                <span className="text-amber-600">{fmt(Number(selectedSaleDetail.totalAmount || selectedSaleDetail.total))} XOF</span>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedSaleDetail(null)}>Fermer</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════ MODAL VOID ══════════ */}
      <Modal
        isOpen={isVoidOpen}
        onClose={() => { setIsVoidOpen(false); setVoidReason(""); }}
        title="Annuler la vente"
        size="sm"
      >
        {voidSale && (
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="text-xs font-black text-red-800 dark:text-red-400">
                  Annulation — {voidSale.receiptNumber || voidSale.id.slice(-6).toUpperCase()}
                </p>
                <p className="text-[11px] text-red-700/80 dark:text-red-500">
                  Le stock des articles sera automatiquement restitué. Action irréversible.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                Raison de l'annulation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Ex : Erreur de saisie, client a changé d'avis…"
                rows={3}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-red-400 transition-all resize-none"
              />
              <p className="text-[10px] text-zinc-400">{voidReason.trim().length} / minimum 5 caractères</p>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setIsVoidOpen(false); setVoidReason(""); }}
                disabled={isVoidSubmitting}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-red-600 hover:bg-red-700 border-red-600"
                onClick={handleVoid}
                loading={isVoidSubmitting}
                disabled={voidReason.trim().length < 5}
              >
                Confirmer l'annulation
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════ MODAL REFUND ══════════ */}
      <Modal
        isOpen={isRefundOpen}
        onClose={() => { setIsRefundOpen(false); setRefundSale(null); }}
        title="Rembourser une vente"
        size="md"
      >
        {refundSale && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl text-xs">
              <div>
                <p className="font-black text-foreground">{refundSale.receiptNumber || refundSale.id.slice(-6).toUpperCase()}</p>
                <p className="text-zinc-400">{fmt(refundSale.totalAmount || refundSale.total || 0)} XOF</p>
              </div>
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">{refundSale.items?.length || 0} article(s)</span>
            </div>

            <div className="flex gap-2">
              {(["total", "partial"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setRefundMode(mode)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition-all ${
                    refundMode === mode
                      ? "bg-violet-600 text-white border-violet-600"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-violet-400"
                  }`}
                >
                  {mode === "total" ? "Remboursement total" : "Remboursement partiel"}
                </button>
              ))}
            </div>

            {refundMode === "partial" && (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" /> Articles à rembourser
                </p>
                <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden">
                  {refundItems.map((ri) => (
                    <div key={ri.saleItemId} className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-foreground truncate">{ri.productName}</p>
                        <p className="text-[10px] text-zinc-400">Vendu : {ri.maxQty}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-zinc-400 font-bold">Qté :</span>
                        <input
                          type="number"
                          min={0}
                          max={ri.maxQty}
                          value={ri.quantity}
                          onChange={(e) => updateRefundItemQty(ri.saleItemId, Number(e.target.value))}
                          className="w-16 text-center px-2 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-black outline-none focus:border-violet-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-900/30 rounded-xl">
              <span className="text-xs font-black text-violet-700 dark:text-violet-400">Montant à rembourser</span>
              <span className="text-sm font-black text-violet-700 dark:text-violet-300">{fmt(refundTotal)} XOF</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                Méthode de remboursement <span className="text-red-500">*</span>
              </label>
              <select
                value={refundPaymentMethod}
                onChange={(e) => { setRefundPaymentMethod(e.target.value); setRefundReference(""); }}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-violet-400 transition-all"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {needsReference && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Référence transaction</label>
                <input
                  type="text"
                  value={refundReference}
                  onChange={(e) => setRefundReference(e.target.value)}
                  placeholder="Ex : OM-TXN-987654"
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-violet-400 transition-all"
                />
              </div>
            )}

            <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${returnToStock ? "bg-emerald-500 border-emerald-500" : "border-zinc-300 dark:border-zinc-600"}`}>
                {returnToStock && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
              </div>
              <input type="checkbox" checked={returnToStock} onChange={(e) => setReturnToStock(e.target.checked)} className="sr-only" />
              <div>
                <p className="text-xs font-black text-foreground">Remettre les articles en stock</p>
                <p className="text-[10px] text-zinc-400">Décocher si le produit est défectueux ou ne peut pas être revendu</p>
              </div>
            </label>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                Raison du remboursement <span className="text-red-500">*</span>
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Ex : Client insatisfait, produit défectueux…"
                rows={2}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-violet-400 transition-all resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setIsRefundOpen(false); setRefundSale(null); }}
                disabled={isRefundSubmitting}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-violet-600 hover:bg-violet-700 border-violet-600"
                onClick={handleRefund}
                loading={isRefundSubmitting}
                disabled={refundReason.trim().length < 5 || refundTotal === 0}
              >
                Confirmer le remboursement
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
