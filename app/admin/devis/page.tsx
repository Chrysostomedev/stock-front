"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import ShopService, { Shop } from "@/services/shop.service";
import ProductService from "@/services/product.service";
import SaleService from "@/services/sale.service";
import {
  FileText,
  Search,
  Printer,
  TrendingUp,
  Building2,
  RefreshCw
} from "lucide-react";

interface DocumentItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Document {
  id: string;
  shopId: string;
  type: "Client" | "Fournisseur";
  customer: string;
  date: string;
  amount: number;
  status: "Brouillon" | "Envoyé" | "Payé" | "Expiré";
  delay: number;
  items: DocumentItem[];
}

export default function AdminDevisPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [docs, setDocs] = useState<Document[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // View Modal Details
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<Document | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const shopRes = await ShopService.getAll();
      const activeShops = Array.isArray(shopRes) ? shopRes : shopRes?.data || [];
      setShops(activeShops);

      const dynamicDocs: Document[] = [];

      // Load live sales from each shop
      await Promise.all(
        activeShops.map(async (shop: Shop) => {
          try {
            const prodRes = await ProductService.getAll({ shopId: shop.id });
            const prods = Array.isArray(prodRes) ? prodRes : prodRes?.data || [];

            const saleRes = await SaleService.getAll({ shopId: shop.id });
            const sales = Array.isArray(saleRes) ? saleRes : saleRes?.data || [];

            sales.forEach((sale: any) => {
              const items = sale.items || [];
              const docItems: DocumentItem[] = items.map((item: any) => {
                const p = prods.find((prod: any) => prod.id === item.productId);
                return {
                  productId: item.productId,
                  name: p ? p.name : "Article Boutique",
                  quantity: item.quantity || 0,
                  price: item.unitPrice || 0
                };
              });

              const hasCredit = sale.payments?.some((p: any) => p.method?.includes("CREDIT"));

              dynamicDocs.push({
                id: `BC-2026-${sale.id.slice(0, 5).toUpperCase()}`,
                shopId: shop.id,
                type: hasCredit ? "Client" : "Client",
                customer: sale.customer?.name || "Client Comptoir",
                date: new Date(sale.createdAt || sale.date).toISOString().split("T")[0],
                amount: sale.finalAmount || sale.totalAmount || 0,
                status: sale.isActive === false ? "Expiré" : hasCredit ? "Envoyé" : "Payé",
                delay: 30,
                items: docItems
              });
            });
          } catch (err) {
            console.error(`Error loading sales for shop ${shop.name}:`, err);
          }
        })
      );

      setDocs(dynamicDocs);
    } catch (error) {
      showToast("Erreur lors du chargement des documents commerciaux", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Payé":
        return <Badge variant="success">{status}</Badge>;
      case "Envoyé":
        return <Badge variant="primary">{status}</Badge>;
      case "Brouillon":
        return <Badge variant="warning">{status}</Badge>;
      default:
        return <Badge variant="danger">{status}</Badge>;
    }
  };

  const filteredDocs = docs.filter(d =>
    d.id.toLowerCase().includes(search.toLowerCase()) ||
    d.customer.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: "Référence Bon",
      accessor: (item: Document) => (
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="font-black text-zinc-800 dark:text-zinc-100">{item.id}</p>
            <p className="text-[10px] text-zinc-400">Date: {item.date}</p>
          </div>
        </div>
      )
    },
    {
      header: "Point de Vente",
      accessor: (item: Document) => {
        const matched = shops.find(s => s.id === item.shopId);
        return (
          <span className="text-xs font-bold text-zinc-500">
            {matched ? matched.name : "Global / Non défini"}
          </span>
        );
      }
    },
    {
      header: "Type",
      accessor: (item: Document) => (
        <Badge variant={item.type === "Client" ? "primary" : "secondary"}>
          Bon {item.type}
        </Badge>
      )
    },
    {
      header: "Partenaire / Client",
      accessor: (item: Document) => (
        <div className="text-xs">
          <p className="font-bold text-zinc-700 dark:text-zinc-300">{item.customer}</p>
          <p className="text-[10px] text-zinc-400">Validité: {item.delay} jours</p>
        </div>
      )
    },
    {
      header: "Montant Total",
      accessor: (item: Document) => (
        <span className="font-black text-zinc-850 dark:text-zinc-100 font-mono text-xs">
          {item.amount.toLocaleString()} XOF
        </span>
      )
    },
    {
      header: "Statut",
      accessor: (item: Document) => getStatusBadge(item.status)
    },
    {
      header: "Actions",
      accessor: (item: Document) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => { setViewDoc(item); setIsViewOpen(true); }}
        >
          Consulter
        </Button>
      )
    }
  ];

  return (
    <AppLayout
      title="Bons de Commande Globaux"
      subtitle="Supervision de l'ensemble des devis, bons client et fournisseur émis par les boutiques"
      rightElement={
        <Button onClick={loadData} variant="secondary" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* KPI Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="flex items-center justify-between border-none shadow-lg bg-gradient-to-br from-indigo-500/10 to-indigo-100/5">
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total des documents</p>
              <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 mt-1">
                {docs.length} Bons
              </h3>
            </div>
            <div className="p-3 bg-indigo-500/15 rounded-xl text-indigo-500">
              <FileText className="h-5 w-5" />
            </div>
          </Card>

          <Card className="flex items-center justify-between border-none shadow-lg bg-gradient-to-br from-emerald-500/10 to-emerald-100/5">
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Valeur cumulée brute</p>
              <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 mt-1">
                {docs.reduce((acc, d) => acc + d.amount, 0).toLocaleString()} XOF
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/15 rounded-xl text-emerald-500">
              <TrendingUp className="h-5 w-5" />
            </div>
          </Card>

          <Card className="flex items-center justify-between border-none shadow-lg bg-gradient-to-br from-amber-500/10 to-amber-100/5">
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Bons Clients validés</p>
              <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 mt-1">
                {docs.filter(d => d.type === "Client").length} Bons
              </h3>
            </div>
            <div className="p-3 bg-amber-500/15 rounded-xl text-amber-500">
              <Building2 className="h-5 w-5" />
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4 border-none shadow-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher par référence ou partenaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>
        </Card>

        {/* Table list */}
        <Card className="overflow-hidden border-none shadow-xl">
          <DataTable
            columns={columns}
            data={filteredDocs}
            isLoading={loading}
          />
        </Card>
      </div>

      {/* Consult View Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Consultation du Bon de Commande"
        size="lg"
      >
        {viewDoc && (
          <div className="flex flex-col gap-6 print:p-0">
            {/* Sheet header */}
            <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-black text-zinc-850 dark:text-zinc-100 uppercase tracking-wider">
                  BON DE COMMANDE ({viewDoc.type})
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Réf: {viewDoc.id} | Émis le: {viewDoc.date}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                  {shops.find(s => s.id === viewDoc.shopId)?.name || "Boutique"}
                </p>
                <p className="text-[10px] text-zinc-400">Côte d'Ivoire</p>
              </div>
            </div>

            {/* Partner / Conditions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
              <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl">
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Destinataire / Partenaire</p>
                <p className="text-zinc-800 dark:text-zinc-200">{viewDoc.customer}</p>
                <p className="text-[10px] text-zinc-400 mt-1">Côte d'Ivoire</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl">
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Détails & Conditions</p>
                <p className="text-zinc-650 dark:text-zinc-300">Validité: {viewDoc.delay} jours</p>
                <p className="text-zinc-650 dark:text-zinc-300">Statut actuel: {viewDoc.status}</p>
              </div>
            </div>

            {/* Articles Details */}
            <div className="overflow-hidden border border-zinc-150 dark:border-zinc-800 rounded-xl">
              <table className="w-full text-left text-xs font-bold">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-150 dark:border-zinc-850 text-zinc-400 text-[10px] uppercase tracking-wider">
                    <th className="p-3">Désignation Matériau</th>
                    <th className="p-3 text-center">Quantité</th>
                    <th className="p-3 text-right">Prix Unitaire</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {viewDoc.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-black text-zinc-855 dark:text-zinc-100">{item.name}</td>
                      <td className="p-3 text-center font-mono">{item.quantity}</td>
                      <td className="p-3 text-right font-mono">{item.price.toLocaleString()} XOF</td>
                      <td className="p-3 text-right font-mono text-zinc-900 dark:text-zinc-50">
                        {(item.quantity * item.price).toLocaleString()} XOF
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-50/50 dark:bg-zinc-850/20 font-black text-zinc-800 dark:text-zinc-100 border-t border-zinc-200 dark:border-zinc-700">
                    <td colSpan={3} className="p-3 text-right uppercase tracking-wider text-[10px] text-zinc-400">Montant Total Net</td>
                    <td className="p-3 text-right text-indigo-500 font-mono text-sm">{viewDoc.amount.toLocaleString()} XOF</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Actions for print */}
            <div className="flex justify-end gap-3 print:hidden">
              <Button variant="secondary" onClick={() => setIsViewOpen(false)}>
                Fermer
              </Button>
              <Button variant="primary" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Imprimer le Bon
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}