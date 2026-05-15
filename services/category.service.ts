import axiosInstance from "../core/axios";

/**
 * Interface pour une catégorie telle que retournée par le backend
 */
export interface Category {
  id: string;
  name: string;
  description?: string;
  colorHex?: string;
  iconName?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO pour la création d'une catégorie
 */
export interface CreateCategoryDto {
  name: string;
  description?: string;
  colorHex?: string;
  iconName?: string;
  parentId?: string;
}

const CategoryService = {
  /**
   * Récupérer toutes les catégories
   * @param params Filtres et pagination
   */
  async getAll(params?: any) {
    const response = await axiosInstance.get("/categories", { params });
    return response.data;
  },

  /**
   * Récupérer une catégorie par son ID
   */
  async getById(id: string): Promise<Category> {
    const response = await axiosInstance.get(`/categories/${id}`);
    return response.data;
  },

  /**
   * Créer une nouvelle catégorie (ou sous-catégorie si parentId est fourni)
   */
  async create(data: CreateCategoryDto): Promise<Category> {
    const response = await axiosInstance.post("/categories", data);
    return response.data;
  },

  /**
   * Mettre à jour une catégorie existante
   */
  async update(id: string, data: Partial<CreateCategoryDto>): Promise<Category> {
    const response = await axiosInstance.put(`/categories/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer une catégorie
   */
  async delete(id: string) {
    const response = await axiosInstance.delete(`/categories/${id}`);
    return response.data;
  },

  /**
   * Récupérer les sous-catégories d'une catégorie parente
   */
  async getSubcategories(parentId: string): Promise<Category[]> {
    const response = await axiosInstance.get(`/categories/${parentId}/subcategories`);
    return response.data;
  }
};

export default CategoryService;
