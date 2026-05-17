import axiosInstance from "../../core/axios";
import { Customer } from "../../types/quinc";

class QuincCustomerService {
  async getAll(shopId: string): Promise<Customer[]> {
    try {
      const response = await axiosInstance.get("/customers", {
        params: { shopId },
      });
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Erreur lors de la récupération des clients:", error);
      throw error;
    }
  }

  async create(data: Partial<Customer>): Promise<Customer> {
    try {
      const response = await axiosInstance.post("/customers", data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création du client:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    try {
      const response = await axiosInstance.patch(`/customers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du client:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`/customers/${id}`);
    } catch (error) {
      console.error("Erreur lors de la suppression du client:", error);
      throw error;
    }
  }
}

export default new QuincCustomerService();
