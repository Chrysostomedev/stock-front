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
    try {
      const response = await axiosInstance.get("/products", { params });
      return response.data;
    } catch (err: any) {
      console.warn("ProductService.getAll failed with params, trying auto-pagination fallback:", err);
      try {
        const cleanParams = { ...params };
        delete cleanParams.limit;
        
        const firstPageResponse = await axiosInstance.get("/products", { 
          params: { ...cleanParams, page: 1 } 
        });
        
        const resData = firstPageResponse.data;
        const total = resData.total || 0;
        const limit = resData.limit || 10;
        const totalPages = resData.totalPages || Math.ceil(total / limit);
        
        const firstPageList = resData.data || resData;
        const allData = Array.isArray(firstPageList) ? [...firstPageList] : [];
        
        if (totalPages <= 1 || !Array.isArray(resData.data)) {
          return {
            ...resData,
            data: allData
          };
        }
        
        const pagePromises = [];
        for (let p = 2; p <= totalPages; p++) {
          pagePromises.push(
            axiosInstance.get("/products", { params: { ...cleanParams, page: p } })
          );
        }
        
        const pagesResults = await Promise.all(pagePromises);
        pagesResults.forEach((pageRes) => {
          const pageList = pageRes.data?.data || pageRes.data;
          if (Array.isArray(pageList)) {
            allData.push(...pageList);
          }
        });
        
        return {
          ...resData,
          data: allData,
          page: 1,
          limit: allData.length,
          totalPages: 1,
          total: allData.length
        };
      } catch (fallbackError) {
        console.error("Auto-pagination fallback failed:", fallbackError);
        throw err;
      }
    }
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
