"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { shopAccesses } from "@/types/auth";
import ShopService, { Shop } from "@/services/shop.service";

interface DashboardShopContextValue {
  shopId: string;
  shopName: string;
  currentShop: Shop | null;
  shops: shopAccesses[];
  fullShops: Shop[];
  isLoadingShops: boolean;
  setActiveShopId: (id: string) => void;
  refreshShops: () => Promise<void>;
}

const DashboardShopContext = createContext<DashboardShopContextValue>({
  shopId: "",
  shopName: "",
  currentShop: null,
  shops: [],
  fullShops: [],
  isLoadingShops: false,
  setActiveShopId: () => {},
  refreshShops: async () => {},
});

export function DashboardShopProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [shopId, setShopId] = useState("");
  const [fullShops, setFullShops] = useState<Shop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(false);

  // Fallback direct depuis les données du profil utilisateur
  const userAccessShops: shopAccesses[] = user?.shopAccesses?.length
    ? user.shopAccesses.map((acc: any) => {
        const sid = acc.shopId || acc.shop?.id || acc.id;
        return {
          shopId: sid,
          shop: {
            id: sid,
            name: acc.shop?.name || (sid === user?.shopId ? user?.shopName : null) || "Boutique",
            address: acc.shop?.address || "",
            phone: acc.shop?.phone || "",
            currency: acc.shop?.currency || "XOF",
            isActive: acc.shop?.isActive ?? true,
            shopType: (acc.shop?.shopType || "RETAIL") as any,
            shopTypeLabel: acc.shop?.shopTypeLabel || "",
          },
        };
      })
    : user?.shopId
    ? [
        {
          shopId: user.shopId,
          shop: {
            id: user.shopId,
            name: user.shopName ?? "Ma boutique",
            address: "",
            phone: "",
            currency: "XOF",
            isActive: true,
            shopType: "RETAIL" as any,
            shopTypeLabel: "",
          },
        },
      ]
    : [];

  const loadUserShops = useCallback(async () => {
    try {
      setIsLoadingShops(true);

      // 1. Charger la liste complète des boutiques via /shops (contient tous les vrais noms)
      let allShops: Shop[] = [];
      try {
        const res = await ShopService.getAll();
        allShops = Array.isArray(res) ? res : (res as any)?.data || [];
      } catch (err) {
        console.warn("Could not load all shops:", err);
      }

      // Map id -> Shop pour résolution instantanée des noms
      const shopMap = new Map<string, Shop>();
      allShops.forEach((s) => {
        if (s && s.id) shopMap.set(s.id, s);
      });

      // 2. Vérifier les droits et boutiques candidates
      const isSuperOrAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
      let candidateShops: Shop[] = [];

      if (isSuperOrAdmin && allShops.length > 0) {
        candidateShops = allShops;
      } else if (user?.id) {
        // Tenter de charger les boutiques autorisées de l'utilisateur
        try {
          const res = await ShopService.getUserShops(user.id);
          const userSpecific = Array.isArray(res) ? res : (res as any)?.data || [];

          if (userSpecific.length > 0) {
            candidateShops = userSpecific.map((item: any) => {
              if (item.name) return item as Shop;
              if (item.shop?.name) return item.shop as Shop;
              const resolved = shopMap.get(item.shopId || item.id);
              if (resolved) return resolved;
              return {
                id: item.shopId || item.id,
                name: (user.shopId === (item.shopId || item.id) ? user.shopName : null) || "Boutique",
                currency: "XOF",
                isActive: true,
                typeShop: "RETAIL" as any,
                createdAt: "",
                updatedAt: "",
              } as Shop;
            });
          }
        } catch {
          // ignore
        }

        // Si getUserShops n'a rien renvoyé mais que l'utilisateur a user.shopAccesses
        if (candidateShops.length === 0 && user?.shopAccesses?.length) {
          candidateShops = user.shopAccesses.map((acc: any) => {
            const sid = acc.shopId || acc.shop?.id || acc.id;
            const fromMap = shopMap.get(sid);
            return (
              fromMap ||
              acc.shop ||
              ({
                id: sid,
                name: acc.shop?.name || (sid === user.shopId ? user.shopName : null) || "Boutique",
                currency: "XOF",
                isActive: true,
                typeShop: "RETAIL" as any,
                createdAt: "",
                updatedAt: "",
              } as Shop)
            );
          });
        }
      }

      // Si toujours vide, repli sur allShops s'il y en a
      if (candidateShops.length === 0 && allShops.length > 0) {
        candidateShops = allShops;
      }

      // Si toujours vide et que user a un shopId
      if (candidateShops.length === 0 && user?.shopId) {
        const sid = user.shopId;
        const fromMap = shopMap.get(sid);
        candidateShops = [
          fromMap ||
            ({
              id: sid,
              name: user.shopName || "Ma boutique",
              currency: "XOF",
              isActive: true,
              typeShop: "RETAIL" as any,
              createdAt: "",
              updatedAt: "",
            } as Shop),
        ];
      }

      if (candidateShops.length > 0) {
        const sanitized = candidateShops.map((s) => ({
          ...s,
          name: s.name || shopMap.get(s.id)?.name || (user?.shopId === s.id ? user?.shopName : null) || "Boutique",
          currency: s.currency || shopMap.get(s.id)?.currency || "XOF",
        }));
        setFullShops(sanitized);
      }
    } catch (err) {
      console.error("DashboardShopContext load error:", err);
    } finally {
      setIsLoadingShops(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserShops();
  }, [loadUserShops]);

  // Fusionner les sources disponibles
  const availableShops: shopAccesses[] = fullShops.length > 0
    ? fullShops.map((s) => ({
        shopId: s.id,
        shop: {
          id: s.id,
          name: s.name || "Boutique",
          address: s.address || "",
          phone: s.phone || "",
          email: s.email,
          taxId: s.taxId,
          currency: s.currency || "XOF",
          isActive: s.isActive,
          shopType: (s.typeShop || "RETAIL") as any,
          shopTypeLabel: s.shopTypeLabel || "",
        },
      }))
    : userAccessShops;

  useEffect(() => {
    if (!availableShops.length) return;
    const saved = typeof window !== "undefined" ? localStorage.getItem("dashboard_shop_id") : null;
    const valid = saved && availableShops.some((s) => s.shopId === saved);
    if (valid) {
      setShopId(saved!);
    } else if (!shopId || !availableShops.some((s) => s.shopId === shopId)) {
      setShopId(availableShops[0].shopId);
    }
  }, [availableShops, shopId]);

  const setActiveShopId = (id: string) => {
    setShopId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboard_shop_id", id);
    }
  };

  const currentAccess = availableShops.find((s) => s.shopId === shopId);
  const shopName =
    currentAccess?.shop?.name ||
    fullShops.find((s) => s.id === shopId)?.name ||
    (user?.shopId === shopId ? user?.shopName : null) ||
    "Boutique";
  const currentShop: Shop | null =
    fullShops.find((s) => s.id === shopId) ?? (currentAccess?.shop as any) ?? null;

  return (
    <DashboardShopContext.Provider
      value={{
        shopId,
        shopName,
        currentShop,
        shops: availableShops,
        fullShops,
        isLoadingShops,
        setActiveShopId,
        refreshShops: loadUserShops,
      }}
    >
      {children}
    </DashboardShopContext.Provider>
  );
}

export function useDashboardShop() {
  return useContext(DashboardShopContext);
}
