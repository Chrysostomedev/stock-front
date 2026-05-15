import { useState, useEffect, useCallback } from "react";
import AdminShopService from "../../services/admin/shop.service";
import { Shop } from "../../types/admin";

export function useShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShops = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AdminShopService.getAllShops();
      setShops(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la récupération des boutiques");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const addShop = async (shopData: Partial<Shop>) => {
    try {
      const newShop = await AdminShopService.createShop(shopData);
      setShops((prev) => [...prev, newShop]);
      return newShop;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Erreur lors de la création");
    }
  };

  const updateShop = async (id: string, shopData: Partial<Shop>) => {
    try {
      const updatedShop = await AdminShopService.updateShop(id, shopData);
      setShops((prev) => prev.map((s) => (s.id === id ? updatedShop : s)));
      return updatedShop;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Erreur lors de la mise à jour");
    }
  };

  const deleteShop = async (id: string) => {
    try {
      await AdminShopService.deleteShop(id);
      setShops((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const updatedShop = await AdminShopService.toggleShopStatus(id, !currentStatus);
      setShops((prev) => prev.map((s) => (s.id === id ? updatedShop : s)));
      return updatedShop;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Erreur lors du changement de statut");
    }
  };

  return {
    shops,
    loading,
    error,
    refresh: fetchShops,
    addShop,
    updateShop,
    deleteShop,
    toggleStatus,
  };
}
