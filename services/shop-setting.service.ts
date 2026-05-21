import axiosInstance from "../core/axios";

export interface ShopSetting {
  id: string;
  shopId: string | null;
  key: string;
  value: string;
  group: string;
}

export interface CreateShopSettingDto {
  shopId: string | null;
  key: string;
  value: string;
  group?: string;
}

const ShopSettingService = {
  /**
   * Récupère tous les paramètres d'une boutique
   */
  async getByShop(shopId: string): Promise<ShopSetting[]> {
    const response = await axiosInstance.get(`/shop-settings/shop/${shopId}`);
    return response.data;
  },

  /**
   * Crée ou met à jour un paramètre
   */
  async upsert(data: CreateShopSettingDto): Promise<ShopSetting> {
    const response = await axiosInstance.post("/shop-settings", data);
    return response.data;
  }
};

export default ShopSettingService;
