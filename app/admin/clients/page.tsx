"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import CustomerService, { Customer } from "@/services/customer.service";
import {
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Edit2,
  Trash2,
  Star,
  ShieldCheck,
  Percent,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  UserCheck,
  Users,
  TrendingUp,
  FileText
} from "lucide-react";

type TabType = "directory" | "credits";

export default function AdminClientsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("directory");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Detailed view modal state
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: "",
    phone: "",
    email: "",
    address: "",
    creditLimit: 0,
    notes: ""
  });

  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await CustomerService.getAll();
      const list = response?.data && Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
      setCustomers(list);
    } catch (error) {
      showToast("Erreur lors du chargement des clients", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleOpenModal = (customer: Customer | null = null) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        creditLimit: customer.creditLimit || 0,
        notes: customer.notes || ""
      });
    } else {
      setSelectedCustomer(null);
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        creditLimit: 0,
        notes: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      if (selectedCustomer) {
        await CustomerService.update(selectedCustomer.id, formData);
        showToast("Client mis à jour", "success");
      } else {
        await CustomerService.create(formData);
        showToast("Client créé avec succès", "success");
      }
      setIsModalOpen(false);
      loadCustomers();
    } catch (error) {
      showToast("Erreur lors de l'enregistrement", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce client ?")) return;
    try {
      await CustomerService.delete(id);
      showToast("Client supprimé avec succès", "success");
      loadCustomers();
    } catch (error) {
      showToast("Erreur lors de la suppression", "error");
    }
  };

  // Filter lists based on tab & search term
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm);
    if (activeTab === "credits") {
      return matchesSearch && c.totalDebt > 0;
    }
    return matchesSearch;
  });

  // KPI Calculations
  const totalOutstandingDebt = customers.reduce((acc, c) => acc + (c.totalDebt || 0), 0);
  const activeDebtorsCount = customers.filter(c => c.totalDebt > 0).length;
  const totalApprovedLimits = customers.reduce((acc, c) => acc + (c.creditLimit || 0), 0);

  // Column definitions for Tab 1: Directory
  const directoryColumns = [
    {
      header: "Client",
      accessor: (c: Customer) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-sm">
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-black text-zinc-900 dark:text-zinc-50">{c.name}</span>
            <div className="flex items-center gap-2 mt-0.5">
              {c.creditLimit && c.creditLimit > 0 && (
                <Badge variant="primary" className="text-[8px] px-1.5 py-0 uppercase">Premium</Badge>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      header: "Contact",
      accessor: (c: Customer) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-bold">
            <Phone className="h-3.5 w-3.5 text-zinc-400" />
            {c.phone || "---"}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold">
            <Mail className="h-3 w-3 text-zinc-400" />
            {c.email || "---"}
          </div>
        </div>
      )
    },
    {
      header: "Localisation",
      accessor: (c: Customer) => (
        <span className="text-xs text-zinc-650 dark:text-zinc-350 font-bold flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-zinc-400" />
          {c.address || "Non spécifiée"}
        </span>
      )
    },
    {
      header: "Dette Actuelle",
      accessor: (c: Customer) => (
        <span className={`font-black text-xs ${c.totalDebt > 0 ? "text-red-500" : "text-zinc-400"}`}>
          {new Intl.NumberFormat('fr-FR').format(c.totalDebt)} XOF
        </span>
      )
    },
    {
      header: "Actions",
      accessor: (c: Customer) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(c)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-primary transition-all"
            title="Modifier"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(c.id)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-red-500 transition-all"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  // Column definitions for Tab 2: Credits detailed overview
  const creditColumns = [
    {
      header: "Nom du Débiteur",
      accessor: (c: Customer) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center font-black text-sm">
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-black text-zinc-900 dark:text-zinc-50">{c.name}</span>
            <span className="text-[10px] text-zinc-400 font-bold">{c.phone || "Aucun téléphone"}</span>
          </div>
        </div>
      )
    },
    {
      header: "Encours Actuel (Dette)",
      accessor: (c: Customer) => (
        <div className="flex flex-col">
          <span className="font-black text-sm text-red-500">
            {new Intl.NumberFormat('fr-FR').format(c.totalDebt)} XOF
          </span>
          <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-black mt-0.5">
            Dette active
          </span>
        </div>
      )
    },
    {
      header: "Limite de Crédit autorisée",
      accessor: (c: Customer) => (
        <div className="flex flex-col">
          <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
            {c.creditLimit ? `${new Intl.NumberFormat('fr-FR').format(c.creditLimit)} XOF` : "Aucune limite"}
          </span>
          <span className="text-[9px] text-zinc-400 font-bold mt-0.5">
            Seuil de tolérance
          </span>
        </div>
      )
    },
    {
      header: "% D'utilisation de la Limite",
      accessor: (c: Customer) => {
        const limit = c.creditLimit || 0;
        const percent = limit > 0 ? Math.min(100, Math.round((c.totalDebt / limit) * 100)) : 0;
        let barColor = "bg-emerald-500";
        if (percent > 50) barColor = "bg-amber-500";
        if (percent > 90) barColor = "bg-red-500 animate-pulse";

        return (
          <div className="flex flex-col gap-1.5 w-40">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-zinc-500">Consommé</span>
              <span className="font-black text-zinc-800 dark:text-zinc-200">{percent}%</span>
            </div>
            <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      }
    },
    {
      header: "Indicateur de Gravité",
      accessor: (c: Customer) => {
        const limit = c.creditLimit || 0;
        const percent = limit > 0 ? (c.totalDebt / limit) * 100 : 0;
        if (percent > 90) {
          return <Badge variant="danger" className="animate-pulse">CRITIQUE (BLOQUÉ)</Badge>;
        }
        if (percent > 50) {
          return <Badge variant="warning">ALERTE RECOUVREMENT</Badge>;
        }
        return <Badge variant="success">SAIN (SOUS CONTRÔLE)</Badge>;
      }
    },
    {
      header: "Actions",
      accessor: (c: Customer) => (
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={() => {
            setDetailCustomer(c);
            setIsDetailOpen(true);
          }}
        >
          <FileText className="h-3.5 w-3.5" />
          Fiche crédit
        </Button>
      )
    }
  ];

  return (
    <AppLayout
      title="Gestion & Fidélité Clients"
      subtitle="Gestion de l'annuaire, des privilèges et du recouvrement des crédits boutiques"
    >
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
        
        {/* Tab Headers */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6">
          <button
            onClick={() => { setActiveTab("directory"); setSearchTerm(""); }}
            className={`pb-4 text-sm font-black uppercase tracking-wider relative transition-all ${
              activeTab === "directory"
                ? "text-primary border-b-2 border-primary"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="h-4.5 w-4.5" />
              Annuaire des Clients ({customers.length})
            </span>
          </button>
          <button
            onClick={() => { setActiveTab("credits"); setSearchTerm(""); }}
            className={`pb-4 text-sm font-black uppercase tracking-wider relative transition-all ${
              activeTab === "credits"
                ? "text-red-500 border-b-2 border-red-500"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            }`}
          >
            <span className="flex items-center gap-2">
              <CreditCard className="h-4.5 w-4.5" />
              Suivi Recouvrement Crédits ({activeDebtorsCount})
            </span>
          </button>
        </div>

        {/* Tab 2 Detailed Credit Analysis Dashboard widgets */}
        {activeTab === "credits" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-lg bg-gradient-to-br from-red-500/5 to-red-100/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">En-cours Total Impayé</p>
                <h3 className="text-2xl font-black text-red-500 mt-1">
                  {new Intl.NumberFormat('fr-FR').format(totalOutstandingDebt)} XOF
                </h3>
              </div>
              <div className="p-3 bg-red-500/15 text-red-500 rounded-xl">
                <TrendingUp className="h-6 w-6" />
              </div>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-amber-500/5 to-amber-100/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Débiteurs Actifs</p>
                <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {activeDebtorsCount} Clients
                </h3>
              </div>
              <div className="p-3 bg-amber-500/15 text-amber-500 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500/5 to-emerald-100/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Marge de Sécurité Globale</p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {new Intl.NumberFormat('fr-FR').format(Math.max(0, totalApprovedLimits - totalOutstandingDebt))} XOF
                </h3>
              </div>
              <div className="p-3 bg-emerald-500/15 text-emerald-500 rounded-xl">
                <UserCheck className="h-6 w-6" />
              </div>
            </Card>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 h-5 w-5" />
            <input
              type="text"
              placeholder={activeTab === "credits" ? "Filtrer les débiteurs par nom..." : "Rechercher un client..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-xs font-bold outline-none focus:border-primary shadow-sm transition-all"
            />
          </div>
          {activeTab === "directory" && (
            <Button onClick={() => handleOpenModal()} variant="primary" className="h-14 px-8 shadow-lg shadow-primary/20 w-full md:w-auto">
              <UserPlus className="h-5 w-5 mr-2" />
              Nouveau Client
            </Button>
          )}
        </div>

        {/* Data Table */}
        <Card className="overflow-hidden border-none shadow-xl">
          <DataTable
            columns={activeTab === "credits" ? creditColumns : directoryColumns}
            data={filteredCustomers}
            isLoading={loading}
          />
        </Card>
      </div>

      {/* Directory CRUD Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedCustomer ? "Modifier le client" : "Ajouter un client"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-2">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nom complet <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Jean Kouassi"
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0707..."
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="client@mail.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Adresse / Localisation</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ex: Bondoukou centre, rue 12"
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-200 dark:border-zinc-700 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h4 className="text-[10px] font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-widest">Statut & Privilèges</h4>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                Limite de Crédit (XOF)
                {!isManager && <span className="text-[8px] bg-amber-500/10 text-amber-600 px-1.5 rounded">Admin uniquement</span>}
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                  disabled={!isManager}
                  placeholder="0"
                  className={`w-full pl-11 pr-4 py-3.5 border rounded-2xl text-xs font-black outline-none transition-all ${isManager
                    ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:border-primary"
                    : "bg-zinc-100 dark:bg-zinc-800 border-transparent opacity-60 cursor-not-allowed"
                    }`}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all ${formData.creditLimit && formData.creditLimit > 0 ? "bg-amber-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400"}`}>
                <Star className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">Client VIP / Droit de Crédit</span>
                <span className="text-[10px] text-zinc-500 font-medium leading-none">Autorise le caissier à valider des impayés</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Notes internes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: Bon payeur, historique particulier..."
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all h-24 resize-none"
            />
          </div>

          <Button type="submit" variant="primary" className="h-14 font-black uppercase tracking-widest mt-2">
            {selectedCustomer ? "Mettre à jour" : "Créer le client"}
          </Button>
        </form>
      </Modal>

      {/* Credit Details Card Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Fiche Débiteur & Analyse des Crédits"
        size="lg"
      >
        {detailCustomer && (
          <div className="flex flex-col gap-6 text-xs font-bold">
            <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30">
              <div className="p-3 bg-red-500 text-white rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-zinc-800 dark:text-zinc-100">{detailCustomer.name}</h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">ID Débiteur : {detailCustomer.id}</p>
              </div>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Téléphone</span>
                <span className="text-zinc-800 dark:text-zinc-200">{detailCustomer.phone || "Non spécifié"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Email</span>
                <span className="text-zinc-800 dark:text-zinc-200">{detailCustomer.email || "Non spécifié"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Adresse</span>
                <span className="text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                  {detailCustomer.address || "Non spécifiée"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Date de création</span>
                <span className="text-zinc-850 dark:text-zinc-200">
                  {new Date(detailCustomer.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>

            {/* Credit Status Box */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Dette Globale Active</span>
                <span className="text-lg font-black text-red-500 mt-1">
                  {new Intl.NumberFormat('fr-FR').format(detailCustomer.totalDebt)} XOF
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Seuil de Tolérance Maximum</span>
                <span className="text-lg font-black text-zinc-800 dark:text-zinc-200 mt-1">
                  {detailCustomer.creditLimit ? `${new Intl.NumberFormat('fr-FR').format(detailCustomer.creditLimit)} XOF` : "Aucune limite"}
                </span>
              </div>
            </div>

            {/* Progress Visual */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Taux de Risque</span>
              {(() => {
                const limit = detailCustomer.creditLimit || 0;
                const percent = limit > 0 ? Math.min(100, Math.round((detailCustomer.totalDebt / limit) * 100)) : 0;
                let barColor = "bg-emerald-500";
                if (percent > 50) barColor = "bg-amber-500";
                if (percent > 90) barColor = "bg-red-500";

                return (
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor}`} style={{ width: `${percent}%` }} />
                    </div>
                    <span className="text-sm font-black text-zinc-850 dark:text-zinc-100 shrink-0">{percent}%</span>
                  </div>
                );
              })()}
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-2 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Historique & Notes Internes</span>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-bold text-xs">
                {detailCustomer.notes || "Aucun commentaire ou note de suivi renseignée pour ce client."}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
