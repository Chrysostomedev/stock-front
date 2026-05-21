import axiosInstance from "../../core/axios";
import { CashSession } from "../../types/quinc";

class QuincCashSessionService {
  async open(data: { shopId: string; userId: string; openingBalance: number; notes?: string }): Promise<CashSession> {
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
      const session = response.data;
      // Le backend retourne null/"" quand pas de session → status 200 avec body vide
      if (session && typeof session === "object" && session.id) {
        return session;
      }
      return null;
    } catch (error: any) {
      // Toute erreur (404, 500, etc.) → pas de session active connue
      console.warn("getActive: aucune session trouvée ou erreur:", error?.response?.status);
      return null;
    }
  }
}

export default new QuincCashSessionService();
