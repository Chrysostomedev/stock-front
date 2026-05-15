import axiosInstance from "../core/axios";

export interface Shop {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  logoUrl?: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ShopService = {
  async getAll() {
    const response = await axiosInstance.get("/shops");
    return response.data;
  },

  async getById(id: string): Promise<Shop> {
    const response = await axiosInstance.get(`/shops/${id}`);
    return response.data;
  },

  async create(data: any): Promise<Shop> {
    const response = await axiosInstance.post("/shops", data);
    return response.data;
  },

  async update(id: string, data: any): Promise<Shop> {
    const response = await axiosInstance.put(`/shops/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await axiosInstance.delete(`/shops/${id}`);
    return response.data;
  }
};

export default ShopService;
