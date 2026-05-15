import axiosInstance from "../core/axios";

/**
 * Interface pour un produit telle que retournée par le backend
 */
export interface Product {
  id: string;
  name: string;
  barcode?: string;
  sku?: string;
  description?: string;
  buyingPrice: number;
  sellingPrice: number;
  wholeSalePrice?: number;
  stockQty: number;
  minStockQty: number;
  maxStockQty?: number;
  hasBatchTracking: boolean;
  metadata?: any;
  isActive: boolean;
  shopId: string;
  categoryId?: string;
  unitId?: string;
  category?: { name: string };
  shop?: { name: string };
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO pour la création d'un produit
 */
export interface CreateProductDto {
  name: string;
  barcode?: string;
  sku?: string;
  description?: string;
  buyingPrice: number;
  sellingPrice: number;
  wholeSalePrice?: number;
  stockQty?: number;
  minStockQty?: number;
  maxStockQty?: number;
  hasBatchTracking?: boolean;
  metadata?: any;
  isActive?: boolean;
  shopId: string;
  categoryId?: string;
  unitId?: string;
}

const ProductService = {
  /**
   * Récupérer tous les produits avec filtres
   */
  async getAll(params?: any) {
    const response = await axiosInstance.get("/products", { params });
    return response.data;
  },

  /**
   * Récupérer un produit par ID
   */
  async getById(id: string): Promise<Product> {
    const response = await axiosInstance.get(`/products/${id}`);
    return response.data;
  },

  /**
   * Créer un nouveau produit
   */
  async create(data: CreateProductDto): Promise<Product> {
    const response = await axiosInstance.post("/products", data);
    return response.data;
  },

  /**
   * Mettre à jour un produit
   */
  async update(id: string, data: Partial<CreateProductDto>): Promise<Product> {
    const response = await axiosInstance.put(`/products/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer un produit
   */
  async delete(id: string) {
    const response = await axiosInstance.delete(`/products/${id}`);
    return response.data;
  },

  /**
   * Récupérer les alertes de stock pour une boutique
   */
  async getStockAlerts(shopId: string): Promise<Product[]> {
    const response = await axiosInstance.get(`/products/alerts/${shopId}`);
    return response.data;
  }
};

export default ProductService;
