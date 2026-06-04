"use client";

import React, { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/contexts/ToastContext";
import SaleService from "@/services/sale.service";
import { useAuth } from "@/hooks/useAuth";
import {
  FileText,
  Search,
  Calendar,
  User,
  TrendingUp,
  Clock,
  Trash2,
  Printer,
  RefreshCw,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

export default function SuperCommandesPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const LIMIT = 100;

  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<any>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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

  /* ── Filtrage par recherche ── */
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
    const groups: Record<string, { date: Date; sales: any[]; totalAmount: number }> = {};
    filteredSales.forEach((s) => {
      const date = new Date(s.createdAt);
      const dateStr = date.toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      });
      if (!groups[dateStr]) groups[dateStr] = { date, sales: [], totalAmount: 0 };
      groups[dateStr].sales.push(s);
      groups[dateStr].totalAmount += Number(s.totalAmount || s.total || 0);
    });
    return Object.entries(groups).sort((a, b) => b[1].date.getTime() - a[1].date.getTime());
  }, [filteredSales]);

  /* ── KPI de la page courante ── */
  const pageCA = sales.reduce((acc, s) => acc + Number(s.totalAmount || s.total || 0), 0);
  const pageMoyenne = sales.length > 0 ? Math.round(pageCA / sales.length) : 0;

  return (
    <AppLayout
      title="Historique des Ventes"
      subtitle="Journal détaillé des transactions de votre boutique"
      rightElement={
        <button
          onClick={() => loadSales(currentPage)}
          className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="flex flex-col gap-4 sm:gap-6 max-w-6xl mx-auto pb-12 px-2 sm:px-0">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-100 dark:border-zinc-800/50 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl sm:rounded-2xl shrink-0">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Chiffre d'Affaires</p>
              <h4 className="text-base sm:text-xl font-black text-zinc-900 dark:text-zinc-50 truncate">
                {fmt(pageCA)} <span className="text-[10px] font-medium text-zinc-400">XOF</span>
              </h4>
            </div>
          </div>
          <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-100 dark:border-zinc-800/50 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-primary/10 text-primary rounded-xl sm:rounded-2xl shrink-0">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tickets Émis</p>
              <h4 className="text-base sm:text-xl font-black text-zinc-900 dark:text-zinc-50">{total}</h4>
            </div>
          </div>
          <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-100 dark:border-zinc-800/50 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl sm:rounded-2xl shrink-0">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vente Moyenne</p>
              <h4 className="text-base sm:text-xl font-black text-zinc-900 dark:text-zinc-50 truncate">
                {fmt(pageMoyenne)} <span className="text-[10px] font-medium text-zinc-400">XOF</span>
              </h4>
            </div>
          </div>
        </div>

        {/* ── Barre de recherche ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher par ticket, N° reçu, client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all shadow-sm"
            />
          </div>
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
                <Card
                  key={dayStr}
                  className="p-0 overflow-hidden border border-zinc-150 dark:border-zinc-800 shadow-md"
                >
                  {/* ── En-tête du jour ── */}
                  <button
                    onClick={() => toggleDay(dayStr)}
                    className="w-full flex items-center justify-between p-5 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-all border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      {isOpen
                        ? <ChevronDown className="h-5 w-5 text-zinc-400" />
                        : <ChevronRight className="h-5 w-5 text-zinc-400" />}
                      <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">{dayStr}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <span className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 rounded-full text-[10px] uppercase font-black tracking-wider text-zinc-500">
                        {group.sales.length} {group.sales.length > 1 ? "Ventes" : "Vente"}
                      </span>
                      <span className="text-primary font-black text-sm">
                        {fmt(group.totalAmount)} XOF
                      </span>
                    </div>
                  </button>

                  {/* ── Tableau des transactions du jour ── */}
                  {isOpen && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-bold border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider bg-white dark:bg-zinc-900">
                            <th className="py-2.5 px-4">Ticket</th>
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
                            return (
                              <tr
                                key={sale.id}
                                className="border-b border-zinc-100/70 dark:border-zinc-800/40 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/20"
                              >
                                <td className="py-3 px-4 text-foreground font-black">
                                  {sale.receiptNumber || sale.id.slice(-6).toUpperCase()}
                                </td>
                                <td className="py-3 px-4 text-zinc-500">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 opacity-60" />
                                    {new Date(sale.createdAt).toLocaleTimeString("fr-FR", {
                                      hour: "2-digit", minute: "2-digit",
                                    })}
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
                                <td className="py-3 px-4 text-right font-black text-primary">
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
                                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"
                                    >
                                      <Printer className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => { setSelectedSale(sale); setIsConfirmOpen(true); }}
                                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-zinc-400 hover:text-red-600 transition-all"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
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

      {/* ── Modal détail panier ── */}
      <Modal
        isOpen={!!selectedSaleDetail}
        onClose={() => setSelectedSaleDetail(null)}
        title={`Détails Vente : ${selectedSaleDetail?.receiptNumber || selectedSaleDetail?.id?.slice(-6)?.toUpperCase()}`}
        size="lg"
      >
        {selectedSaleDetail && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4 text-xs font-bold bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 uppercase text-[9px] tracking-wider font-black">Date & Heure</span>
                <span className="text-foreground">
                  {new Date(selectedSaleDetail.createdAt).toLocaleDateString("fr-FR")} à{" "}
                  {new Date(selectedSaleDetail.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 uppercase text-[9px] tracking-wider font-black">Client</span>
                <span className="text-foreground">{selectedSaleDetail.customer?.name || "Client de passage"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 uppercase text-[9px] tracking-wider font-black">Mode de Paiement</span>
                <span className="text-foreground">{selectedSaleDetail.payments?.[0]?.method || "CASH"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 uppercase text-[9px] tracking-wider font-black">Montant Reçu</span>
                <span className="text-foreground">
                  {fmt(selectedSaleDetail.payments?.[0]?.amount || selectedSaleDetail.totalAmount || 0)} XOF
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4" />
                Produits Achetés (Panier)
              </h4>
              <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-bold">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[9px] text-zinc-400 uppercase tracking-widest">
                      <th className="py-2 px-3">Désignation</th>
                      <th className="py-2 px-3 text-center">Qté</th>
                      <th className="py-2 px-3 text-right">P.U.</th>
                      <th className="py-2 px-3 text-right">Réduction</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSaleDetail.items?.map((item: any, idx: number) => {
                      const qty = Number(item.quantity);
                      const pu = Number(item.unitPrice);
                      const disc = Number(item.discount || 0);
                      const tot = Number(item.totalPrice || qty * pu - disc);
                      return (
                        <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50">
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col">
                              <span className="text-foreground font-black">{item.productName || "Produit"}</span>
                              {item.productSku && <span className="text-[9px] text-zinc-400 font-mono">SKU: {item.productSku}</span>}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center text-zinc-600 dark:text-zinc-300 font-black">{qty}</td>
                          <td className="py-2.5 px-3 text-right text-zinc-600 dark:text-zinc-300">{fmt(pu)}</td>
                          <td className="py-2.5 px-3 text-right text-red-500 font-medium">-{fmt(disc)}</td>
                          <td className="py-2.5 px-3 text-right text-primary font-black">{fmt(tot)} XOF</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <div className="flex justify-between w-64 text-xs">
                <span className="text-zinc-400">Sous-total :</span>
                <span className="font-bold">{fmt(Number(selectedSaleDetail.subtotal || selectedSaleDetail.totalAmount))} XOF</span>
              </div>
              <div className="flex justify-between w-64 text-xs">
                <span className="text-zinc-400">Remise globale :</span>
                <span className="font-bold text-red-500">-{fmt(Number(selectedSaleDetail.discountAmount || 0))} XOF</span>
              </div>
              <div className="flex justify-between w-64 text-sm font-black border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-1.5 mt-1">
                <span className="text-foreground">Total payé :</span>
                <span className="text-primary">{fmt(Number(selectedSaleDetail.totalAmount || selectedSaleDetail.total))} XOF</span>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedSaleDetail(null)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          showToast("Vente annulée", "info");
          setIsConfirmOpen(false);
        }}
        title="Annuler la vente"
        message="Voulez-vous vraiment annuler cette vente ? Cette action impactera les stocks."
      />
    </AppLayout>
  );
}
