"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { shopAccesses } from "@/types/auth";

interface DashboardShopContextValue {
  shopId: string;
  shopName: string;
  shops: shopAccesses[];
  setActiveShopId: (id: string) => void;
}

const DashboardShopContext = createContext<DashboardShopContextValue>({
  shopId: "",
  shopName: "",
  shops: [],
  setActiveShopId: () => {},
});

export function DashboardShopProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [shopId, setShopId] = useState("");

  const shops: shopAccesses[] = user?.shopAccesses?.length
    ? user.shopAccesses
    : user?.shopId
    ? [{ shopId: user.shopId, shop: { id: user.shopId, name: user.shopName ?? "Ma boutique", address: "", phone: "", currency: "XOF", isActive: true, shopType: "RETAIL" as any, shopTypeLabel: "" } }]
    : [];

  useEffect(() => {
    if (!shops.length) return;
    const saved = typeof window !== "undefined" ? localStorage.getItem("dashboard_shop_id") : null;
    const valid = saved && shops.some((s) => s.shopId === saved);
    setShopId(valid ? saved! : shops[0].shopId);
  }, [user?.id]);

  const setActiveShopId = (id: string) => {
    setShopId(id);
    localStorage.setItem("dashboard_shop_id", id);
  };

  const shopName = shops.find((s) => s.shopId === shopId)?.shop?.name ?? "";

  return (
    <DashboardShopContext.Provider value={{ shopId, shopName, shops, setActiveShopId }}>
      {children}
    </DashboardShopContext.Provider>
  );
}

export function useDashboardShop() {
  return useContext(DashboardShopContext);
}
