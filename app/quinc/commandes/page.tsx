"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import QuincSaleService from "@/services/quinc/sale.service";
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
  Eye,
  ShoppingBag
} from "lucide-react";

export default function QuincCommandesPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<any>(null);

  const loadSales = async () => {
    if (!user?.shopId) return;
    setLoading(true);
    try {
      const response = await QuincSaleService.getAll(user.shopId);
      setSales(response || []);
    } catch (error) {
      showToast("Erreur lors du chargement des ventes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [user]);

  const filteredSales = sales.filter((s) => {
    return (s.id && s.id.toLowerCase().includes(search.toLowerCase())) || 
           (s.receiptNumber && s.receiptNumber.toLowerCase().includes(search.toLowerCase())) ||
           (s.customer?.name && s.customer.name.toLowerCase().includes(search.toLowerCase()));
  });

  const totalCA = sales.reduce((acc, s) => acc + (s.totalAmount || s.total || 0), 0);

  return (
    <AppLayout
      title="Historique des Ventes"
      subtitle="Journal détaillé des ventes de matériaux et outils de la Quincaillerie"
      rightElement={
        <button 
          onClick={loadSales}
          className="p-3 bg-zinc-105 dark:bg-zinc-800 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-150 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
            <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Chiffre d'Affaires</p>
              <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                {new Intl.NumberFormat('fr-FR').format(totalCA)} FCFA
              </h4>
            </div>
          </div>
          
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-150 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Bons émis</p>
              <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50">{sales.length}</h4>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-150 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
            <div className="p-4 bg-amber-500/10 text-amber-600 rounded-2xl">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vente Moyenne</p>
              <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                {sales.length > 0 ? new Intl.NumberFormat('fr-FR').format(Math.round(totalCA / sales.length)) : 0} FCFA
              </h4>
            </div>
          </div>
        </div>

        <Card className="p-0 overflow-hidden border border-zinc-150 dark:border-zinc-800 shadow-xl">
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-55/20">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher par N° ticket ou client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/5 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => showToast("Filtre mensuel activé", "info")}
                className="flex items-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
              >
                <Calendar className="h-4 w-4" />
                Mois en cours
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
              Chargement des ventes...
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="py-20 text-center text-zinc-400 font-bold text-sm">
              Aucune vente trouvée
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold">
                <thead>
                  <tr className="border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[10px] text-zinc-400 uppercase tracking-widest">
                    <th className="py-3 px-6">N° Vente</th>
                    <th className="py-3 px-6">Client</th>
                    <th className="py-3 px-6">Date</th>
                    <th className="py-3 px-6">Paiement</th>
                    <th className="py-3 px-6 text-right">Montant</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((s) => {
                    const method = s.payments?.[0]?.method || "CASH";
                    return (
                      <tr key={s.id} className="border-b border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-zinc-400" />
                            <span className="font-black text-zinc-900 dark:text-zinc-50">
                              {s.receiptNumber || s.id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-zinc-600 dark:text-zinc-400">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 opacity-60" />
                            <span>{s.customer?.name || "Client de passage"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-zinc-900 dark:text-zinc-50">
                          <div className="flex flex-col">
                            <span>{new Date(s.createdAt).toLocaleDateString("fr-FR")}</span>
                            <span className="text-[10px] text-zinc-400 font-bold">
                              {new Date(s.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant={method === "CASH" ? "success" : "primary"} className="uppercase text-[9px] tracking-wider">
                            {method}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right text-primary font-black text-sm">
                          {new Intl.NumberFormat('fr-FR').format(s.totalAmount || s.total || 0)} XOF
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="py-1.5 px-3 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                              onClick={() => setSelectedSale(s)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Détails
                            </Button>
                            <button 
                              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"
                              onClick={() => showToast("Impression du bon en cours...", "info")}
                            >
                              <Printer className="h-4 w-4" />
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
      </div>

      {/* Sale detail basket modal */}
      <Modal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title={`Vente N° : ${selectedSale?.receiptNumber || selectedSale?.id?.slice(-6)?.toUpperCase()}`}
        size="lg"
      >
        {selectedSale && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4 text-xs font-bold bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 uppercase text-[9px] tracking-wider font-black">Date de transaction</span>
                <span className="text-foreground">
                  {new Date(selectedSale.createdAt).toLocaleDateString("fr-FR")} à{" "}
                  {new Date(selectedSale.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 uppercase text-[9px] tracking-wider font-black">Client</span>
                <span className="text-foreground">{selectedSale.customer?.name || "Client de passage"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 uppercase text-[9px] tracking-wider font-black">Mode de Paiement</span>
                <span className="text-foreground">{selectedSale.payments?.[0]?.method || "CASH"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 uppercase text-[9px] tracking-wider font-black">Référence</span>
                <span className="text-foreground font-mono">{selectedSale.payments?.[0]?.reference || "Aucune"}</span>
              </div>
            </div>

            {/* Product items table */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4" />
                Matériaux & Produits achetés
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
                    {selectedSale.items && selectedSale.items.map((item: any, idx: number) => {
                      const qty = Number(item.quantity);
                      const price = Number(item.unitPrice);
                      const disc = Number(item.discount || 0);
                      const tot = Number(item.totalPrice || (qty * price - disc));

                      return (
                        <tr key={idx} className="border-b border-zinc-105 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-850/50">
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col">
                              <span className="text-foreground font-black">{item.productName || "Matériau"}</span>
                              {item.productSku && <span className="text-[9px] text-zinc-400 font-mono">SKU: {item.productSku}</span>}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center text-zinc-600 dark:text-zinc-300 font-black">{qty}</td>
                          <td className="py-2.5 px-3 text-right text-zinc-600 dark:text-zinc-300">{new Intl.NumberFormat('fr-FR').format(price)}</td>
                          <td className="py-2.5 px-3 text-right text-red-500 font-medium">-{new Intl.NumberFormat('fr-FR').format(disc)}</td>
                          <td className="py-2.5 px-3 text-right text-primary font-black">{new Intl.NumberFormat('fr-FR').format(tot)} FCFA</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex flex-col items-end gap-1.5 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <div className="flex justify-between w-64 text-xs">
                <span className="text-zinc-400">Sous-total :</span>
                <span className="font-bold">{new Intl.NumberFormat('fr-FR').format(Number(selectedSale.subtotal || selectedSale.totalAmount))} XOF</span>
              </div>
              <div className="flex justify-between w-64 text-xs">
                <span className="text-zinc-400">Remise globale :</span>
                <span className="font-bold text-red-500">-{new Intl.NumberFormat('fr-FR').format(Number(selectedSale.discountAmount || 0))} XOF</span>
              </div>
              <div className="flex justify-between w-64 text-sm font-black border-t border-dashed border-zinc-250 dark:border-zinc-700 pt-1.5 mt-1">
                <span className="text-foreground">Total payé :</span>
                <span className="text-primary">{new Intl.NumberFormat('fr-FR').format(Number(selectedSale.totalAmount || selectedSale.total))} FCFA</span>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedSale(null)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
