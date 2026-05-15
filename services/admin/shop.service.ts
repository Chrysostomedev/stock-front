import axiosInstance from "../../core/axios";
import { Shop } from "../../types/admin";

const AdminShopService = {
  async getAllShops(): Promise<Shop[]> {
    const response = await axiosInstance.get("/shops");
    return response.data;
  },

  async createShop(shopData: Partial<Shop>): Promise<Shop> {
    const response = await axiosInstance.post("/shops", shopData);
    return response.data;
  },

  async updateShop(id: string, shopData: Partial<Shop>): Promise<Shop> {
    const response = await axiosInstance.put(`/shops/${id}`, shopData);
    return response.data;
  },

  async deleteShop(id: string): Promise<void> {
    await axiosInstance.delete(`/shops/${id}`);
  },

  async toggleShopStatus(id: string, isActive: boolean): Promise<Shop> {
    const response = await axiosInstance.patch(`/shops/${id}/toggle-active`, { isActive });
    return response.data;
  }
};

export default AdminShopService;
