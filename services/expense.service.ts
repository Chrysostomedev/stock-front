import axiosInstance from "../core/axios";

export type ExpenseCategory = "RENT" | "UTILITIES" | "SALARY" | "SUPPLIES" | "TRANSPORT" | "MAINTENANCE" | "TAXES" | "MARKETING" | "OTHER";

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description?: string;
  receiptUrl?: string;
  shopId: string;
}

const ExpenseService = {
  async getAll(params?: { shopId?: string }) {
    const response = await axiosInstance.get("/expenses", { params });
    return response.data;
  },

  async create(data: Partial<Expense>) {
    const response = await axiosInstance.post("/expenses", data);
    return response.data;
  },

  async delete(id: string) {
    await axiosInstance.delete(`/expenses/${id}`);
  }
};

export default ExpenseService;
