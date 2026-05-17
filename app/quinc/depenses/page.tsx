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
import QuincExpenseService from "@/services/quinc/expense.service";
import { Expense } from "@/types/quinc";
import {
  Wallet,
  Plus,
  Search,
  Receipt,
  ArrowDownCircle,
  Truck,
  Zap,
  Home,
  Tag,
  Trash2
} from "lucide-react";

export default function QuincDepensesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState<Partial<Expense>>({
    title: "",
    category: "OTHER",
    amount: 0,
    paymentMethod: "CASH",
    date: new Date().toISOString().split("T")[0]
  });

  const loadData = async () => {
    if (!user?.shopId) return;
    try {
      setLoading(true);
      const data = await QuincExpenseService.getAll(user.shopId);
      setExpenses(data);
    } catch (error) {
      showToast("Erreur lors du chargement des dépenses", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSubmit = async () => {
    console.log("handleSubmit clicked. User:", user, "formData:", formData);
    if (!user?.shopId) {
      showToast("Boutique non identifiée. Veuillez vous reconnecter.", "error");
      return;
    }
    try {
      await QuincExpenseService.create({
        ...formData,
        shopId: user.shopId,
        userId: user.id
      });
      showToast("Dépense enregistrée", "success");
      setIsModalOpen(false);
      setFormData({
        title: "",
        category: "OTHER",
        amount: 0,
        paymentMethod: "CASH",
        date: new Date().toISOString().split("T")[0]
      });
      loadData();
    } catch (error: any) {
      console.error("Error creating expense:", error);
      showToast(error?.response?.data?.message || "Erreur lors de l'enregistrement", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous supprimer cette dépense ?")) return;
    try {
      await QuincExpenseService.delete(id);
      showToast("Dépense supprimée", "success");
      loadData();
    } catch (error) {
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const getCategoryLabel = (cat: string) => {
    const map: any = {
      RENT: "Loyer",
      UTILITIES: "Utilités",
      TRANSPORT: "Logistique",
      SALARY: "Salaires",
      OTHER: "Divers",
    };
    return map[cat] || cat;
  };

  const filtered = expenses.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalCharges = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalLogistique = expenses.filter(e => e.category === "TRANSPORT").reduce((acc, e) => acc + e.amount, 0);
  const totalLoyer = expenses.filter(e => e.category === "RENT").reduce((acc, e) => acc + e.amount, 0);
  const totalUtilities = expenses.filter(e => e.category === "UTILITIES").reduce((acc, e) => acc + e.amount, 0);

  const columns = [
    {
      header: "Libellé de la dépense",
      accessor: (e: Expense) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground">{e.title}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">{getCategoryLabel(e.category)}</span>
        </div>
      ),
    },
    {
      header: "Montant",
      accessor: (e: Expense) => (
        <span className="text-sm font-black text-red-500">
          -{e.amount.toLocaleString()} FCFA
        </span>
      ),
    },
    {
      header: "Date",
      accessor: (e: Expense) => (
        <span className="text-xs font-bold text-zinc-500">{new Date(e.date).toLocaleDateString()}</span>
      ),
    },
    {
      header: "Méthode",
      accessor: (e: Expense) => (
        <Badge variant="outline">{e.paymentMethod}</Badge>
      ),
    },
    {
      header: "Actions",
      accessor: (e: Expense) => (
        <button onClick={() => handleDelete(e.id)} className="text-zinc-400 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      ),
      className: "text-right"
    }
  ];

  return (
    <AppLayout
      title="Dépenses & Charges"
      subtitle="Suivi des coûts opérationnels Quincaillerie"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Dépense
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 flex flex-col gap-2">
            <div className="p-2 w-fit bg-red-500/10 text-red-600 rounded-xl">
              <ArrowDownCircle className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Charges</p>
            <h4 className="text-lg font-black text-foreground">{loading ? "..." : `${totalCharges.toLocaleString()} FCFA`}</h4>
          </Card>
          <Card className="p-4 flex flex-col gap-2">
            <div className="p-2 w-fit bg-primary/10 text-primary rounded-xl">
              <Truck className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Frais Logistique</p>
            <h4 className="text-lg font-black text-foreground">{loading ? "..." : `${totalLogistique.toLocaleString()} FCFA`}</h4>
          </Card>
          <Card className="p-4 flex flex-col gap-2">
            <div className="p-2 w-fit bg-amber-500/10 text-amber-600 rounded-xl">
              <Home className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Loyers & Taxes</p>
            <h4 className="text-lg font-black text-foreground">{loading ? "..." : `${totalLoyer.toLocaleString()} FCFA`}</h4>
          </Card>
          <Card className="p-4 flex flex-col gap-2">
            <div className="p-2 w-fit bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Zap className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Utilités (CIE/SODECI)</p>
            <h4 className="text-lg font-black text-foreground">{loading ? "..." : `${totalUtilities.toLocaleString()} FCFA`}</h4>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher une dépense..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
          <DataTable columns={columns} data={filtered} isLoading={loading} />
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enregistrer une dépense">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Libellé</label>
            <input
              type="text"
              placeholder="Ex: Achat carburant"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Catégorie</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
              >
                <option value="TRANSPORT">Logistique</option>
                <option value="RENT">Loyer</option>
                <option value="UTILITIES">Utilités</option>
                <option value="SALARY">Salaires</option>
                <option value="OTHER">Divers</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Montant (FCFA)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
              />
            </div>
          </div>
          <Button variant="primary" className="mt-2" onClick={handleSubmit}>Valider la dépense</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
