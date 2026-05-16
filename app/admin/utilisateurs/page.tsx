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
  Edit2, 
  Power,
  Key,
  Phone,
  ShieldCheck,
  Building2,
  Trash2,
  Clock
} from "lucide-react";
import { useUsers } from "@/hooks/admin/useUsers";
import AdminShopService from "@/services/admin/shop.service";
import { UserAccount, Shop } from "@/types/admin";
import { UserRole } from "@/types/auth";

export default function AdminUtilisateursPage() {
  const { users, loading, error, shopAccesses, addUser, updateUser, deleteUser, toggleStatus, refresh, fetchShopAccesses } = useUsers();
<<<<<<< HEAD
  
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "Jamais";
    try {
      return new Date(dateString).toLocaleString("fr-FR");
    } catch (e) {
      return "Jamais";
    }
  };

=======
>>>>>>> 708c712647dbef968b1e01a9fb4ead77c04e6e70
  const [shops, setShops] = useState<Shop[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isShopsModalOpen, setIsShopsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
console.log("shopAccesses",shopAccesses)
  // Form state
  const [formData, setFormData] = useState<Partial<UserAccount>>({
    name: "",
    username: "",
    phone: "",
    role: "CASHIER",
    pin: "1234",
    isActive: true,
    shopId: ""
  });

  useEffect(() => {
    const loadShops = async () => {
      try {
        const response = await AdminShopService.getAllShops();
        const res = response as any;
        const list = Array.isArray(res) ? res : (res.data || []);
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
        shopId: selectedUser.shopId
      });
    } else {
      setFormData({
        name: "",
        username: "",
        phone: "",
        role: "CASHIER",
        pin: "1234",
        isActive: true,
        shopId: ""
      });
    }
  }, [selectedUser, isModalOpen]);

  const handleSubmit = async () => {
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, formData);
      } else {
        await addUser(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUsers = Array.isArray(users) ? users.filter(u => {
    if (!u) return false;
    const nameMatch = u.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const usernameMatch = u.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = u.phone?.includes(searchTerm);
    return nameMatch || usernameMatch || phoneMatch;
  }) : [];

  const columns: { header: string; accessor: keyof UserAccount | ((item: UserAccount) => React.ReactNode); className?: string }[] = [
    {
      header: "Utilisateur",
      accessor: (u: UserAccount) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
            {u.name ? u.name[0] : u.username[0]}
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
          <Badge variant={u.role === "ADMIN" || u.role === "SUPER_ADMIN" ? "secondary" : "outline"}>
            {u.role}
          </Badge>
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
            className={`p-2 rounded-lg transition-all ${u.isActive ? 'hover:bg-red-50 text-zinc-400 hover:text-red-600' : 'hover:bg-green-50 text-zinc-400 hover:text-green-600'}`}
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
        <Button variant="primary" size="sm" onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel Utilisateur
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
            {error}
            <button onClick={refresh} className="ml-4 underline">Réessayer</button>
          </div>
        )}
        
        <Card className="p-6">
          <div className="relative max-w-md mb-6">
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
          ) : (
            <DataTable columns={columns} data={filteredUsers} />
          )}
        </Card>
      </div>

      {/* Add/Edit User Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedUser ? "Modifier Utilisateur" : "Nouvel Utilisateur"}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Nom complet</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: Jean Dupont"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Identifiant (Login)</label>
              <input 
                type="text" 
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Ex: j.dupont"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Téléphone</label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Ex: 0701020304"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Rôle</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                <option value="CASHIER">Caissière (Superette)</option>
                <option value="MANAGER">Gérant (Quincaillerie)</option>
                <option value="ADMIN">Administrateur</option>
                <option value="SUPER_ADMIN">Super Administrateur</option>
                <option value="AUDITOR">Auditeur</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Code PIN (4 chiffres)</label>
              <input 
                type="text" 
                maxLength={4}
                value={formData.pin}
                onChange={(e) => setFormData({...formData, pin: e.target.value})}
                placeholder="Ex: 1234"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all tracking-[0.5em]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Assigner à une boutique</label>
            <select 
              value={formData.shopId}
              onChange={(e) => setFormData({...formData, shopId: e.target.value})}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            >
              <option value="">-- Choisir une boutique --</option>
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>{shop.name} ({shop.type})</option>
              ))}
            </select>
          </div>
          
          {!selectedUser && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Key className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Information</span>
                <span className="text-xs font-bold text-foreground tracking-tight">Le mot de passe initial sera identique au PIN.</span>
              </div>
            </div>
          )}

          <Button 
            variant="primary" 
            className="mt-2" 
            onClick={handleSubmit}
            disabled={!formData.name || !formData.username || !formData.pin || formData.pin.length !== 4}
          >
            {selectedUser ? "Mettre à jour l'accès" : "Créer le compte"}
          </Button>
        </div>
      </Modal>

      {/* Shops Access Modal */}
      <Modal
        isOpen={isShopsModalOpen}
        onClose={() => setIsShopsModalOpen(false)}
<<<<<<< HEAD
        title={`Boutiques assignées — ${selectedUser?.name}`}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30 rounded-xl text-xs font-bold self-start">
            <Clock className="h-4 w-4" />
            <span>Dernière connexion : <span className="font-black text-blue-900 dark:text-blue-200">{formatDate(selectedUser?.lastLoginAt)}</span></span>
          </div>
=======
        title={`Boutiques assignées à ${selectedUser?.name}`}
      >
        <div className="flex flex-col gap-4">
>>>>>>> 708c712647dbef968b1e01a9fb4ead77c04e6e70
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : shopAccesses && shopAccesses.length > 0 ? (
            <div className="flex flex-col gap-2">
              {shopAccesses.map((access: any) => (
                <div key={access.shopId} className="p-3 border rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-foreground">{access.shop?.name}</span>
                    <span className="text-xs text-zinc-500">{access.shop?.address}</span>
                  </div>
                  <Badge variant="outline">{access.shop?.type === "superette" ? "Supérette" : "Quincaillerie"}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700">
              Aucune boutique n'est assignée à cet utilisateur.
            </div>
          )}
        </div>
      </Modal>
      {/* Activation/Deactivation Confirm Modal */}
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
        message={`Voulez-vous vraiment ${selectedUser?.isActive ? 'désactiver' : 'activer'} le compte de "${selectedUser?.name}" ?`}
        confirmLabel={selectedUser?.isActive ? "Désactiver" : "Activer"}
        variant={selectedUser?.isActive ? "danger" : "primary"}
      />

      {/* Delete Confirm Modal */}
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
        message={`Attention: Cette action est irréversible. Voulez-vous vraiment supprimer définitivement le compte de "${selectedUser?.name}" ?`}
        confirmLabel="Supprimer définitivement"
        variant="danger"
      />
    </AppLayout>
  );
}
