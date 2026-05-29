"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import ConfirmModal from "@/components/ui/ConfirmModal";
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
} from "lucide-react";

export default function SuperCommandesPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);

  const loadSales = async () => {
    if (!user?.shopId) return;
    setLoading(true);
    try {
      const response = await SaleService.getAll({ shopId: user.shopId });
      const list = response.data && Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
      setSales(list);
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
           (s.customer?.name && s.customer.name.toLowerCase().includes(search.toLowerCase()));
  });

  // Colonnes pour la version Ordinateur / Tablette large
  const columns = [
    {
      header: "N° Vente",
      accessor: (s: any) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-zinc-400" />
          <span className="font-black text-zinc-900 dark:text-zinc-50">{s.id.slice(-6).toUpperCase()}</span>
        </div>
      ),
    },
    {
      header: "Client",
      accessor: (s: any) => (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-zinc-400" />
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
            {s.customer?.name || "Client de passage"}
          </span>
        </div>
      ),
    },
    {
      header: "Date",
      accessor: (s: any) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
            {new Date(s.createdAt).toLocaleDateString("fr-FR")}
          </span>
          <span className="text-[10px] text-zinc-400 font-bold">
            {new Date(s.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ),
    },
    {
      header: "Montant",
      accessor: (s: any) => (
        <span className="text-primary font-black">
          {new Intl.NumberFormat('fr-FR').format(s.totalAmount || s.total || 0)} XOF
        </span>
      ),
    },
    {
      header: "Paiement",
      accessor: (s: any) => {
        const method = s.payments?.[0]?.method || "CASH";
        return (
          <Badge variant={method === "CASH" ? "success" : "primary"} className="uppercase text-[9px]">
            {method}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      className: "text-right",
      accessor: (s: any) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"
            onClick={() => showToast("Impression en cours...", "info")}
          >
            <Printer className="h-4 w-4" />
          </button>
          <button 
            onClick={() => { setSelectedSale(s); setIsConfirmOpen(true); }}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-zinc-400 hover:text-red-600 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];
  const totalCA = sales.reduce((acc, s) => acc + Number(s.totalAmount || s.total || 0), 0);
  const venteMoyenne = sales.length > 0 ? Math.round(totalCA / sales.length) : 0;
  return (
    <AppLayout
      title="Historique des Ventes"
      subtitle="Journal détaillé des transactions de votre boutique"
      rightElement={
        <button 
          onClick={loadSales}
          className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="flex flex-col gap-4 sm:gap-6 max-w-7xl mx-auto pb-12 px-2 sm:px-0">
        {/*  Section Indicateurs / KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-100 dark:border-zinc-800/50 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl sm:rounded-2xl shrink-0">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Chiffre d'Affaires</p>
              <h4 className="text-base sm:text-xl font-black text-zinc-900 dark:text-zinc-50 truncate">
                {new Intl.NumberFormat('fr-FR').format(totalCA)} <span className="text-[10px] font-medium text-zinc-400">XOF</span>
              </h4>
            </div>
          </div>
          <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-100 dark:border-zinc-800/50 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-primary/10 text-primary rounded-xl sm:rounded-2xl shrink-0">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tickets Émis</p>
              <h4 className="text-base sm:text-xl font-black text-zinc-900 dark:text-zinc-50">{sales.length}</h4>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-100 dark:border-zinc-800/50 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl sm:rounded-2xl shrink-0">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vente Moyenne</p>
              <h4 className="text-base sm:text-xl font-black text-zinc-900 dark:text-zinc-50 truncate">
                {new Intl.NumberFormat('fr-FR').format(venteMoyenne)} <span className="text-[10px] font-medium text-zinc-400">XOF</span>
              </h4>
            </div>
          </div>
        </div>

        {/*  Zone Recherche & Contenu Principal */}
        <Card className="p-0 overflow-hidden border-none shadow-xl bg-white dark:bg-zinc-900">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher un ticket..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 sm:py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl sm:rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all shadow-sm"
              />
            </div>
            <div className="w-full sm:w-auto">
              <button 
                onClick={() => showToast("Filtre activé", "info")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:bg-primary/10 hover:text-primary transition-all"
              >
                <Calendar className="h-3.5 w-3.5" />
                Mois en cours
              </button>
            </div>
          </div>

          {/* 💻 RENDU ORDINATEUR : Vrai tableau visible dès l'écran MD (Tablette+) */}
          <div className="hidden md:block w-full">
            <DataTable columns={columns} data={filteredSales} isLoading={loading} />
          </div>

          {/* 📱 RENDU MOBILE-FIRST : Remplacé par une liste de cartes épurées et ultra-rapides */}
          <div className="block md:hidden w-full divide-y divide-zinc-100 dark:divide-zinc-800">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : filteredSales.length > 0 ? (
              filteredSales.map((s, idx) => {
                const method = s.payments?.[0]?.method || "CASH";
                return (
                  <div key={idx} className="p-4 flex items-center justify-between bg-white dark:bg-zinc-900 active:bg-zinc-50 dark:active:bg-zinc-800/50 transition-colors">
                    {/* Infos Gauche */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-500 shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-sm text-zinc-900 dark:text-zinc-50">#{s.id.slice(-6).toUpperCase()}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${method === "CASH" ? "bg-emerald-500" : "bg-primary"}`}></span>
                        </div>
                        <span className="text-[11px] font-bold text-zinc-500 truncate mb-0.5">
                          {s.customer?.name || "Client de passage"}
                        </span>
                        <span className="text-[10px] font-medium text-zinc-400">
                          {new Date(s.createdAt).toLocaleDateString("fr-FR")} à {new Date(s.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Infos Droite & Actions rapides */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-primary">
                          {new Intl.NumberFormat('fr-FR').format(s.totalAmount || s.total || 0)} F
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                          {/* Bouton imprimer mobile */}
                          <button 
                            onClick={() => showToast("Impression en cours...", "info")}
                            className="p-1.5 text-zinc-400 hover:text-primary active:scale-95 transition-all"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          {/* Bouton supprimer mobile */}
                          <button 
                            onClick={() => { setSelectedSale(s); setIsConfirmOpen(true); }}
                            className="p-1.5 text-zinc-400 hover:text-red-500 active:scale-95 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs font-bold text-zinc-400">
                Aucune vente trouvée
              </div>
            )}
          </div>

        </Card>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          showToast("Vente annulée", "info");
          setIsConfirmOpen(false);
        }}
        title="Annuler la vente"
        message={`Voulez-vous vraiment annuler cette vente ? Cette action impactera les stocks.`}
      />
    </AppLayout>
  );
}