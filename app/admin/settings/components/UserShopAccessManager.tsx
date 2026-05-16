"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { Search, ShieldCheck, Building2, Trash2, Edit2, Plus, ArrowRight } from "lucide-react";
import AdminUserService from "@/services/admin/user.service";
import AdminShopService from "@/services/admin/shop.service";
import UserShopAccessService from "@/services/admin/userShopAccess.service";
import { UserAccount, Shop, UserShopAccess } from "@/types/admin";
import { UserRole } from "@/types/auth";
import { useToast } from "@/contexts/ToastContext";

interface UserShopAccessManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserShopAccessManager({ isOpen, onClose }: UserShopAccessManagerProps) {
  const { showToast } = useToast();
  
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [accesses, setAccesses] = useState<UserShopAccess[]>([]);
  const [accessesLoading, setAccessesLoading] = useState(false);

  // Form states
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("CASHIER");

  // Edit / Delete states
  const [editingAccess, setEditingAccess] = useState<UserShopAccess | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("CASHIER");
  const [deleteConfirmAccess, setDeleteConfirmAccess] = useState<UserShopAccess | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [usersRes, shopsRes] = await Promise.all([
        AdminUserService.getAllUsers(),
        AdminShopService.getAllShops(),
      ]);
      
      const userList = (usersRes as any).data && Array.isArray((usersRes as any).data) 
        ? (usersRes as any).data 
        : (Array.isArray(usersRes) ? usersRes : []);
        
      const shopList = (shopsRes as any).data && Array.isArray((shopsRes as any).data)
        ? (shopsRes as any).data
        : (Array.isArray(shopsRes) ? shopsRes : []);
        
