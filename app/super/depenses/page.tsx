"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import ExpenseService from "@/services/expense.service";
import { Expense, ExpenseCategory } from "@/types/super";
import {
  Wallet,
  Plus,
  Search,
  ArrowDownCircle,
  Zap,
  ShoppingBag,
  Trash2,
  RefreshCw,
  Calendar
} from "lucide-react";

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: ExpenseCategory.RENT, label: "Loyer" },
  { value: ExpenseCategory.UTILITIES, label: "Eau / Électricité" },
  { value: ExpenseCategory.SALARY, label: "Salaires" },
  { value: ExpenseCategory.SUPPLIES, label: "Fournitures" },
  { value: ExpenseCategory.TRANSPORT, label: "Transport" },
  { value: ExpenseCategory.MAINTENANCE, label: "Entretien" },
  { value: ExpenseCategory.TAXES, label: "Taxes" },
  { value: ExpenseCategory.MARKETING, label: "Publicité" },
  { value: ExpenseCategory.OTHER, label: "Autres" },
];

export default function SuperDepensesPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: ExpenseCategory.OTHER,
    description: ""
  });

  const loadExpenses = async () => {
    if (!user?.shopId) return;
    setLoading(true);
    try {
      const response = await ExpenseService.getAll({ shopId: user.shopId });
      const list = response?.data && Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
      setExpenses(list);
    } catch (error) {
      showToast("Erreur lors du chargement des dépenses", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [user]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.amount) return;
    if (!user?.shopId) {
      showToast("Erreur: Votre compte n'est lié à aucune boutique.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      // ⚠️ Le backend exige shopId ET userId pour chaque dépense
      await ExpenseService.create({
        title: formData.title,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        shopId: user.shopId,
        userId: user.id, // OBLIGATOIRE — le backend rejette sans ce champ
      });
      showToast("Dépense enregistrée", "success");
      setIsModalOpen(false);
      setFormData({ title: "", amount: "", category: ExpenseCategory.OTHER, description: "" });
      loadExpenses();
    } catch (error) {
      showToast("Échec de l'enregistrement", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette dépense ?")) return;
    try {
      await ExpenseService.delete(id);
      showToast("Dépense supprimée", "success");
      loadExpenses();
    } catch (error) {
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  const columns: { header: string; accessor: keyof Expense | ((item: Expense) => React.ReactNode); className?: string }[] = [
    {
      header: "Dépense",
      accessor: (e: Expense) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">{e.title}</span>
          <span className="text-[10px] text-zinc-400 font-black uppercase tracking-tighter">
            {CATEGORIES.find(c => c.value === e.category)?.label || e.category}
          </span>
        </div>
      ),
    },
    {
      header: "Montant",
      accessor: (e: Expense) => (
        <span className="text-sm font-black text-red-500">
          -{new Intl.NumberFormat('fr-FR').format(e.amount)} XOF
        </span>
      ),
    },
    {
      header: "Date",
      accessor: (e: Expense) => (
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
          <Calendar className="h-3 w-3" />
          {new Date(e.date).toLocaleDateString("fr-FR")}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (e: Expense) => (
        <button 
          onClick={() => handleDelete(e.id)}
          className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-zinc-300 hover:text-red-500 transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
      className: "text-right",
    },
  ];

  const totalMonthly = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

  return (
    <AppLayout
      title="Dépenses Boutique"
      subtitle="Gestion des charges opérationnelles au quotidien"
      rightElement={
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Charge
        </Button>
      }
    >
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 shadow-sm border-l-4 border-l-red-500">
            <div className="p-4 bg-red-500/10 text-red-600 rounded-2xl">
              <ArrowDownCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Charges</p>
              <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50">{new Intl.NumberFormat('fr-FR').format(totalMonthly)} XOF</h4>
            </div>
          </div>
          
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 shadow-sm border-l-4 border-l-primary">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fournitures</p>
              <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                {new Intl.NumberFormat('fr-FR').format(expenses.filter(e => e.category === "SUPPLIES").reduce((acc, e) => acc + Number(e.amount), 0))} XOF
              </h4>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 shadow-sm border-l-4 border-l-amber-500">
            <div className="p-4 bg-amber-500/10 text-amber-600 rounded-2xl">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Utilités</p>
              <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                {new Intl.NumberFormat('fr-FR').format(expenses.filter(e => e.category === "UTILITIES").reduce((acc, e) => acc + Number(e.amount), 0))} XOF
              </h4>
            </div>
          </div>
        </div>

        <Card className="p-0 overflow-hidden shadow-xl border-none">
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher une dépense..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <button onClick={loadExpenses} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:text-primary transition-all">
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <DataTable columns={columns} data={filteredExpenses} isLoading={loading} />
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enregistrer une Charge">
        <div className="flex flex-col gap-5 p-2">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Libellé de la dépense</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Ex: Achat sacs plastiques" 
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Montant (FCFA)</label>
              <input 
                type="number" 
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0"
                className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Catégorie</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value as ExpenseCategory})}
                className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Notes additionnelles</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Détails facultatifs..."
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all h-24 resize-none"
            />
          </div>

          <Button variant="primary" className="h-14 mt-2 text-xs font-black uppercase tracking-widest" onClick={handleSubmit} loading={isSubmitting}>
            Enregistrer la charge
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
