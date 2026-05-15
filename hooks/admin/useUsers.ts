import { useState, useEffect, useCallback } from "react";
import AdminUserService from "../../services/admin/user.service";
import { UserAccount } from "../../types/admin";

export function useUsers() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await AdminUserService.getAllUsers();
      // Le backend peut renvoyer un tableau direct ou un objet paginé { data: [...] }
      const list = (response as any).data && Array.isArray((response as any).data) 
        ? (response as any).data 
        : (Array.isArray(response) ? response : []);
      setUsers(list);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la récupération des utilisateurs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const addUser = async (userData: Partial<UserAccount>) => {
    try {
      const newUser = await AdminUserService.createUser(userData);
      setUsers((prev) => [...prev, newUser]);
      return newUser;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Erreur lors de la création");
    }
  };

  const updateUser = async (id: string, userData: Partial<UserAccount>) => {
    try {
      const updatedUser = await AdminUserService.updateUser(id, userData);
      setUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u)));
      return updatedUser;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Erreur lors de la mise à jour");
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await AdminUserService.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const updatedUser = await AdminUserService.toggleUserStatus(id, !currentStatus);
      setUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u)));
      return updatedUser;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Erreur lors du changement de statut");
    }
  };

  return {
    users,
    loading,
    error,
    refresh: fetchUsers,
    addUser,
    updateUser,
    deleteUser,
    toggleStatus,
  };
}
