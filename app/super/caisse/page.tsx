"use client";

import React, { useState, useEffect } from "react";
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
  Wallet,
  CheckCircle2,
  Smartphone,
  CreditCard,
  Banknote,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
}

const mockProducts: Product[] = [
  { id: 1, name: "Eau Minérale 1.5L", price: 500, stock: 45, category: "Boissons" },
  { id: 2, name: "Pain de mie", price: 1200, stock: 15, category: "Boulangerie" },
  { id: 3, name: "Lait en poudre 400g", price: 3500, stock: 24, category: "Alimentation" },
  { id: 4, name: "Savon de Marseille", price: 350, stock: 120, category: "Hygiène" },
  { id: 5, name: "Huile de Palme 1L", price: 1100, stock: 30, category: "Alimentation" },
  { id: 6, name: "Sucre Roux 1kg", price: 850, stock: 50, category: "Alimentation" },
];

export default function SuperCaissePage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<{ id: number; qty: number }[]>([]);
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mtn" | "orange" | "wave">("cash");

  const total = cart.reduce((sum, item) => {
    const p = mockProducts.find((prod) => prod.id === item.id);
    return sum + (p?.price ?? 0) * item.qty;
  }, 0);

  const change = amountReceived ? Math.max(0, parseInt(amountReceived) - total) : 0;

  const addToCart = (product: Product) => {
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

  const clearCart = () => {
    setCart([]);
    setAmountReceived("");
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (paymentMethod === "cash" && (!amountReceived || parseInt(amountReceived) < total)) {
      showToast("Montant reçu insuffisant", "warning");
      return;
    }
    showToast(`Vente validée ! Monnaie : ${change} FCFA`, "success");
    clearCart();
  };

  return (
    <AppLayout title="Caisse Supérette" subtitle="Interface de vente directe" backUrl="/super">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Product Selection */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <Card className="p-5">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Scanner ou rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {mockProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="flex flex-col items-start p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-2xl hover:border-primary/50 transition-all text-left"
                >
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{p.category}</span>
                  <span className="text-xs font-black text-foreground mt-1 line-clamp-1">{p.name}</span>
                  <span className="text-sm font-black text-primary mt-2">{p.price.toLocaleString()} F</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Side: Cart & Checkout */}
        <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
          <Card className="p-6 bg-card border-2 border-primary/10 rounded-3xl shadow-xl flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Panier
              </h3>
              <span className="text-xs font-bold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">{cart.length} articles</span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[300px] flex flex-col gap-2">
              {cart.length === 0 ? (
                <div className="py-12 text-center opacity-20">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-xs font-bold italic">Panier vide</p>
                </div>
              ) : (
                cart.map((item) => {
                  const p = mockProducts.find(prod => prod.id === item.id);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                      <div className="flex flex-col">
                        <span className="text-xs font-black">{p?.name}</span>
                        <span className="text-[10px] font-bold text-primary">{(p?.price ?? 0) * item.qty} F</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-zinc-200 rounded-md"><Minus className="h-3 w-3" /></button>
                        <span className="text-sm font-black w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-zinc-200 rounded-md"><Plus className="h-3 w-3" /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-5">
              <div className="flex justify-between items-center bg-primary/5 p-4 rounded-2xl">
                <span className="text-xs font-black text-zinc-500 uppercase">Total à payer</span>
                <span className="text-2xl font-black text-primary">{total.toLocaleString()} FCFA</span>
              </div>

              {/* Payment Section */}
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <button onClick={() => setPaymentMethod("cash")} className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${paymentMethod === 'cash' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-zinc-400'}`}>
                    <Banknote className="h-4 w-4" />
                    <span className="text-[10px] font-black">ESPECES</span>
                  </button>
                  <button onClick={() => setPaymentMethod("mtn")} className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${paymentMethod === 'mtn' ? 'border-[#FFCC00] bg-[#FFCC00]/5 text-[#FFCC00]' : 'border-border text-zinc-400'}`}>
                    <Smartphone className="h-4 w-4" />
                    <span className="text-[10px] font-black">MOBILE</span>
                  </button>
                </div>

                {paymentMethod === "cash" && (
                  <div className="flex flex-col gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase">Somme Reçue</label>
                      <input
                        type="number"
                        placeholder="Ex: 5000"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="w-full bg-transparent text-lg font-black outline-none"
                      />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-700">
                      <span className="text-[10px] font-black text-zinc-400 uppercase">Monnaie à rendre</span>
                      <span className="text-lg font-black text-emerald-600">{change.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full py-6 font-black text-sm tracking-tight rounded-2xl shadow-lg shadow-primary/20"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                TERMINER LA VENTE
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
