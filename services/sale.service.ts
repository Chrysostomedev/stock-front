import axiosInstance from "../core/axios";

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface SalePayment {
  method: "CASH" | "MOBILE_MONEY" | "BANK_CARD" | "CREDIT" | "MIXED";
  amount: number;
  reference?: string;
}

export interface CreateSaleDto {
  shopId: string;
  userId: string;
  customerId?: string;
  cashSessionId?: string;
  items: SaleItem[];
  payments: SalePayment[];
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
}

const SaleService = {
  /**
   * Enregistrer une nouvelle vente
   */
  async create(data: CreateSaleDto) {
    const response = await axiosInstance.post("/sales", data);
    return response.data;
  },

  /**
   * Récupérer les détails d'une vente
   */
  async getById(id: string) {
    const response = await axiosInstance.get(`/sales/${id}`);
    return response.data;
  },

  /**
   * Lister toutes les ventes (avec filtres optionnels)
   */
  async getAll(params?: { shopId?: string; limit?: number; page?: number }) {
    const response = await axiosInstance.get("/sales", { params });
    return response.data;
  }
};

export default SaleService;
