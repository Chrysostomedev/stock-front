import axiosInstance from "../../core/axios";
import { CashSession } from "../../types/quinc";

class QuincCashSessionService {
  async open(data: { shopId: string; openingBalance: number }): Promise<CashSession> {
    try {
      const response = await axiosInstance.post("/cash-sessions/open", data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'ouverture de la caisse:", error);
      throw error;
    }
  }

  async close(id: string, data: { closingBalance: number; notes?: string }): Promise<CashSession> {
    try {
      const response = await axiosInstance.patch(`/cash-sessions/${id}/close`, data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la fermeture de la caisse:", error);
      throw error;
    }
  }

  async getActive(shopId: string, userId: string): Promise<CashSession | null> {
    try {
      const response = await axiosInstance.get(`/cash-sessions/active/${userId}`);
      // L'endpoint backend retourne la session active pour cet utilisateur. 
      // Si la session est liée à la boutique demandée, on la retourne.
      const session = response.data;
      if (session && session.shopId === shopId) {
        return session;
      }
      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error("Erreur lors de la vérification de la caisse active:", error);
      throw error;
    }
  }
}

export default new QuincCashSessionService();
