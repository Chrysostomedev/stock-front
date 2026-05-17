import axiosInstance from "../../core/axios";

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  notes?: string;
}

class QuincSupplierService {
  async getAll(): Promise<Supplier[]> {
    try {
      // Les fournisseurs sont généralement globaux ou liés à la boutique
      const response = await axiosInstance.get("/suppliers");
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Erreur lors de la récupération des fournisseurs:", error);
      throw error;
    }
  }

  async create(data: Partial<Supplier>): Promise<Supplier> {
    try {
      const response = await axiosInstance.post("/suppliers", data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création du fournisseur:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
    try {
      const response = await axiosInstance.patch(`/suppliers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du fournisseur:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`/suppliers/${id}`);
    } catch (error) {
      console.error("Erreur lors de la suppression du fournisseur:", error);
      throw error;
    }
  }
}

export default new QuincSupplierService();
