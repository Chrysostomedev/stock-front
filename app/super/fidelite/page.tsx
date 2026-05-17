/**
 * ============================================================================
 * PAGE : FIDÉLITÉ CLIENTS SUPERETTE
 * ============================================================================
 * 
 * Gère la base clients, les crédits en cours, et les versements.
 * 
 * Connecté au backend via :
 *   - CustomerService.getAll()                    → Liste des clients
 *   - CustomerService.create(dto)                 → Créer un client
 *   - CreditPaymentService.create(dto)            → Enregistrer un versement
 *   - CreditPaymentService.getByCustomer(id)      → Historique d'un client
 * 
 * Le champ `totalDebt` de chaque client est géré atomiquement par le backend :
 *   - Vente à crédit → totalDebt augmente
 *   - Versement (credit-payment) → totalDebt diminue
 * 
 * @see back-spservice/src/modules/customer
 * @see back-spservice/src/modules/credit-payment
 * ============================================================================
 */
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
import CustomerService, { Customer } from "@/services/customer.service";
import CreditPaymentService from "@/services/super/creditPayment.service";
import { PaymentMethod } from "@/types/super";
import {
  Users,
  Plus,
  Search,
  Phone,
  Wallet,
  CreditCard,
  RefreshCw,
  DollarSign,
  ArrowDownCircle,
} from "lucide-react";

