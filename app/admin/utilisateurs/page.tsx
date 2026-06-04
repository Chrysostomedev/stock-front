"use client";
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";
import {
  Plus,
  Search,
  Edit2,
  Power,
  Key,
  Phone,
  ShieldCheck,
  Building2,
  Trash2,
  Clock,
  User,
} from "lucide-react";
import { useUsers } from "@/hooks/admin/useUsers";
import AdminShopService from "@/services/admin/shop.service";
import { UserAccount, Shop } from "@/types/admin";
import { UserRole } from "@/types/auth";

// Hook réactif pour détecter le mobile
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

// Couleur de badge selon le rôle
function roleBadgeVariant(role: string): "secondary" | "outline" | "warning" {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "secondary";
  if (role === "AUDITOR") return "warning";
  return "outline";
}

// Label lisible du rôle
function roleLabel(role: string) {
  const map: Record<string, string> = {
    CASHIER: "Caissière",
    MANAGER: "Gérant",
    ADMIN: "Admin",
    SUPER_ADMIN: "Super Admin",
    AUDITOR: "Auditeur",
  };
  return map[role] ?? role;
}

function formatDate(dateString?: string | Date) {
  if (!dateString) return "Jamais";
  try {
    return new Date(dateString).toLocaleString("fr-FR");
  } catch {
    return "Jamais";
  }
}

