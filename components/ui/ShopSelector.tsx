"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDashboardShop } from "@/contexts/DashboardShopContext";
import { Store, ChevronDown, Check, Building2, Sparkles } from "lucide-react";

export default function ShopSelector() {
  const { shops, shopId, shopName, setActiveShopId, currentShop, fullShops } = useDashboardShop();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fermer le menu lors d'un clic en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDisplayName = (item: any) => {
    const name = item?.shop?.name || fullShops?.find((fs) => fs.id === item?.shopId)?.name || item?.name;
    if (!name || name === item?.shopId) return "Boutique";
    return name;
  };

  if (!mounted || !shops || shops.length === 0) {
    return null;
  }

  const activeShopAccess = shops.find((s) => s.shopId === shopId) || shops[0];
  const activeName = (shopName && shopName !== shopId ? shopName : null) || getDisplayName(activeShopAccess);
  const activeCurrency = activeShopAccess?.shop?.currency || currentShop?.currency || "XOF";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bouton sélecteur principal */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-zinc-200/80 dark:border-zinc-700/60 transition-all duration-200 cursor-pointer shadow-sm group select-none"
        title="Changer de boutique"
      >
        <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
          <Store className="h-3.5 w-3.5" />
        </div>

        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 max-w-[110px] sm:max-w-[160px] md:max-w-[200px] truncate leading-tight">
              {activeName}
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-primary/15 text-primary">
              {activeCurrency}
            </span>
          </div>
        </div>

        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-950/10 dark:shadow-zinc-950/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              <Building2 className="h-3.5 w-3.5" />
              Boutiques disponibles
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
              {shops.length}
            </span>
          </div>

          <div className="p-1.5 max-h-64 overflow-y-auto space-y-1">
            {shops.map((item) => {
              const isSelected = item.shopId === shopId;
              const shop = item.shop;
              return (
                <button
                  key={item.shopId}
                  onClick={() => {
                    setActiveShopId(item.shopId);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 text-primary font-black"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        isSelected ? "bg-primary ring-2 ring-primary/30" : "bg-zinc-300 dark:bg-zinc-600"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">{getDisplayName(item)}</p>
                      {shop?.address && (
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">{shop.address}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-black uppercase text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                      {shop?.currency || "XOF"}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
