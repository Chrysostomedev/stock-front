"use client";

import React, { useState } from "react";
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
  User, 
  Edit2, 
  Trash2, 
  Lock, 
  Building2,
  Power,
  Key
} from "lucide-react";

interface UserAccount {
  id: number;
  name: string;
  username: string;
  role: "admin" | "caissiere" | "gerant";
  shop: string;
  status: "actif" | "inactif";
}

const mockUsers: UserAccount[] = [
  { id: 1, name: "Koné Fatou", username: "fatou.kone", role: "caissiere", shop: "Boutique Marcory", status: "actif" },
  { id: 2, name: "Yao Koffi", username: "koffi.yao", role: "gerant", shop: "Dépôt Angré", status: "actif" },
  { id: 3, name: "Admin Principal", username: "admin", role: "admin", shop: "Toutes", status: "actif" },
];

export default function AdminUtilisateursPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [users, setUsers] = useState<UserAccount[]>(mockUsers);

  const columns = [
    {
      header: "Utilisateur",
      accessor: (u: UserAccount) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
            {u.name[0]}
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
        <Badge variant={u.role === "admin" ? "secondary" : "outline"}>{u.role}</Badge>
      ),
    },
    {
      header: "Boutique Assignée",
      accessor: (u: UserAccount) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-3 w-3 text-zinc-400" />
          <span className="text-xs font-bold">{u.shop}</span>
        </div>
      ),
    },
    {
      header: "Statut",
      accessor: (u: UserAccount) => (
        <Badge variant={u.status === "actif" ? "success" : "outline"}>{u.status}</Badge>
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
            onClick={() => { setSelectedUser(u); setIsConfirmOpen(true); }}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-zinc-400 hover:text-red-600 transition-all"
            title={u.status === 'actif' ? "Désactiver" : "Activer"}
          >
            <Power className="h-4 w-4" />
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
        <Card className="p-6">
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <DataTable columns={columns} data={users} />
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
              defaultValue={selectedUser?.name}
              placeholder="Ex: Koné Fatou"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Identifiant (Login)</label>
              <input 
                type="text" 
                defaultValue={selectedUser?.username}
                placeholder="Ex: fatou.kone"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Rôle</label>
              <select 
                defaultValue={selectedUser?.role}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                <option value="caissiere">Caissière (Superette)</option>
                <option value="gerant">Gérant (Quincaillerie)</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Assigner à une boutique</label>
            <select 
              defaultValue={selectedUser?.shop}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            >
              <option value="Boutique Marcory">Boutique Marcory</option>
              <option value="Dépôt Angré">Dépôt Angré</option>
              <option value="Toutes">Toutes les boutiques</option>
            </select>
          </div>
          
          {!selectedUser && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Key className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Mot de passe par défaut</span>
                <span className="text-xs font-bold text-foreground tracking-widest">1234</span>
              </div>
            </div>
          )}

          <Button variant="primary" className="mt-2" onClick={() => setIsModalOpen(false)}>
            {selectedUser ? "Mettre à jour l'accès" : "Créer le compte"}
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setUsers(users.map(u => u.id === selectedUser?.id ? { ...u, status: u.status === 'actif' ? 'inactif' : 'actif' } : u));
          setIsConfirmOpen(false);
        }}
        title={selectedUser?.status === 'actif' ? "Désactiver l'utilisateur" : "Activer l'utilisateur"}
        message={`Voulez-vous vraiment ${selectedUser?.status === 'actif' ? 'désactiver' : 'activer'} le compte de "${selectedUser?.name}" ?`}
        confirmLabel={selectedUser?.status === 'actif' ? "Désactiver" : "Activer"}
        variant={selectedUser?.status === 'actif' ? "danger" : "primary"}
      />
    </AppLayout>
  );
}
