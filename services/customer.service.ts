import axiosInstance from "../core/axios";

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  totalDebt: number;
  creditLimit?: number;
  notes?: string;
  createdAt: string;
}

const CustomerService = {
  async getAll() {
    const response = await axiosInstance.get("/customers");
    return response.data;
  },

  async getPaginated(params: any) {
    const response = await axiosInstance.get("/customers/paginate", { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await axiosInstance.get(`/customers/${id}`);
    return response.data;
  },

  async create(data: Partial<Customer>) {
    const response = await axiosInstance.post("/customers", data);
    return response.data;
  },

  async update(id: string, data: Partial<Customer>) {
    const response = await axiosInstance.put(`/customers/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    await axiosInstance.delete(`/customers/${id}`);
  }
};

export default CustomerService;
