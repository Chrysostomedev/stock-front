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
  Percent
} from "lucide-react";

export default function AdminClientsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
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
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm)
  );

  const columns: { header: string; accessor: keyof Customer | ((item: Customer) => React.ReactNode); className?: string }[] = [
    {
      header: "Client",
      accessor: (c: Customer) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black">
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-black text-zinc-900 dark:text-zinc-50">{c.name}</span>
            <div className="flex items-center gap-2 mt-0.5">
              {c.creditLimit && c.creditLimit > 0 && (
                <Badge variant="primary" className="text-[8px] px-1 py-0 uppercase">Premium</Badge>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      header: "Contact",
      accessor: (c: Customer) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-bold">
            <Phone className="h-3 w-3 text-zinc-400" />
            {c.phone || "---"}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
            <Mail className="h-3 w-3" />
            {c.email || "---"}
          </div>
        </div>
      )
    },
    {
      header: "Dette Actuelle",
      accessor: (c: Customer) => (
        <span className={`font-black ${c.totalDebt > 0 ? "text-red-500" : "text-zinc-400"}`}>
          {new Intl.NumberFormat('fr-FR').format(c.totalDebt)} XOF
        </span>
      )
    },
    {
      header: "Actions",
      accessor: (c: Customer) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleOpenModal(c)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500">
            <Edit2 className="h-4 w-4" />
          </button>
          <button className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <AppLayout title="Fidélité Clients" subtitle="Gestion de la base clients et des privilèges">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 h-5 w-5" />
            <input 
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-xs font-bold outline-none focus:border-primary shadow-sm transition-all"
            />
          </div>
          <Button onClick={() => handleOpenModal()} variant="primary" className="h-14 px-8 shadow-lg shadow-primary/20">
            <UserPlus className="h-5 w-5 mr-2" />
            Nouveau Client
          </Button>
        </div>

        <Card className="overflow-hidden border-none shadow-xl">
          <DataTable columns={columns} data={filteredCustomers} isLoading={loading} />
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedCustomer ? "Modifier le client" : "Ajouter un client"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-2">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nom complet <span className="text-red-500">*</span></label>
            <input 
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="client@mail.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section Privilèges - Conditionnée par le rôle */}
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
                  onChange={(e) => setFormData({...formData, creditLimit: parseFloat(e.target.value)})}
                  disabled={!isManager}
                  placeholder="0"
                  className={`w-full pl-11 pr-4 py-3.5 border rounded-2xl text-xs font-black outline-none transition-all ${
                    isManager 
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
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">Client Fidèle / VIP</span>
                <span className="text-[10px] text-zinc-500 font-medium leading-none">Droit de crédit et remises préférentielles</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Notes internes</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Historique, préférences..."
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all h-24 resize-none"
            />
          </div>

          <Button type="submit" variant="primary" className="h-14 font-black uppercase tracking-widest mt-2">
            {selectedCustomer ? "Mettre à jour" : "Créer le client"}
          </Button>
        </form>
      </Modal>
    </AppLayout>
  );
}
