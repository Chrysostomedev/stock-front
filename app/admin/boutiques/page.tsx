"use client";
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  Plus,
  Search,
  Building2,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Power,
  Mail,
  ToolCase,
} from "lucide-react";
import { useShops } from "@/hooks/admin/useShops";
import { Shop } from "@/types/admin";

// Hook pour détecter la taille d'écran de manière réactive
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}

export default function AdminBoutiquesPage() {
  const { shops, loading, error, addShop, updateShop, deleteShop, toggleStatus, refresh } = useShops();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();

  const [formData, setFormData] = useState<Partial<Shop>>({
    name: "",
    type: "superette",
    address: "",
    phone: "",
    email: "",
    currency: "XOF",
    isActive: true,
  });

  useEffect(() => {
    if (selectedShop) {
      setFormData({
        name: selectedShop.name,
        type: selectedShop.type,
        address: selectedShop.address,
        phone: selectedShop.phone,
        email: selectedShop.email,
        currency: selectedShop.currency,
        isActive: selectedShop.isActive,
      });
    } else {
      setFormData({
        name: "",
        type: "superette",
        address: "",
        phone: "",
        email: "",
        currency: "XOF",
        isActive: true,
      });
    }
  }, [selectedShop, isModalOpen]);

  const handleSubmit = async () => {
    try {
      if (selectedShop) {
        await updateShop(selectedShop.id, formData);
      } else {
        await addShop(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredShops = shops.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Icône selon le type de boutique
  const ShopIcon = ({ type }: { type: string }) =>
    type === "quincaillerie" ? (
      <ToolCase className="h-5 w-5" />
    ) : (
      <Building2 className="h-5 w-5" />
    );

  // Couleur de fond de l'icône selon le type
  const shopIconBg = (type: string) =>
    type === "quincaillerie"
      ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
      : "bg-primary/10 text-primary";

  // ----- COLONNES DESKTOP (DataTable) -----
  const columns: {
    header: string;
    accessor: keyof Shop | ((item: Shop) => React.ReactNode);
    className?: string;
  }[] = [
    {
      header: "Boutique",
      accessor: (s: Shop) => (
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${shopIconBg(s.type)}`}>
            <ShopIcon type={s.type} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-foreground">{s.name}</span>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{s.type}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Emplacement",
      accessor: (s: Shop) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-zinc-400 shrink-0" />
          <span className="text-xs font-bold">{s.address}</span>
        </div>
      ),
    },
    {
      header: "Contact",
      accessor: (s: Shop) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-zinc-400 shrink-0" />
            <span className="text-[10px] font-bold">{s.phone}</span>
          </div>
          {s.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-zinc-400 shrink-0" />
              <span className="text-[10px] text-zinc-400 font-bold">{s.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Statut",
      accessor: (s: Shop) => (
        <Badge variant={s.isActive ? "success" : "outline"}>
          {s.isActive ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessor: (s: Shop) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSelectedShop(s); setIsModalOpen(true); }}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"
            title="Modifier"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setSelectedShop(s); setIsConfirmOpen(true); }}
            className={`p-2 rounded-lg transition-all ${
              s.isActive
                ? "hover:bg-red-50 text-zinc-400 hover:text-red-600"
                : "hover:bg-green-50 text-zinc-400 hover:text-green-600"
            }`}
            title={s.isActive ? "Désactiver" : "Activer"}
          >
            <Power className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setSelectedShop(s); setIsDeleteConfirmOpen(true); }}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-zinc-400 hover:text-red-600 transition-all"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: "text-right",
    },
  ];

  // ----- VUE CARTE MOBILE -----
  const MobileShopCard = ({ s }: { s: Shop }) => (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${shopIconBg(s.type)}`}>
            <ShopIcon type={s.type} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-foreground truncate">{s.name}</p>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{s.type}</p>
          </div>
        </div>
        <Badge variant={s.isActive ? "success" : "outline"} className="shrink-0">
          {s.isActive ? "Actif" : "Inactif"}
        </Badge>
      </div>

      {/* Infos */}
      <div className="flex flex-col gap-1.5 mb-4">
        <div className="flex items-start gap-2">
          <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 leading-tight">{s.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{s.phone}</span>
        </div>
        {s.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="text-xs text-zinc-400 font-bold truncate">{s.email}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
        <button
          onClick={() => { setSelectedShop(s); setIsModalOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-primary transition-all"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Modifier
        </button>
        <button
          onClick={() => { setSelectedShop(s); setIsConfirmOpen(true); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            s.isActive
              ? "text-zinc-500 hover:bg-red-50 hover:text-red-600"
              : "text-zinc-500 hover:bg-green-50 hover:text-green-600"
          }`}
        >
          <Power className="h-3.5 w-3.5" />
          {s.isActive ? "Désactiver" : "Activer"}
        </button>
        <button
          onClick={() => { setSelectedShop(s); setIsDeleteConfirmOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <AppLayout
      title="Gestion des Boutiques"
      subtitle="Configurez vos points de vente et entrepôts"
      rightElement={
        <Button
          variant="primary"
          size="sm"
          onClick={() => { setSelectedShop(null); setIsModalOpen(true); }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isMobile ? "Nouvelle" : "Nouvelle Boutique"}
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
            {error}
            <button onClick={refresh} className="ml-4 underline">
              Réessayer
            </button>
          </div>
        )}

        <Card className="p-4 md:p-6">
          {/* Barre de recherche */}
          <div className="relative mb-5">
            <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher une boutique..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          {loading ? (
            <div className="py-20 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
              Chargement des boutiques...
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="py-16 text-center">
              <Building2 className="h-10 w-10 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Aucune boutique trouvée
              </p>
            </div>
          ) : isMobile ? (
            // ---- VUE MOBILE : cartes empilées ----
            <div className="flex flex-col gap-3">
              {filteredShops.map((s) => (
                <MobileShopCard key={s.id} s={s} />
              ))}
            </div>
          ) : (
            // ---- VUE DESKTOP : tableau ----
            <DataTable columns={columns} data={filteredShops} />
          )}
        </Card>
      </div>

      {/* ---- MODAL Ajout / Modification ---- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedShop ? "Modifier Boutique" : "Nouvelle Boutique"}
      >
        <div className="flex flex-col gap-4">
          {/* Nom + Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">
                Nom de la boutique
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Superette Plateau"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                <option value="superette">Superette (Produits de consommation)</option>
                <option value="quincaillerie">Quincaillerie (Matériaux & Outils)</option>
              </select>
            </div>
          </div>

          {/* Adresse */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">
              Adresse / Localisation
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ex: Avenue 10, Plateau, Abidjan"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Téléphone + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Téléphone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ex: +225 0701020304"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">
                Email <span className="normal-case font-medium text-zinc-400">(Optionnel)</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Ex: plateau@spservices.com"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Devise + Statut */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Devise</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                <option value="XOF">FCFA (XOF)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar ($)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5 justify-center sm:pt-5">
              <label className="text-xs font-black text-zinc-500 uppercase sm:opacity-0 select-none">
                Statut
              </label>
              <label
                htmlFor="isActive"
                className="flex items-center gap-3 cursor-pointer p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-primary transition-all"
              >
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
                />
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Activer immédiatement
                </span>
              </label>
            </div>
          </div>

          <Button
            variant="primary"
            className="mt-2"
            onClick={handleSubmit}
            disabled={!formData.name || !formData.address || !formData.phone}
          >
            {selectedShop ? "Mettre à jour" : "Créer la boutique"}
          </Button>
        </div>
      </Modal>

      {/* ---- MODAL Activer / Désactiver ---- */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => {
          if (selectedShop) {
            await toggleStatus(selectedShop.id, selectedShop.isActive);
            setIsConfirmOpen(false);
          }
        }}
        title={selectedShop?.isActive ? "Désactiver la boutique" : "Activer la boutique"}
        message={`Voulez-vous vraiment ${
          selectedShop?.isActive ? "désactiver" : "activer"
        } la boutique "${selectedShop?.name}" ?`}
        confirmLabel={selectedShop?.isActive ? "Désactiver" : "Activer"}
        variant={selectedShop?.isActive ? "danger" : "primary"}
      />

      {/* ---- MODAL Suppression ---- */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          if (selectedShop) {
            await deleteShop(selectedShop.id);
            setIsDeleteConfirmOpen(false);
          }
        }}
        title="Supprimer la boutique"
        message={`Attention : toutes les données associées seront inaccessibles. Voulez-vous vraiment supprimer définitivement "${selectedShop?.name}" ?`}
        confirmLabel="Supprimer définitivement"
        variant="danger"
      />
    </AppLayout>
  );
}