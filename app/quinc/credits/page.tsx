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
import QuincCustomerService from "@/services/quinc/customer.service";
import QuincSaleService from "@/services/quinc/sale.service";
import { Customer, Sale } from "@/types/quinc";
import {
  Users,
  Search,
  DollarSign,
  AlertTriangle,
  History,
  CheckCircle,
  FileText,
  UserPlus,
} from "lucide-react";

interface CustomerWithDebt extends Customer {
  totalDebt: number;
  lastPayment: string;
  status: "Sain" | "Risqué" | "Contentieux";
}

export default function QuincCreditsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<CustomerWithDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState<Partial<Customer>>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    isActive: true
  });

  const loadData = async () => {
    if (!user?.shopId) return;
    try {
      setLoading(true);
      const [custList, salesList] = await Promise.all([
        QuincCustomerService.getAll(user.shopId),
        QuincSaleService.getAll(user.shopId)
      ]);

      // Map debts from sales
      const mapped: CustomerWithDebt[] = custList.map(c => {
        const cSales = salesList.filter(s => s.customerId === c.id && s.status === "PARTIALLY_PAID");
        const debt = cSales.reduce((acc, s) => acc + (s.finalAmount - s.paidAmount), 0);

        // Simuler un statut basé sur la dette
        let status: "Sain" | "Risqué" | "Contentieux" = "Sain";
        if (debt > 500000) status = "Contentieux";
        else if (debt > 100000) status = "Risqué";

        return {
          ...c,
          totalDebt: debt,
          lastPayment: cSales.length > 0 && cSales[0].updatedAt ? new Date(cSales[0].updatedAt).toLocaleDateString() : "Aucun",
          status
        };
      });

      setCustomers(mapped);
    } catch (error) {
      showToast("Erreur lors du chargement des clients", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSubmit = async () => {
    if (!user?.shopId) return;
    try {
      await QuincCustomerService.create({
        ...formData,
        shopId: user.shopId
      });
      showToast("Client enregistré", "success");
      setIsModalOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        address: "",
        isActive: true
      });
      loadData();
    } catch (error) {
      showToast("Erreur lors de la création", "error");
    }
  };

  const filtered = customers.filter((c) =>
    c.firstName.toLowerCase().includes(search.toLowerCase()) ||
    (c.lastName && c.lastName.toLowerCase().includes(search.toLowerCase())) ||
    c.phone.includes(search)
  );

  const totalDebts = customers.reduce((acc, c) => acc + c.totalDebt, 0);

  const columns = [
    {
      header: "Client / Chantier",
      accessor: (c: CustomerWithDebt) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground">{c.firstName} {c.lastName}</span>
          <span className="text-[10px] text-zinc-400 font-bold">{c.phone}</span>
        </div>
      ),
    },
    {
      header: "Dette Totale",
      accessor: (c: CustomerWithDebt) => (
        <span className={`text-sm font-black ${c.totalDebt > 0 ? "text-red-600" : "text-emerald-600"}`}>
          {c.totalDebt.toLocaleString()} FCFA
        </span>
      ),
    },
    {
      header: "Statut",
      accessor: (c: CustomerWithDebt) => {
        const variants: any = {
          Sain: "success",
          Risqué: "warning",
          Contentieux: "danger",
        };
        return <Badge variant={variants[c.status]}>{c.status}</Badge>;
      },
    },
    {
      header: "Dernier Versement",
      accessor: (c: CustomerWithDebt) => (
        <span className="text-xs font-bold text-zinc-500">{c.lastPayment}</span>
      ),
    },
    {
      header: "Actions",
      accessor: (c: CustomerWithDebt) => (
        <div className="flex items-center gap-2 justify-end">
          <Button variant="primary" size="sm" className="h-8 px-2" onClick={() => showToast("Fonction d'encaissement en développement", "info")} disabled={c.totalDebt === 0}>
            <DollarSign className="h-3.5 w-3.5 mr-1.5" />
            Encaisser
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-2">
            <History className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <AppLayout
      title="Crédits & Clients"
      subtitle="Suivi des impayés et recouvrement"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nouveau Compte Client
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-red-600">
            <div className="p-3 bg-red-600/10 text-red-600 rounded-2xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Créances Dehors</p>
              <h4 className="text-xl font-black text-foreground">{loading ? "..." : `${totalDebts.toLocaleString()} FCFA`}</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-emerald-600">
            <div className="p-3 bg-emerald-600/10 text-emerald-600 rounded-2xl">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Recouvrements (Mois)</p>
              <h4 className="text-xl font-black text-foreground">0 FCFA</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-primary">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Clients Actifs</p>
              <h4 className="text-xl font-black text-foreground">{loading ? "..." : customers.length}</h4>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher un client ou chantier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
          <DataTable columns={columns} data={filtered} isLoading={loading} />
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau Client Quinc.">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Nom / Raison Sociale</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Prénoms / Contact</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Téléphone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Adresse / Localisation</label>
            <input
              type="text"
              value={formData.address || ""}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
            />
          </div>
          <Button variant="primary" className="mt-2" onClick={handleSubmit}>Créer le compte</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
