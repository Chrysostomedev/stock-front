"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import QuincProductService from "@/services/quinc/product.service";
import QuincCashSessionService from "@/services/quinc/cashSession.service";
import QuincSaleService from "@/services/quinc/sale.service";
import { Product, CashSession } from "@/types/quinc";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Box,
  WalletCards,
  AlertCircle
} from "lucide-react";

export default function QuincaillerieCaissePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<{ product: Product; qty: number; customPrice?: number }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [isOpeningSession, setIsOpeningSession] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      if (!user.shopId) {
        showToast("Erreur: Votre compte n'est associé à aucune boutique.", "error");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [sessionRes, productsRes] = await Promise.all([
          QuincCashSessionService.getActive(user.shopId, user.id),
          QuincProductService.getAll(user.shopId)
        ]);
        setActiveSession(sessionRes);
        setProducts(productsRes);
      } catch (error) {
        console.error("Erreur de chargement", error);
        showToast("Erreur lors du chargement des données.", "error");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleOpenSession = async () => {
    if (!user?.shopId) return;
    try {
      setIsOpeningSession(true);
      const newSession = await QuincCashSessionService.open({
        shopId: user.shopId,
        openingBalance: openingBalance
      });
      setActiveSession(newSession);
      showToast("Caisse ouverte avec succès", "success");
    } catch (error: any) {
      showToast(error.response?.data?.message || "Impossible d'ouvrir la caisse.", "error");
    } finally {
      setIsOpeningSession(false);
    }
  };

  const filteredItems = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      if (existing.qty >= product.stockQuantity) {
        showToast("Stock insuffisant !", "error");
        return;
      }
      setCart(cart.map((item) => (item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item)));
    } else {
      if (product.stockQuantity < 1) {
        showToast("Rupture de stock !", "error");
        return;
      }
      setCart([...cart, { product, qty: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id === id) {
            const newQty = item.qty + delta;
            if (newQty > item.product.stockQuantity) {
              showToast("Stock maximum atteint", "error");
              return item;
            }
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const clearCart = () => setCart([]);

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.customPrice ?? item.product.sellingPrice) * item.qty, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !activeSession || !user) return;

    try {
      const salePayload = {
        shopId: user.shopId,
        userId: user.id,
        cashSessionId: activeSession.id,
        totalAmount: getTotal(),
        discountAmount: 0,
        finalAmount: getTotal(),
        paidAmount: getTotal(),
        status: "COMPLETED" as const,
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.qty,
          unitPrice: item.customPrice ?? item.product.sellingPrice,
          totalPrice: (item.customPrice ?? item.product.sellingPrice) * item.qty
        })),
        payments: [{
          method: "CASH" as const,
          amount: getTotal()
        }]
      };

      await QuincSaleService.create(salePayload);
      showToast(`Vente quincaillerie enregistrée : ${getTotal().toLocaleString()} FCFA !`, "success");

      // Update local stock for better UX
      setProducts(products.map(p => {
        const cartItem = cart.find(c => c.product.id === p.id);
        if (cartItem) {
          return { ...p, stockQuantity: p.stockQuantity - cartItem.qty };
        }
        return p;
      }));

      clearCart();
    } catch (error) {
      showToast("Erreur lors de la validation de la vente", "error");
    }
  };

  if (loading) {
    return (
      <AppLayout title="Caisse Quincaillerie" subtitle="Chargement..." backUrl="/quinc">
        <div className="flex items-center justify-center p-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!activeSession) {
    return (
      <AppLayout title="Caisse Quincaillerie" subtitle="Caisse fermée" backUrl="/quinc">
        <div className="max-w-md mx-auto mt-20">
          <Card className="p-8 flex flex-col items-center text-center gap-6">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full">
              <WalletCards className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">Caisse Fermée</h2>
              <p className="text-sm text-zinc-500 mt-2">Vous devez ouvrir une session de caisse pour commencer à encaisser les clients.</p>
            </div>
            <div className="w-full flex flex-col gap-2 text-left">
              <label className="text-xs font-black text-zinc-500 uppercase">Fond de caisse initial (FCFA)</label>
              <input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(Number(e.target.value))}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
              />
            </div>
            <Button variant="primary" className="w-full" onClick={handleOpenSession} disabled={isOpeningSession}>
              {isOpeningSession ? "Ouverture..." : "Ouvrir la Caisse"}
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

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
                  className={`flex flex-col border rounded-2xl p-4 cursor-pointer transition-all ${p.stockQuantity > 0
                    ? "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-100 dark:border-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 hover:border-primary/40"
                    : "bg-red-50/50 border-red-100 opacity-60 cursor-not-allowed"
                    }`}
                >
                  <span className="text-[10px] font-black text-zinc-400 uppercase mb-1">{p.unit}</span>
                  <h4 className="text-sm font-black text-foreground">{p.name}</h4>
                  <span className="text-sm font-black text-primary mt-2">{p.sellingPrice.toLocaleString()} FCFA</span>
                  <div className={`flex items-center gap-1 text-[10px] font-bold mt-1 ${p.stockQuantity > 0 ? "text-zinc-400" : "text-red-500"}`}>
                    <Box className="h-3 w-3" />
                    {p.stockQuantity > 0 ? `${p.stockQuantity} en stock` : "Rupture"}
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
                  return (
                    <div key={item.product.id} className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl flex justify-between items-center border border-zinc-100 dark:border-zinc-800/50">
                      <div className="flex flex-col">
                        <span className="text-sm font-black">{item.product.name}</span>
                        <span className="text-xs font-bold text-primary">{(item.customPrice ?? item.product.sellingPrice) * item.qty} FCFA</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 hover:bg-zinc-100 rounded-md"><Minus className="h-3 w-3" /></button>
                        <span className="text-sm font-black">{item.qty}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 hover:bg-zinc-100 rounded-md"><Plus className="h-3 w-3" /></button>
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
