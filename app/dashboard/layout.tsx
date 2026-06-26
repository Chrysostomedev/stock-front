"use client";

import { ReactNode } from "react";
import { DashboardShopProvider, useDashboardShop } from "@/contexts/DashboardShopContext";
import { Store, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

function ShopSelectorBar() {
  const { shopId, shopName, shops, setActiveShopId } = useDashboardShop();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (shops.length <= 1) return null;

  return (
    <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-100 dark:border-zinc-800/60 px-4 py-2">
      <div className="max-w-5xl mx-auto flex items-center gap-2">
        <Store className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest shrink-0">Boutique :</span>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-primary transition-all"
          >
            <span className="text-xs font-black text-zinc-800 dark:text-zinc-100">{shopName}</span>
            <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="absolute top-full left-0 mt-1.5 min-w-48 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-lg overflow-hidden z-50">
              {shops.map((s) => (
                <button
                  key={s.shopId}
                  onClick={() => { setActiveShopId(s.shopId); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors ${s.shopId === shopId ? "bg-primary/5" : ""}`}
                >
                  <div className={`h-2 w-2 rounded-full shrink-0 ${s.shopId === shopId ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-700"}`} />
                  <span className={`text-xs font-black ${s.shopId === shopId ? "text-primary" : "text-zinc-700 dark:text-zinc-300"}`}>
                    {s.shop?.name ?? s.shopId}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-1.5 ml-2 overflow-x-auto">
          {shops.map((s) => (
            <button
              key={s.shopId}
              onClick={() => setActiveShopId(s.shopId)}
              className={`shrink-0 px-3 py-1 rounded-lg text-[10px] font-black transition-all ${s.shopId === shopId ? "bg-primary text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
            >
              {s.shop?.name ?? s.shopId}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShopProvider>
      <ShopSelectorBar />
      {children}
    </DashboardShopProvider>
  );
}
