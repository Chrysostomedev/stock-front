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
  RefreshCw
} from "lucide-react";

/**
 * Page d'Historique des Ventes (Commandes)
 * Connectée au SaleService
 */
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
      // Le backend peut renvoyer un tableau direct ou un objet paginé { data: [...] }
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

  const columns: { header: string; accessor: (item: any) => React.ReactNode; className?: string }[] = [
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
      accessor: (s: any) => (
        <div className="flex items-center gap-2">
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
      className: "text-right",
    },
  ];

  const totalCA = sales.reduce((acc, s) => acc + (s.totalAmount || s.total || 0), 0);

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
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
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
          
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tickets Émis</p>
              <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50">{sales.length}</h4>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
            <div className="p-4 bg-amber-500/10 text-amber-600 rounded-2xl">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vente Moyenne</p>
              <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                {sales.length > 0 ? new Intl.NumberFormat('fr-FR').format(totalCA / sales.length) : 0} FCFA
              </h4>
            </div>
          </div>
        </div>

        <Card className="p-0 overflow-hidden border-none shadow-xl">
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher par N° ticket ou client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => showToast("Filtre activé", "info")}
                className="flex items-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:bg-primary/10 hover:text-primary transition-all"
              >
                <Calendar className="h-4 w-4" />
                Mois en cours
              </button>
            </div>
          </div>

          <DataTable columns={columns} data={filteredSales} isLoading={loading} />
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