      setUsers(userList);
      setShops(shopList);
    } catch (error) {
      showToast("Erreur lors du chargement des données", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user: UserAccount) => {
    setSelectedUser(user);
    setIsAssigning(false);
    setEditingAccess(null);
    try {
      setAccessesLoading(true);
      const data = await UserShopAccessService.listShopsForUser(user.id);
      setAccesses(data || []);
    } catch (error) {
      showToast("Erreur lors du chargement des accès", "error");
    } finally {
      setAccessesLoading(false);
    }
  };

  const handleAssignAccess = async () => {
    if (!selectedUser || !selectedShopId || !selectedRole) return;
    
    try {
      await UserShopAccessService.assignUserToShop(selectedUser.id, selectedShopId, selectedRole);
      showToast("Accès assigné avec succès", "success");
      
      // Refresh accesses
      const data = await UserShopAccessService.listShopsForUser(selectedUser.id);
      setAccesses(data || []);
      
      setIsAssigning(false);
      setSelectedShopId("");
      setSelectedRole("CASHIER");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Erreur lors de l'assignation";
      showToast(Array.isArray(msg) ? msg[0] : msg, "error");
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !editingAccess || !editRole) return;
    
    try {
      await UserShopAccessService.updateUserRole(selectedUser.id, editingAccess.shopId, editRole);
      showToast("Rôle mis à jour avec succès", "success");
      
      // Refresh accesses
      const data = await UserShopAccessService.listShopsForUser(selectedUser.id);
      setAccesses(data || []);
      
      setEditingAccess(null);
    } catch (error: any) {
      showToast("Erreur lors de la mise à jour", "error");
    }
  };

  const handleDeleteAccess = async () => {
    if (!selectedUser || !deleteConfirmAccess) return;
    
    try {
      await UserShopAccessService.removeUserFromShop(selectedUser.id, deleteConfirmAccess.shopId);
      showToast("Accès révoqué avec succès", "success");
      
      // Refresh accesses
      const data = await UserShopAccessService.listShopsForUser(selectedUser.id);
      setAccesses(data || []);
      
      setDeleteConfirmAccess(null);
    } catch (error: any) {
      showToast("Erreur lors de la suppression de l'accès", "error");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Gestion des Accès Multi-Boutiques" size="xl">
        <div className="flex flex-col md:flex-row gap-6 h-[600px] -mx-2">
          
          {/* LEFT PANE: Users List */}
          <div className="w-full md:w-1/3 flex flex-col border-r border-zinc-100 dark:border-zinc-800 pr-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {loading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center text-xs text-zinc-500 py-4">Aucun utilisateur trouvé</div>
              ) : (
                filteredUsers.map(user => (
                  <div 
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      selectedUser?.id === user.id 
                        ? 'bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30' 
                        : 'bg-zinc-50 dark:bg-zinc-800/30 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black ${
                        selectedUser?.id === user.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                      }`}>
                        {user.name ? user.name[0] : user.username[0]}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold text-foreground truncate">{user.name}</span>
                        <span className="text-[10px] text-zinc-400 font-bold truncate">{user.role}</span>
                      </div>
                      <ArrowRight className={`ml-auto h-4 w-4 transition-all ${selectedUser?.id === user.id ? 'text-primary' : 'text-transparent'}`} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT PANE: User Access Details */}
          <div className="w-full md:w-2/3 flex flex-col pl-2">
            {!selectedUser ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 space-y-4">
                <div className="h-16 w-16 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                  <ShieldCheck className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                </div>
                <p className="text-sm font-bold">Sélectionnez un utilisateur pour gérer ses accès</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h4 className="text-lg font-black text-foreground">{selectedUser.name}</h4>
                    <p className="text-xs text-zinc-500 font-bold">{selectedUser.username} • {selectedUser.phone || 'Pas de téléphone'}</p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setIsAssigning(!isAssigning)}>
                    {isAssigning ? 'Annuler' : <><Plus className="h-4 w-4 mr-1.5" /> Nouvelle assignation</>}
                  </Button>
                </div>

                {isAssigning && (
                  <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl flex flex-col gap-4 animate-in slide-in-from-top-2">
                    <h5 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Ajouter un accès boutique</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black text-emerald-700/70 dark:text-emerald-500 uppercase">Boutique</label>
                        <select 
                          value={selectedShopId}
                          onChange={(e) => setSelectedShopId(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all"
                        >
                          <option value="">-- Choisir --</option>
                          {shops.map(shop => (
                            <option key={shop.id} value={shop.id} disabled={accesses.some(a => a.shopId === shop.id)}>
                              {shop.name} {accesses.some(a => a.shopId === shop.id) ? '(Déjà assigné)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black text-emerald-700/70 dark:text-emerald-500 uppercase">Rôle</label>
                        <select 
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                          className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all"
                        >
                          <option value="CASHIER">Caissier</option>
                          <option value="MANAGER">Manager</option>
                          <option value="ADMIN">Administrateur</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button variant="primary" size="sm" onClick={handleAssignAccess} disabled={!selectedShopId}>
                        Assigner l'accès
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto">
                  <h5 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-4">Boutiques assignées ({accesses.length})</h5>
                  
                  {accessesLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : accesses.length === 0 ? (
                    <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-800/30 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-500 text-sm font-bold">
                      Cet utilisateur n'a accès à aucune boutique.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {accesses.map((access) => (
                        <div key={access.id} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-between group hover:border-primary/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-500">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-foreground">{access.shop?.name || 'Boutique Inconnue'}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={access.roleInShop === 'MANAGER' || access.roleInShop === 'ADMIN' ? 'secondary' : 'outline'}>
                                  {access.roleInShop}
                                </Badge>
                                {access.shop?.address && <span className="text-[10px] text-zinc-400 font-bold">{access.shop.address}</span>}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setEditingAccess(access); setEditRole(access.roleInShop); }}
                              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"
                              title="Modifier le rôle"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmAccess(access)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-zinc-400 hover:text-red-600 transition-all"
                              title="Révoquer l'accès"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Role Modal */}
      <Modal isOpen={!!editingAccess} onClose={() => setEditingAccess(null)} title="Modifier le rôle" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
            Modification du rôle de {selectedUser?.name} pour la boutique <span className="text-foreground">{editingAccess?.shop?.name}</span>.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Nouveau Rôle</label>
            <select 
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as UserRole)}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            >
              <option value="CASHIER">Caissier</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditingAccess(null)}>Annuler</Button>
            <Button variant="primary" onClick={handleUpdateRole}>Mettre à jour</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmAccess}
        onClose={() => setDeleteConfirmAccess(null)}
        onConfirm={handleDeleteAccess}
        title="Révoquer l'accès"
        message={`Êtes-vous sûr de vouloir révoquer l'accès de "${selectedUser?.name}" à la boutique "${deleteConfirmAccess?.shop?.name}" ?`}
        confirmLabel="Révoquer l'accès"
        variant="danger"
      />
    </>
  );
}