export default function AdminUtilisateursPage() {
  const {
    users,
    loading,
    error,
    shopAccesses,
    addUser,
    updateUser,
    deleteUser,
    toggleStatus,
    refresh,
    fetchShopAccesses,
  } = useUsers();

  const { showToast } = useToast();
  const isMobile = useIsMobile();

  const [shops, setShops] = useState<Shop[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isShopsModalOpen, setIsShopsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState<Partial<UserAccount>>({
    name: "",
    phone: "",
    role: "CASHIER",
    pin: "1234",
    isActive: true,
    shopId: "",
  });

  useEffect(() => {
    const loadShops = async () => {
      try {
        const response = await AdminShopService.getAllShops();
        const res = response as any;
        const list = Array.isArray(res) ? res : res.data || [];
        setShops(list);
      } catch (err) {
        console.error("Failed to load shops", err);
      }
    };
    loadShops();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        name: selectedUser.name,
        username: selectedUser.username,
        phone: selectedUser.phone,
        role: selectedUser.role,
        pin: selectedUser.pin,
        isActive: selectedUser.isActive,
        shopId: selectedUser.shopId,
      });
    } else {
      setFormData({
        name: "",
        username: "",
        phone: "",
        role: "CASHIER",
        pin: "1234",
        isActive: true,
        shopId: "",
      });
    }
  }, [selectedUser, isModalOpen]);

  const handleSubmit = async () => {
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, formData);
        showToast("Utilisateur mis à jour avec succès !", "success");
      } else {
        await addUser(formData);
        showToast("Utilisateur créé et assigné avec succès !", "success");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || "Une erreur est survenue", "error");
    }
  };

  const filteredUsers = Array.isArray(users)
    ? users.filter((u) => {
        if (!u) return false;
        return (
          u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.phone?.includes(searchTerm)
        );
      })
    : [];

  // Initiales de l'utilisateur
  const initials = (u: UserAccount) =>
    (u.name ? u.name[0] : u.username?.[0] ?? "?").toUpperCase();

  // ---- VUE CARTE MOBILE ----
  const MobileUserCard = ({ u }: { u: UserAccount }) => (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-black text-primary shrink-0">
            {initials(u)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-foreground truncate">{u.name}</p>
            <p className="text-[10px] text-zinc-400 font-bold tracking-wider truncate">{u.username}</p>
          </div>
        </div>
        <Badge variant={u.isActive ? "success" : "outline"} className="shrink-0">
          {u.isActive ? "Actif" : "Inactif"}
        </Badge>
      </div>

      {/* Infos */}
      <div className="flex flex-col gap-1.5 mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          <Badge variant={roleBadgeVariant(u.role)}>{roleLabel(u.role)}</Badge>
        </div>
        {u.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{u.phone}</span>
          </div>
        )}
        {u.lastLoginAt && (
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="text-[10px] text-zinc-400 font-bold">{formatDate(u.lastLoginAt)}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 border-t border-zinc-100 dark:border-zinc-800 pt-3">
        <button
          onClick={() => { setSelectedUser(u); setIsModalOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-primary transition-all"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Modifier
        </button>
        <button
          onClick={() => {
            setSelectedUser(u);
            setIsShopsModalOpen(true);
            if (u.id) fetchShopAccesses(u.id);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 transition-all"
        >
          <Building2 className="h-3.5 w-3.5" />
          Boutiques
        </button>
        <button
          onClick={() => { setSelectedUser(u); setIsConfirmOpen(true); }}
          className={`p-2 rounded-lg transition-all ${
            u.isActive
              ? "hover:bg-red-50 text-zinc-400 hover:text-red-600"
              : "hover:bg-green-50 text-zinc-400 hover:text-green-600"
          }`}
          title={u.isActive ? "Désactiver" : "Activer"}
        >
          <Power className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => { setSelectedUser(u); setIsDeleteConfirmOpen(true); }}
          className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-zinc-400 hover:text-red-600 transition-all"
          title="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  // ---- COLONNES DESKTOP ----
  const columns: {
    header: string;
    accessor: keyof UserAccount | ((item: UserAccount) => React.ReactNode);
    className?: string;
  }[] = [
    {
      header: "Utilisateur",
      accessor: (u: UserAccount) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
            {initials(u)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-foreground">{u.name}</span>
            <span className="text-[10px] text-zinc-400 font-bold tracking-wider">{u.username}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Rôle",
      accessor: (u: UserAccount) => (
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3 w-3 text-zinc-400" />
          <Badge variant={roleBadgeVariant(u.role)}>{roleLabel(u.role)}</Badge>
        </div>
      ),
    },
    {
      header: "Contact",
      accessor: (u: UserAccount) => (
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3 text-zinc-400" />
          <span className="text-xs font-bold">{u.phone || "N/A"}</span>
        </div>
      ),
    },
    {
      header: "Statut",
      accessor: (u: UserAccount) => (
        <Badge variant={u.isActive ? "success" : "outline"}>
          {u.isActive ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessor: (u: UserAccount) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSelectedUser(u); setIsModalOpen(true); }}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"
            title="Modifier"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedUser(u);
              setIsShopsModalOpen(true);
              if (u.id) fetchShopAccesses(u.id);
            }}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-500 transition-all"
            title="Voir les boutiques"
          >
            <Building2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setSelectedUser(u); setIsConfirmOpen(true); }}
            className={`p-2 rounded-lg transition-all ${
              u.isActive
                ? "hover:bg-red-50 text-zinc-400 hover:text-red-600"
                : "hover:bg-green-50 text-zinc-400 hover:text-green-600"
            }`}
            title={u.isActive ? "Désactiver" : "Activer"}
          >
            <Power className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setSelectedUser(u); setIsDeleteConfirmOpen(true); }}
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

  return (
    <AppLayout
      title="Gestion des Utilisateurs"
      subtitle="Créez et gérez les accès des caissiers et gérants"
      rightElement={
        <Button
          variant="primary"
          size="sm"
          onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isMobile ? "Nouveau" : "Nouvel Utilisateur"}
        </Button>
      }
    >
      <div className="flex flex-col gap-6 pb-24 md:pb-12">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
            {error}
            <button onClick={refresh} className="ml-4 underline">Réessayer</button>
          </div>
        )}

        <Card className="p-4 md:p-6">
          {/* Barre de recherche */}
          <div className="relative mb-5">
            <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, identifiant ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          {loading ? (
            <div className="py-20 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
              Chargement des utilisateurs...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center">
              <User className="h-10 w-10 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Aucun utilisateur trouvé
              </p>
            </div>
          ) : isMobile ? (
            // ---- VUE MOBILE : cartes ----
            <div className="flex flex-col gap-3">
              {filteredUsers.map((u) => (
                <MobileUserCard key={u.id} u={u} />
              ))}
            </div>
          ) : (
            // ---- VUE DESKTOP : tableau ----
            <DataTable columns={columns} data={filteredUsers} />
          )}
        </Card>
      </div>

      {/* ---- MODAL Ajout / Modification ---- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedUser ? "Modifier Utilisateur" : "Nouvel Utilisateur"}
      >
        <div className="flex flex-col gap-4">
          {/* Nom complet */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Nom complet</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Jean Dupont"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Téléphone — OBLIGATOIRE (utilisé pour se connecter) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">
              Téléphone <span className="text-red-500">*</span>
              <span className="ml-1 text-zinc-400 normal-case font-medium">(identifiant de connexion)</span>
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ex: 0701020304"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Rôle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Rôle</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            >
              <option value="CASHIER">Caissière (Superette)</option>
              <option value="MANAGER">Gérant (Quincaillerie)</option>
              <option value="ADMIN">Administrateur</option>
              <option value="SUPER_ADMIN">Super Administrateur</option>
              <option value="AUDITOR">Auditeur</option>
            </select>
          </div>

          {/* Mot de passe + PIN (création uniquement) */}
          {!selectedUser && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-zinc-500 uppercase">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  placeholder="Min. 4 caractères"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-zinc-500 uppercase">Code PIN (caisse)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={formData.pin?.length === 4 && /^\d+$/.test(formData.pin) ? formData.pin : ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setFormData({ ...formData, pin: val || formData.pin });
                  }}
                  placeholder="4 chiffres"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all tracking-[0.5em]"
                />
              </div>
            </div>
          )}

          {/* Encart récap identifiants */}
          {!selectedUser && formData.phone && formData.pin && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0">
                <Key className="h-4 w-4" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                  Identifiants de connexion à communiquer
                </span>
                <span className="text-xs font-bold text-foreground">
                  Téléphone : <span className="text-primary font-black">{formData.phone}</span>
                </span>
                <span className="text-xs font-bold text-foreground">
                  Mot de passe : <span className="text-primary font-black">{formData.pin}</span>
                </span>
              </div>
            </div>
          )}
          <Button
            variant="primary"
            className="mt-2"
            onClick={handleSubmit}
            disabled={
              !formData.name ||
              !formData.phone ||
              (!selectedUser && (!formData.pin || formData.pin.length < 4))
            }
          >
            {selectedUser ? "Mettre à jour l'accès" : "Créer le compte"}
          </Button>
        </div>
      </Modal>

      {/* ---- MODAL Boutiques assignées ---- */}
      <Modal
        isOpen={isShopsModalOpen}
        onClose={() => setIsShopsModalOpen(false)}
        title={`Boutiques — ${selectedUser?.name}`}
      >
        <div className="flex flex-col gap-4">
          {/* Dernière connexion */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30 rounded-xl text-xs font-bold self-start">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              Dernière connexion :{" "}
              <span className="font-black text-blue-900 dark:text-blue-200">
                {formatDate(selectedUser?.lastLoginAt)}
              </span>
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : shopAccesses && shopAccesses.length > 0 ? (
            <div className="flex flex-col gap-2">
              {shopAccesses.map((access: any) => (
                <div
                  key={access.shopId}
                  className="p-3 border rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{access.shop?.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{access.shop?.address}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {access.shop?.type === "superette" ? "Supérette" : "Quincaillerie"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
              <Building2 className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
              <p className="text-xs font-bold">Aucune boutique assignée à cet utilisateur.</p>
            </div>
          )}
        </div>
      </Modal>
      {/* ---- MODAL Activer / Désactiver ---- */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => {
          if (selectedUser) {
            await toggleStatus(selectedUser.id, selectedUser.isActive);
            setIsConfirmOpen(false);
          }
        }}
        title={selectedUser?.isActive ? "Désactiver l'utilisateur" : "Activer l'utilisateur"}
        message={`Voulez-vous vraiment ${
          selectedUser?.isActive ? "désactiver" : "activer"
        } le compte de "${selectedUser?.name}" ?`}
        confirmLabel={selectedUser?.isActive ? "Désactiver" : "Activer"}
        variant={selectedUser?.isActive ? "danger" : "primary"}
      />

      {/* ---- MODAL Suppression ---- */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          if (selectedUser) {
            await deleteUser(selectedUser.id);
            setIsDeleteConfirmOpen(false);
          }
        }}
        title="Supprimer l'utilisateur"
        message={`Attention : cette action est irréversible. Voulez-vous vraiment supprimer définitivement le compte de "${selectedUser?.name}" ?`}
        confirmLabel="Supprimer définitivement"
        variant="danger"
      />
    </AppLayout>
  );
}