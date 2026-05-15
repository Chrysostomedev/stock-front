"use client";

import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { TicketReceipt } from "@/components/ui/TicketReceipt";
import { useToast } from "@/contexts/ToastContext";
import ProductService, { Product } from "@/services/product.service";
import CategoryService, { Category } from "@/services/category.service";
import ShopService, { Shop } from "@/services/shop.service";
import CustomerService, { Customer } from "@/services/customer.service";
import SaleService from "@/services/sale.service";
import { useAuth } from "@/hooks/useAuth";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Wallet,
  CheckCircle2,
  Smartphone,
  Banknote,
  Package,
  Zap,
  User,
  Percent,
  List,
  LayoutGrid,
  RefreshCw,
  X
} from "lucide-react";

/**
 * Interface de Caisse Optimisée pour Catalogues Massifs
 */
export default function SuperCaissePage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const componentRef = useRef<HTMLDivElement>(null);

  // États des données
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  // États de recherche et UI
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // État du panier
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // État du paiement
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOBILE_MONEY">("CASH");
  const [mobileProvider, setMobileProvider] = useState<"ORANGE" | "MTN" | "WAVE">("WAVE");
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<string>("");

  const loadData = async () => {
    if (!user?.shopId) return;
    setLoading(true);
    try {
      const [prodRes, catRes, shopRes, custRes] = await Promise.all([
        ProductService.getAll({ isActive: true, shopId: user.shopId, limit: 1000 }),
        CategoryService.getAll({ limit: 100 }),
        ShopService.getById(user.shopId),
        CustomerService.getAll()
      ]);

      const prodList = prodRes?.data && Array.isArray(prodRes.data) ? prodRes.data : (Array.isArray(prodRes) ? prodRes : []);
      const catList = catRes?.data && Array.isArray(catRes.data) ? catRes.data : (Array.isArray(catRes) ? catRes : []);
      const custList = custRes?.data && Array.isArray(custRes.data) ? custRes.data : (Array.isArray(custRes) ? custRes : []);

      setProducts(prodList);
      setCategories(catList);
      setCustomers(custList);
      setCurrentShop(shopRes);
    } catch (error) {
      showToast("Erreur lors du chargement des données", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const addToCart = (product: Product) => {
    if (product.stockQty <= 0) {
      showToast("Stock épuisé !", "error");
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQty) {
          showToast("Limite de stock", "error");
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty > item.product.stockQty) {
          showToast("Stock insuffisant", "error");
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // Calculs financiers
  const subtotal = cart.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const total = subtotal - discountAmount;
  const change = amountReceived ? Math.max(0, parseInt(amountReceived) - total) : 0;

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Ticket_${lastSaleId || 'Vente'}`,
  });

  const handleCheckout = async () => {
    if (cart.length === 0) return showToast("Panier vide", "error");
    if (!user?.shopId) return showToast("Erreur shopId manquant", "error");

    setIsProcessing(true);
    try {
      const saleData = {
        shopId: user.shopId,
        userId: user.id,
        customerId: selectedCustomer?.id || undefined,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.sellingPrice,
          discount: 0 // Remise ligne non gérée ici pour l'instant
        })),
        payments: [{
          method: paymentMethod,
          amount: total,
          reference: paymentMethod === "MOBILE_MONEY" ? `${mobileProvider}_${Date.now()}` : undefined
        }],
        discountAmount: discountAmount,
        notes: `Vente effectuée par ${user.name}`
      };

      const response = await SaleService.create(saleData as any);
      setLastSaleId(response.id);
      showToast("Vente validée !", "success");

      setTimeout(() => {
        handlePrint();
        setCart([]);
        setAmountReceived("");
        setSelectedCustomer(null);
        setDiscountPercent(0);
        loadData();
      }, 300);
    } catch (error) {
      console.error("Sale Error:", error);
      showToast("Erreur lors de la vente. Vérifiez les stocks et la connexion.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(s) || p.barcode?.includes(s) || p.sku?.toLowerCase().includes(s);
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout title="Point de Vente" subtitle={currentShop?.name || "Caisse"}>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-160px)] overflow-hidden">

        {/* CATALOGUE (8/12) */}
        <div className="xl:col-span-8 flex flex-col gap-4 overflow-hidden">

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher (Nom, SKU, Code-barres)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold shadow-sm outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-xl transition-all ${viewMode === "grid" ? "bg-white dark:bg-zinc-700 text-primary shadow-sm" : "text-zinc-400"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-xl transition-all ${viewMode === "list" ? "bg-white dark:bg-zinc-700 text-primary shadow-sm" : "text-zinc-400"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all ${!selectedCategory ? "bg-primary text-white" : "bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800"}`}
            >
              Tous
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all ${selectedCategory === cat.id ? "bg-primary text-white" : "bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Grille Compacte */}
          <div className={`flex-1 overflow-y-auto pr-2 ${viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3" : "flex flex-col gap-2"}`}>
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className={`group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl hover:border-primary/50 transition-all text-left shadow-sm hover:shadow-lg active:scale-95 ${viewMode === "grid" ? "flex flex-col p-3" : "flex items-center justify-between p-3"}`}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-[11px] font-black text-zinc-800 dark:text-zinc-200 truncate">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-primary">{product.sellingPrice} <span className="text-[8px]">XOF</span></span>
                    <span className={`text-[9px] font-bold ${product.stockQty <= product.minStockQty ? "text-red-500" : "text-zinc-400"}`}>
                      Qty: {product.stockQty}
                    </span>
                  </div>
                </div>
                {viewMode === "grid" ? (
                  <div className="mt-2 flex justify-end">
                    <div className="h-6 w-6 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <Plus className="h-3.5 w-3.5" />
                    </div>
                  </div>
                ) : (
                  <div className="h-8 w-8 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <Plus className="h-4 w-4" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* PANIER & PAIEMENT (4/12) */}
        <Card className="xl:col-span-4 flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-900 rounded-3xl">

          {/* Header Panier & Client */}
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col gap-3 bg-zinc-50/50 dark:bg-zinc-800/30">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-widest">
                <ShoppingCart className="h-4 w-4 text-primary" />
                Panier ({cart.length})
              </h2>
              <button onClick={() => setCart([])} className="text-[10px] font-black text-red-500 uppercase hover:underline">Vider</button>
            </div>

            {/* Sélecteur de Client */}
            <div className="relative">
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-2.5 bg-primary/10 border border-primary/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-xs font-black text-primary truncate">{selectedCustomer.name}</span>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="p-1 hover:bg-primary/20 rounded-lg">
                    <X className="h-3 w-3 text-primary" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  <select
                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[11px] font-bold outline-none"
                    onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)}
                  >
                    <option value="">-- Client de passage --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Liste Articles */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {cart.map(item => (
              <div key={item.product.id} className="flex items-center gap-3 p-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-black text-zinc-800 dark:text-zinc-200 truncate">{item.product.name}</h4>
                  <span className="text-[9px] font-bold text-zinc-400">{item.product.sellingPrice} XOF</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5">
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 hover:text-primary"><Minus className="h-3 w-3" /></button>
                    <span className="w-6 text-center text-[10px] font-black">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 hover:text-primary"><Plus className="h-3 w-3" /></button>
                  </div>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-20">
                <ShoppingCart className="h-12 w-12 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">Panier vide</p>
              </div>
            )}
          </div>

          {/* Totaux & Remises */}
          <div className="p-5 bg-zinc-900 dark:bg-black text-white flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-zinc-400 font-bold text-[9px] uppercase tracking-widest">
                <span>Sous-total</span>
                <span>{subtotal.toLocaleString()} XOF</span>
              </div>

              {/* Remise Fidélité - Réservé au Manager/Admin */}
              {(user?.role === "MANAGER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
                <div className="flex justify-between items-center mt-1">
                  <div className="flex items-center gap-2">
                    <Percent className="h-3 w-3 text-amber-500" />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Remise (%)</span>
                  </div>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center text-xs font-black text-amber-500 outline-none"
                  />
                </div>
              )}

              <div className="flex justify-between items-center text-white text-2xl font-black mt-2">
                <span className="text-xs uppercase tracking-tighter text-zinc-500">Total</span>
                <span className="text-primary">{total.toLocaleString()} <span className="text-[10px] text-white/50 font-normal">XOF</span></span>
              </div>
            </div>

            {/* Méthodes de paiement */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-2xl">
              <button onClick={() => setPaymentMethod("CASH")} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${paymentMethod === "CASH" ? "bg-white text-black shadow-lg" : "text-zinc-400 hover:text-white"}`}>
                <Banknote className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Cash</span>
              </button>
              <button onClick={() => setPaymentMethod("MOBILE_MONEY")} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${paymentMethod === "MOBILE_MONEY" ? "bg-primary text-white shadow-lg" : "text-zinc-400 hover:text-white"}`}>
                <Smartphone className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Mobile</span>
              </button>
            </div>

            {paymentMethod === "CASH" ? (
              <div className="flex flex-col gap-2">
                <input
                  type="number"
                  placeholder="Montant encaissé..."
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm font-black text-white outline-none focus:border-primary transition-all"
                />
                {change > 0 && (
                  <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Monnaie à rendre</span>
                    <span className="text-sm font-black text-emerald-400">{change.toLocaleString()} XOF</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {["WAVE", "ORANGE", "MTN"].map(p => (
                  <button key={p} onClick={() => setMobileProvider(p as any)} className={`py-2 rounded-xl text-[8px] font-black border transition-all ${mobileProvider === p ? "bg-white/10 border-primary text-primary" : "border-white/5 text-zinc-600"}`}>{p}</button>
                ))}
              </div>
            )}

            <Button
              onClick={handleCheckout}
              variant="primary"
              className="h-14 w-full text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20"
              loading={isProcessing}
              disabled={cart.length === 0}
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Finaliser {total.toLocaleString()}
            </Button>
          </div>
        </Card>
      </div>

      <div className="hidden">
        <TicketReceipt
          ref={componentRef}
          shop={currentShop}
          user={user}
          items={cart}
          total={total}
          paymentMethod={paymentMethod}
          amountReceived={parseInt(amountReceived) || total}
          change={change}
          saleId={lastSaleId}
        />
      </div>
    </AppLayout>
  );
}
