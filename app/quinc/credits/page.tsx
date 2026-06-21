"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import QuincCustomerService from "@/services/quinc/customer.service";
import CustomerService, { Customer } from "@/services/customer.service";
import QuincSaleService from "@/services/quinc/sale.service";
import {
  Users,
  Search,
  DollarSign,
  AlertTriangle,
  History,
  CheckCircle,
  UserPlus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  TrendingUp,
  UserCheck,
} from "lucide-react";

type TabType = "directory" | "credits";

interface CustomerWithDebt extends Customer {
  status: "Sain" | "Risqué" | "Contentieux";
  lastPayment: string;
}

export default function QuincCreditsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>("directory");
  const [customers, setCustomers] = useState<CustomerWithDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: "",
    phone: "",
    email: "",
    address: "",
    creditLimit: 0,
    notes: "",
  });

  const loadData = async () => {
    if (!user?.shopId) return;
    try {
      setLoading(true);
      const [custList, salesList] = await Promise.all([
        QuincCustomerService.getAll(user.shopId),
        QuincSaleService.getAll(user.shopId),
      ]);

      const mapped: CustomerWithDebt[] = (custList as any[]).map((c: any) => {
        const cSales = salesList.filter(
          (s) => s.customerId === c.id && s.status === "PARTIALLY_PAID"
        );
        const debt =
          c.totalDebt ??
          cSales.reduce((acc, s) => acc + ((s.finalAmount || 0) - (s.paidAmount || 0)), 0);

        let status: "Sain" | "Risqué" | "Contentieux" = "Sain";
        if (debt > 500000) status = "Contentieux";
        else if (debt > 100000) status = "Risqué";

        const lastSale = cSales.sort(
          (a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime()
        )[0];

        return {
          ...c,
          name: c.name ?? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim(),
          totalDebt: debt,
          lastPayment: lastSale?.updatedAt
            ? new Date(lastSale.updatedAt).toLocaleDateString("fr-FR")
            : "Aucun",
          status,
        } as CustomerWithDebt;
      });

      setCustomers(mapped);
    } catch {
      showToast("Erreur lors du chargement des clients", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleOpenModal = (customer: Customer | null = null) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        creditLimit: customer.creditLimit || 0,
        notes: customer.notes || "",
      });
    } else {
      setSelectedCustomer(null);
      setFormData({ name: "", phone: "", email: "", address: "", creditLimit: 0, notes: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      showToast("Le nom du client est requis", "error");
      return;
    }
    try {
      if (selectedCustomer) {
        const updated = await CustomerService.update(selectedCustomer.id, formData);
        setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, ...updated } : c));
        showToast("Client mis à jour", "success");
      } else {
        const created = await QuincCustomerService.create({ ...formData, shopId: user?.shopId } as any);
        // Nouveau client : aucune vente donc dette = 0 et statut sain
        setCustomers(prev => [{ ...created, name: created.firstName + (created.lastName ? ` ${created.lastName}` : ""), totalDebt: 0, status: "Sain" as const, lastPayment: "Aucun" } as unknown as CustomerWithDebt, ...prev]);
        showToast("Client créé avec succès", "success");
      }
      setIsModalOpen(false);
    } catch {
      showToast("Erreur lors de l'enregistrement", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce client ?")) return;
    try {
      await CustomerService.delete(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      showToast("Client supprimé", "success");
    } catch {
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      (c.name ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").includes(search);
    if (activeTab === "credits") return matchSearch && c.totalDebt > 0;
    return matchSearch;
  });

  const totalDebts = customers.reduce((acc, c) => acc + Number(c.totalDebt || 0), 0);
  const activeDebtors = customers.filter((c) => c.totalDebt > 0).length;

  const directoryColumns = [
    {
      header: "Client / Chantier",
      accessor: (c: CustomerWithDebt) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center font-black text-sm shrink-0">
            {(c.name ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-foreground">{c.name}</span>
            <span className="text-[10px] text-zinc-400 font-bold">{c.phone || "—"}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Contact",
      accessor: (c: CustomerWithDebt) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-bold">
            <Mail className="h-3 w-3 text-zinc-400" />
            {c.email || "—"}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold">
            <MapPin className="h-3 w-3 text-zinc-400" />
            {c.address || "—"}
          </div>
        </div>
      ),
    },
    {
      header: "Dette",
      accessor: (c: CustomerWithDebt) => (
        <span className={`text-sm font-black ${c.totalDebt > 0 ? "text-red-600" : "text-emerald-600"}`}>
          {Number(c.totalDebt || 0).toLocaleString("fr-FR")} FCFA
        </span>
      ),
    },
    {
      header: "Statut",
      accessor: (c: CustomerWithDebt) => {
        const variants: Record<string, "success" | "warning" | "danger"> = {
          Sain: "success",
          Risqué: "warning",
          Contentieux: "danger",
        };
        return <Badge variant={variants[c.status]}>{c.status}</Badge>;
      },
    },
    {
      header: "Actions",
      accessor: (c: CustomerWithDebt) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => handleOpenModal(c)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(c.id)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-zinc-400 hover:text-red-500 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: "text-right",
    },
  ];

  const creditColumns = [
    {
      header: "Débiteur",
      accessor: (c: CustomerWithDebt) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center font-black text-sm shrink-0">
            {(c.name ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm text-foreground">{c.name}</span>
            <span className="text-[10px] text-zinc-400 font-bold">{c.phone || "—"}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Dette Totale",
      accessor: (c: CustomerWithDebt) => (
        <span className="text-sm font-black text-red-600">
          {Number(c.totalDebt || 0).toLocaleString("fr-FR")} FCFA
        </span>
      ),
    },
    {
      header: "Dernier Versement",
      accessor: (c: CustomerWithDebt) => (
        <span className="text-xs font-bold text-zinc-500">{c.lastPayment}</span>
      ),
    },
    {
      header: "Statut",
      accessor: (c: CustomerWithDebt) => {
        const variants: Record<string, "success" | "warning" | "danger"> = {
          Sain: "success",
          Risqué: "warning",
          Contentieux: "danger",
        };
        return <Badge variant={variants[c.status]}>{c.status}</Badge>;
      },
    },
    {
      header: "Actions",
      accessor: (c: CustomerWithDebt) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="primary"
            size="sm"
            className="h-8 px-2"
            disabled={c.totalDebt === 0}
            onClick={() => showToast("Encaissement en cours de développement", "info")}
          >
            <DollarSign className="h-3.5 w-3.5 mr-1" />
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
      subtitle="Suivi des impayés et annuaire chantiers"
    >
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6">
          <button
            onClick={() => { setActiveTab("directory"); setSearch(""); }}
            className={`pb-4 text-sm font-black uppercase tracking-wider transition-all ${
              activeTab === "directory"
                ? "text-amber-500 border-b-2 border-amber-500"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Annuaire ({customers.length})
            </span>
          </button>
          <button
            onClick={() => { setActiveTab("credits"); setSearch(""); }}
            className={`pb-4 text-sm font-black uppercase tracking-wider transition-all ${
              activeTab === "credits"
                ? "text-red-500 border-b-2 border-red-500"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            }`}
          >
            <span className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Recouvrement Crédits ({activeDebtors})
            </span>
          </button>
        </div>

        {/* KPIs (tab crédits seulement) */}
        {activeTab === "credits" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 flex items-center justify-between border-none shadow-lg">
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">En-cours Impayé</p>
                <h3 className="text-2xl font-black text-red-500 mt-1">{totalDebts.toLocaleString("fr-FR")} FCFA</h3>
              </div>
              <div className="p-3 bg-red-500/10 text-red-500 rounded-xl"><TrendingUp className="h-6 w-6" /></div>
            </Card>
            <Card className="p-5 flex items-center justify-between border-none shadow-lg">
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Débiteurs Actifs</p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">{activeDebtors} clients</h3>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><AlertTriangle className="h-6 w-6" /></div>
            </Card>
            <Card className="p-5 flex items-center justify-between border-none shadow-lg">
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Clients Sains</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">{customers.length - activeDebtors} clients</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><UserCheck className="h-6 w-6" /></div>
            </Card>
          </div>
        )}

        {/* KPIs (tab annuaire) */}
        {activeTab === "directory" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 flex items-center gap-4 border-l-4 border-l-red-600">
              <div className="p-3 bg-red-600/10 text-red-600 rounded-2xl"><AlertTriangle className="h-6 w-6" /></div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Créances Dehors</p>
                <h4 className="text-xl font-black text-foreground">{loading ? "..." : `${totalDebts.toLocaleString("fr-FR")} FCFA`}</h4>
              </div>
            </Card>
            <Card className="p-5 flex items-center gap-4 border-l-4 border-l-emerald-600">
              <div className="p-3 bg-emerald-600/10 text-emerald-600 rounded-2xl"><CheckCircle className="h-6 w-6" /></div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Recouvrements (Mois)</p>
                <h4 className="text-xl font-black text-foreground">0 FCFA</h4>
              </div>
            </Card>
            <Card className="p-5 flex items-center gap-4 border-l-4 border-l-amber-500">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl"><Users className="h-6 w-6" /></div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Clients Enregistrés</p>
                <h4 className="text-xl font-black text-foreground">{loading ? "..." : customers.length}</h4>
              </div>
            </Card>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder={activeTab === "credits" ? "Filtrer les débiteurs..." : "Rechercher un client ou chantier..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-xs font-bold outline-none focus:border-primary shadow-sm transition-all"
            />
          </div>
          {activeTab === "directory" && (
            <Button variant="primary" onClick={() => handleOpenModal()} className="h-12 px-6 w-full md:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              Nouveau Client
            </Button>
          )}
        </div>

        {/* Table */}
        <Card className="overflow-hidden border-none shadow-xl">
          <DataTable
            columns={activeTab === "credits" ? creditColumns : directoryColumns}
            data={filtered}
            isLoading={loading}
          />
        </Card>
      </div>

      {/* Modal création / édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCustomer ? "Modifier le client" : "Nouveau Client"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              Nom complet / Raison sociale <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name ?? ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Kouamé Entreprises"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={formData.phone ?? ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0707..."
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="email"
                  value={formData.email ?? ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="client@mail.com"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Adresse / Localisation chantier</label>
            <input
              type="text"
              value={formData.address ?? ""}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ex: Zone industrielle, rue des ateliers"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5 text-amber-500" />
              Limite de Crédit Autorisée (FCFA)
            </label>
            <input
              type="number"
              min={0}
              value={formData.creditLimit ?? 0}
              onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Notes internes</label>
            <textarea
              value={formData.notes ?? ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: Chantier Cocody, bon payeur..."
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all h-20 resize-none"
            />
          </div>

          <Button type="submit" variant="primary" className="h-12 font-black uppercase tracking-widest mt-1">
            {selectedCustomer ? "Mettre à jour" : "Créer le client"}
          </Button>
        </form>
      </Modal>
    </AppLayout>
  );
}