export default function SuperFidelitePage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  // === État principal ===
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // === Modale : création de client ===
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    creditLimit: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  // === Modale : versement (credit-payment) ===
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: PaymentMethod.CASH,
    reference: "",
    notes: "",
  });
  const [isPaying, setIsPaying] = useState(false);

  /**
   * Charge tous les clients depuis le backend.
   * Le backend retourne un tableau avec le champ `totalDebt` pour chaque client.
   */
  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await CustomerService.getAll();
      const list = Array.isArray(data) ? data : (data as any)?.data || [];
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

  // === Création d'un nouveau client ===
  const handleCreateCustomer = async () => {
    if (!createForm.name) {
      showToast("Le nom du client est obligatoire", "error");
      return;
    }
    setIsCreating(true);
    try {
      await CustomerService.create({
        name: createForm.name,
        phone: createForm.phone || undefined,
        email: createForm.email || undefined,
        address: createForm.address || undefined,
        creditLimit: createForm.creditLimit
          ? parseFloat(createForm.creditLimit)
          : undefined,
      });
      showToast("Client créé avec succès", "success");
      setIsCreateOpen(false);
      setCreateForm({ name: "", phone: "", email: "", address: "", creditLimit: "" });
      loadCustomers(); // Recharger la liste
    } catch (error) {
      showToast("Erreur lors de la création du client", "error");
    } finally {
      setIsCreating(false);
    }
  };

  // === Enregistrement d'un versement ===
  const handlePayment = async () => {
    if (!selectedCustomer || !paymentForm.amount) {
      showToast("Montant obligatoire", "error");
      return;
    }
    setIsPaying(true);
    try {
      // Appel au backend : POST /credit-payments
      // Le backend réduit automatiquement totalDebt du client
      await CreditPaymentService.create({
        customerId: selectedCustomer.id,
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined,
      });
      showToast(
        `Versement de ${paymentForm.amount} XOF enregistré pour ${selectedCustomer.name}`,
        "success"
      );
      setIsPaymentOpen(false);
      setPaymentForm({ amount: "", method: PaymentMethod.CASH, reference: "", notes: "" });
      setSelectedCustomer(null);
      loadCustomers(); // Recharger pour voir le nouveau totalDebt
    } catch (error) {
      showToast("Erreur lors de l'enregistrement du versement", "error");
    } finally {
      setIsPaying(false);
    }
  };

  // === Ouvrir la modale de versement pour un client ===
  const openPaymentModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPaymentForm({ amount: "", method: PaymentMethod.CASH, reference: "", notes: "" });
    setIsPaymentOpen(true);
  };

  // === Filtrage ===
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone?.includes(search) ?? false)
  );

  // === KPIs ===
  const totalClients = customers.length;
  const totalDebt = customers.reduce((acc, c) => acc + (c.totalDebt || 0), 0);
  const clientsWithDebt = customers.filter((c) => (c.totalDebt || 0) > 0).length;

  // === Colonnes du tableau ===
  const columns: {
    header: string;
    accessor: (item: Customer) => React.ReactNode;
    className?: string;
  }[] = [
    {
      header: "Client",
      accessor: (c: Customer) => (
        <div className="flex items-center gap-3">
          {/* Avatar avec initiale */}
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-black text-primary">
            {c.name[0]?.toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">
              {c.name}
            </span>
            {c.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-2.5 w-2.5 text-zinc-400" />
                <span className="text-[10px] text-zinc-400 font-bold">
                  {c.phone}
                </span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Dette en cours",
      accessor: (c: Customer) => (
        <span
          className={`text-sm font-black ${
            (c.totalDebt || 0) > 0 ? "text-red-600" : "text-emerald-600"
          }`}
        >
          {new Intl.NumberFormat("fr-FR").format(c.totalDebt || 0)} XOF
        </span>
      ),
    },
    {
      header: "Limite Crédit",
      accessor: (c: Customer) => (
        <span className="text-xs font-bold text-zinc-500">
          {c.creditLimit
            ? `${new Intl.NumberFormat("fr-FR").format(c.creditLimit)} XOF`
            : "Illimité"}
        </span>
      ),
    },
    {
      header: "Statut",
      accessor: (c: Customer) => {
        if ((c.totalDebt || 0) === 0) {
          return <Badge variant="success" className="text-[9px]">SOLDÉ</Badge>;
        }
        if (c.creditLimit && (c.totalDebt || 0) >= c.creditLimit) {
          return <Badge variant="danger" className="text-[9px]">LIMITE ATTEINTE</Badge>;
        }
        return <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300">CRÉDIT EN COURS</Badge>;
      },
    },
    {
      header: "Actions",
      accessor: (c: Customer) => (
        <div className="flex items-center gap-2">
          {(c.totalDebt || 0) > 0 && (
            <Button
              variant="primary"
              size="sm"
              className="h-8 px-3 text-[10px]"
              onClick={() => openPaymentModal(c)}
            >
              <DollarSign className="h-3 w-3 mr-1" />
              Versement
            </Button>
          )}
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <AppLayout
      title="Clients & Fidélité"
      subtitle="Gestion de la base clients, crédits et versements"
      rightElement={
        <div className="flex items-center gap-2">
          <button
            onClick={loadCustomers}
            className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Client
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
        {/* === KPIs === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total clients */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Clients enregistrés
              </p>
              <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                {totalClients}
              </h4>
            </div>
          </div>

          {/* Dette totale */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 shadow-sm border-l-4 border-l-red-500">
            <div className="p-4 bg-red-500/10 text-red-600 rounded-2xl">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Créances totales
              </p>
              <h4 className="text-xl font-black text-red-600">
                {new Intl.NumberFormat("fr-FR").format(totalDebt)} XOF
              </h4>
            </div>
          </div>

          {/* Clients avec dette */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
            <div className="p-4 bg-amber-500/10 text-amber-600 rounded-2xl">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Clients à crédit
              </p>
              <h4 className="text-xl font-black text-amber-600">
                {clientsWithDebt}
              </h4>
            </div>
          </div>
        </div>

        {/* === Tableau === */}
        <Card className="p-0 overflow-hidden shadow-xl border-none">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou téléphone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
          <DataTable
            columns={columns}
            data={filteredCustomers}
            isLoading={loading}
          />
        </Card>
      </div>

      {/* === MODALE : Créer un client === */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nouveau Client"
      >
        <div className="flex flex-col gap-5 p-2">
          {/* Nom (obligatoire) */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              Nom complet *
            </label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
              placeholder="Ex: Yao Amenan"
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Téléphone */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Téléphone
              </label>
              <input
                type="text"
                value={createForm.phone}
                onChange={(e) =>
                  setCreateForm({ ...createForm, phone: e.target.value })
                }
                placeholder="0701020304"
                className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Limite de crédit */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Limite Crédit (XOF)
              </label>
              <input
                type="number"
                value={createForm.creditLimit}
                onChange={(e) =>
                  setCreateForm({ ...createForm, creditLimit: e.target.value })
                }
                placeholder="50000"
                className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Adresse */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              Adresse
            </label>
            <input
              type="text"
              value={createForm.address}
              onChange={(e) =>
                setCreateForm({ ...createForm, address: e.target.value })
              }
              placeholder="Ex: Cocody, Riviera 3"
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          <Button
            variant="primary"
            className="h-14 mt-2 text-xs font-black uppercase tracking-widest"
            onClick={handleCreateCustomer}
            loading={isCreating}
          >
            Enregistrer le client
          </Button>
        </div>
      </Modal>

      {/* === MODALE : Versement (Credit Payment) === */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title={`Versement — ${selectedCustomer?.name || ""}`}
      >
        <div className="flex flex-col gap-5 p-2">
          {/* Résumé dette actuelle */}
          {selectedCustomer && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30 rounded-2xl">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">
                Dette actuelle
              </p>
              <p className="text-xl font-black text-red-600">
                {new Intl.NumberFormat("fr-FR").format(
                  selectedCustomer.totalDebt || 0
                )}{" "}
                XOF
              </p>
            </div>
          )}

          {/* Montant du versement */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              Montant du versement (XOF) *
            </label>
            <input
              type="number"
              value={paymentForm.amount}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, amount: e.target.value })
              }
              placeholder="5000"
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-black outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Méthode de paiement */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Mode de paiement
              </label>
              <select
                value={paymentForm.method}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    method: e.target.value as PaymentMethod,
                  })
                }
                className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                <option value="CASH">Espèces</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="BANK_CARD">Carte Bancaire</option>
              </select>
            </div>

            {/* Référence de transaction */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Référence
              </label>
              <input
                type="text"
                value={paymentForm.reference}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, reference: e.target.value })
                }
                placeholder="Ex: OM_123456"
                className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              Notes
            </label>
            <input
              type="text"
              value={paymentForm.notes}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, notes: e.target.value })
              }
              placeholder="Ex: Acompte pour Mai"
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          <Button
            variant="primary"
            className="h-14 mt-2 text-xs font-black uppercase tracking-widest"
            onClick={handlePayment}
            loading={isPaying}
          >
            <ArrowDownCircle className="h-4 w-4 mr-2" />
            Enregistrer le versement
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
