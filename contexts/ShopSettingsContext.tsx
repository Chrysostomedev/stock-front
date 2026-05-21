"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ShopSettingService, { ShopSetting } from "@/services/shop-setting.service";

interface ShopSettingsContextType {
  settings: ShopSetting[];
  loading: boolean;
  getSettingValue: (key: string, defaultValue?: string) => string;
  updateSettingLocal: (key: string, value: string) => void;
  refreshSettings: () => Promise<void>;
}

const ShopSettingsContext = createContext<ShopSettingsContextType | undefined>(undefined);

export function ShopSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ShopSetting[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshSettings = async () => {
    if (!user?.shopId) {
      setSettings([]);
      return;
    }
    setLoading(true);
    try {
      const data = await ShopSettingService.getByShop(user.shopId);
      setSettings(data || []);
    } catch (err) {
      console.error("Failed to load shop settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, [user?.shopId]);

  // Inject Custom Colors (Theme) dynamically in documentElement
  useEffect(() => {
    const themeColor = settings.find((s) => s.key === "theme_color")?.value;

    if (themeColor) {
      document.documentElement.style.setProperty("--primary", themeColor);
      document.documentElement.style.setProperty("--color-primary", themeColor);
      document.documentElement.style.setProperty("--ring", themeColor);
      document.documentElement.style.setProperty("--color-ring", themeColor);
    } else {
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--color-primary");
      document.documentElement.style.removeProperty("--ring");
      document.documentElement.style.removeProperty("--color-ring");
    }

    // Clean up old style tag if exists
    const oldStyle = document.getElementById("custom-theme-variables");
    if (oldStyle) oldStyle.remove();
  }, [settings]);

  const getSettingValue = (key: string, defaultValue: string = ""): string => {
    const item = settings.find((s) => s.key === key);
    return item ? item.value : defaultValue;
  };

  const updateSettingLocal = (key: string, value: string) => {
    setSettings((prev) => {
      const idx = prev.findIndex((s) => s.key === key);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], value };
        return updated;
      } else {
        return [...prev, { id: "", shopId: user?.shopId || null, key, value, group: "general" }];
      }
    });
  };

  return (
    <ShopSettingsContext.Provider
      value={{
        settings,
        loading,
        getSettingValue,
        updateSettingLocal,
        refreshSettings,
      }}
    >
      {children}
    </ShopSettingsContext.Provider>
  );
}

export function useShopSettings() {
  const context = useContext(ShopSettingsContext);
  if (!context) {
    throw new Error("useShopSettings must be used within a ShopSettingsProvider");
  }
  return context;
}
