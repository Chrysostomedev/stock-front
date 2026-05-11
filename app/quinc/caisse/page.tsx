"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Box,
} from "lucide-react";

interface HardwareItem {
  id: number;
  name: string;
  price: number;
  stock: number;
  unit: string;
}

const mockHardware: HardwareItem[] = [
  { id: 1, name: "Ciment Bélier 50kg", price: 4500, stock: 120, unit: "Sac" },
  { id: 2, name: "Fer à Béton 8mm", price: 600, stock: 450, unit: "Barre" },
  { id: 3, name: "Pointes 70mm (1kg)", price: 850, stock: 35, unit: "Paquet" },
  { id: 4, name: "Peinture Ripolin Blanc", price: 18500, stock: 12, unit: "Seau" },
];

export default function QuincaillerieCaissePage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<{ id: number; qty: number; customPrice?: number }[]>([]);
  const [products] = useState<HardwareItem[]>(mockHardware);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mtn" | "moov" | "credit">("cash");

  const filteredItems = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: HardwareItem) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(cart.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item)));
    } else {
      setCart([...cart, { id: product.id, qty: 1 }]);
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(
      cart
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const clearCart = () => setCart([]);

  const getTotal = () => {
    return cart.reduce((sum, item) => {
      const p = products.find((prod) => prod.id === item.id);
      return sum + (item.customPrice ?? p?.price ?? 0) * item.qty;
    }, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    showToast(`Vente quincaillerie enregistrée : ${getTotal()} FCFA !`, "success");
    clearCart();
  };

  return (
    <AppLayout
      title="Caisse Quincaillerie"
      subtitle="Vente de matériaux et gros oeuvre"
      backUrl="/quinc"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="p-5 flex flex-col gap-5">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher un matériau..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map((p) => (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="flex flex-col bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 rounded-2xl p-4 cursor-pointer hover:bg-white dark:hover:bg-zinc-800 hover:border-primary/40 transition-all"
                >
                  <span className="text-[10px] font-black text-zinc-400 uppercase mb-1">{p.unit}</span>
                  <h4 className="text-sm font-black text-foreground">{p.name}</h4>
                  <span className="text-sm font-black text-primary mt-2">{p.price.toLocaleString()} FCFA</span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 mt-1">
                    <Box className="h-3 w-3" />
                    {p.stock} en stock
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
          <Card className="p-6 bg-card border border-border rounded-2xl shadow-2xl flex flex-col gap-6 min-h-[500px]">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Panier
              </h3>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-zinc-400 hover:text-red-500"><Trash2 className="h-5 w-5" /></button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[400px] flex flex-col gap-3">
              {cart.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center opacity-30">
                  <ShoppingCart className="h-10 w-10 text-zinc-400" />
                  <p className="text-xs font-bold mt-4">Panier vide</p>
                </div>
              ) : (
                cart.map((item) => {
                  const p = products.find((prod) => prod.id === item.id);
                  return (
                    <div key={item.id} className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl flex justify-between items-center border border-zinc-100 dark:border-zinc-800/50">
                      <div className="flex flex-col">
                        <span className="text-sm font-black">{p?.name}</span>
                        <span className="text-xs font-bold text-primary">{(p?.price ?? 0) * item.qty} FCFA</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-zinc-100 rounded-md"><Minus className="h-3 w-3" /></button>
                        <span className="text-sm font-black">{item.qty}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-zinc-100 rounded-md"><Plus className="h-3 w-3" /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-zinc-500">TOTAL</span>
                <span className="text-2xl font-black text-primary">{getTotal().toLocaleString()} FCFA</span>
              </div>
              <Button onClick={handleCheckout} disabled={cart.length === 0} variant="primary" className="w-full">Valider la commande</Button>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
