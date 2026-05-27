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
import CashSessionService from "@/services/super/cashSession.service";
import { CashSession } from "@/types/super";
import { useAuth } from "@/hooks/useAuth";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  CheckCircle2,
  Smartphone,
  Banknote,
  User,
  List,
  LayoutGrid,
  X,
  Wallet,
  ArrowLeft,
} from "lucide-react";

/**
 * Interface de Caisse Professionnelle & Multi-support (Desktop / Mobile)
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

  // Session de caisse
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [openingBalance, setOpeningBalance] = useState("");
  const [isOpeningSession, setIsOpeningSession] = useState(false);

  // États de recherche et UI
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Navigation Mobile (Toggle Panier Vue Plein Écran)
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // État du panier
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>(
    [],
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  type PaymentMethod = "CASH" | "MOBILE_MONEY";
  type MobileProvider = "ORANGE" | "MTN" | "WAVE";

  // NOUVEAU : Remise en valeur absolue (Somme brute en XOF)
  const [discountAmountInput, setDiscountAmountInput] = useState<string>("0");

  // État du paiement
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [mobileProvider, setMobileProvider] = useState<MobileProvider>("WAVE");
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<string>("");

  const loadData = async () => {
    if (!user) return;
    if (!user.shopId) {
      showToast(
        "Erreur: Votre compte n'est associé à aucune boutique.",
        "error",
      );
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let prodRes;
      try {
        prodRes = await ProductService.getAll({
          shopId: user.shopId,
          limit: 1000,
        });
      } catch (err) {
        console.warn(
          "Retrying ProductService.getAll without limit due to backend error:",
          err,
        );
        prodRes = await ProductService.getAll({ shopId: user.shopId });
      }

      let catRes;
      try {
        catRes = await CategoryService.getAll({ limit: 1000 });
      } catch (err) {
        console.warn(
          "Retrying CategoryService.getAll without limit due to backend error:",
          err,
        );
        catRes = await CategoryService.getAll();
      }
      const [shopRes, custRes] = await Promise.all([
        user.shopId
          ? ShopService.getById(user.shopId)
          : ShopService.getAll().then((res) => res.data?.[0] || res?.[0]),
        CustomerService.getAll(),
      ]);
      const prodList =
        prodRes?.data && Array.isArray(prodRes.data)
          ? prodRes.data
          : Array.isArray(prodRes)
            ? prodRes
            : [];
      const catList =
        catRes?.data && Array.isArray(catRes.data)
          ? catRes.data
          : Array.isArray(catRes)
            ? catRes
            : [];
      const custList =
        custRes?.data && Array.isArray(custRes.data)
          ? custRes.data
          : Array.isArray(custRes)
            ? custRes
            : [];
      setProducts(prodList);
      setCategories(catList);
      setCustomers(custList);
      setCurrentShop(shopRes);
      if (user?.id) {
        try {
          const session = await CashSessionService.getActive(user.id);
          setCashSession(session);
        } catch {
          setCashSession(null);
        }
      }
    } catch (error) {
      showToast("Erreur lors du chargement des données", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleOpenSession = async () => {
    if (!user?.id)
      return showToast("Erreur: Utilisateur non identifié", "error");

    const targetShopId = user.shopId || currentShop?.id;
    if (!targetShopId)
      return showToast(
        "Erreur: Aucun point de vente associé à votre compte",
        "error",
      );

    const balance = parseFloat(openingBalance) || 0;
    setIsOpeningSession(true);
    try {
      const session = await CashSessionService.open({
        shopId: targetShopId,
        userId: user.id,
        openingBalance: balance,
        notes: `Session ouverte par ${user.name}`,
      });
      setCashSession(session);
      showToast(
        `Session ouverte avec ${balance.toLocaleString()} XOF en caisse`,
        "success",
      );
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 409) {
        showToast("Une session est déjà active", "error");
      } else {
        showToast("Erreur lors de l'ouverture de la session", "error");
      }
    } finally {
      setIsOpeningSession(false);
    }
  };
  const handleCloseSession = async () => {
    if (!cashSession) return;
    const closingStr = prompt("Montant réel compté en caisse (XOF) :");
    if (!closingStr) return;
    const closingBalance = parseFloat(closingStr) || 0;
    try {
      await CashSessionService.close(cashSession.id, {
        closingBalance,
        notes: `Session fermée par ${user?.name}`,
      });
      setCashSession(null);
      showToast(
        `Session fermée. Solde déclaré: ${closingBalance.toLocaleString()} XOF`,
        "success",
      );
    } catch (error) {
      showToast("Erreur lors de la fermeture", "error");
    }
  };
  const addToCart = (product: Product) => {
    if (product.stockQty <= 0) {
      showToast("Stock épuisé !", "error");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQty) {
          showToast("Limite de stock", "error");
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = Math.max(0, item.quantity + delta);
            if (newQty > item.product.stockQty) {
              showToast("Stock insuffisant", "error");
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  // NOUVEAU : Calculs financiers mis à jour pour la somme brute
  const subtotal = cart.reduce(
    (acc, item) => acc + item.product.sellingPrice * item.quantity,
    0,
  );
  const discountAmount = Math.min(
    subtotal,
    parseFloat(discountAmountInput) || 0,
  ); // Sécurité anti-remise supérieure au prix
  const total = subtotal - discountAmount;
  const change = amountReceived
    ? Math.max(0, parseInt(amountReceived) - total)
    : 0;

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Ticket_${lastSaleId || "Vente"}`,
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
        cashSessionId: cashSession?.id || undefined,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.sellingPrice,
          discount: 0,
        })),
        payments: [
          {
            method: paymentMethod,
            amount: total,
            reference:
              paymentMethod === "MOBILE_MONEY"
                ? `${mobileProvider}_${Date.now()}`
                : undefined,
          },
        ],
        discountAmount: discountAmount, // Transmission correcte de la somme fixe
        notes: `Vente effectuée par ${user.name}`,
      };

      const response = await SaleService.create(saleData as any);
      setLastSaleId(response.id);
      showToast("Vente validée !", "success");
      setTimeout(() => {
        handlePrint();
        setCart([]);
        setAmountReceived("");
        setSelectedCustomer(null);
        setDiscountAmountInput("0");
        setIsMobileCartOpen(false); // Ferme le tiroir sur mobile après validation
        loadData();
      }, 300);
    } catch (error) {
      console.error("Sale Error:", error);
      showToast(
        "Erreur lors de la vente. Vérifiez les stocks et la connexion.",
        "error",
      );
    } finally {
      setIsProcessing(false);
    }
  };
  const filteredProducts = products.filter((p) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(s) ||
      p.barcode?.includes(s) ||
      p.sku?.toLowerCase().includes(s);
    const matchesCategory =
      !selectedCategory || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Composant partagé du Panier pour éviter la duplication Desktop / Mobile Drawer
  const renderCartContent = () => (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-900">
      {/* Header Panier */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col gap-3 bg-zinc-50/50 dark:bg-zinc-800/30">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-widest">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Panier ({cart.reduce((sum, i) => sum + i.quantity, 0)})
          </h2>
          <button
            onClick={() => setCart([])}
            className="text-xs font-black text-red-500 uppercase hover:underline"
          >
            Vider
          </button>
        </div>
        {/* Sélecteur de Client */}
        <div className="relative">
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-2.5 bg-primary/10 border border-primary/20 rounded-xl">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="text-xs font-black text-primary truncate">
                  {selectedCustomer.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 hover:bg-primary/20 rounded-lg"
              >
                <X className="h-3 w-3 text-primary" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <select
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                onChange={(e) =>
                  setSelectedCustomer(
                    customers.find((c) => c.id === e.target.value) || null,
                  )
                }
              >
                <option value="">-- Client de passage --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

     {/* Liste Articles défilante - MAXIMISÉE POUR DESKTOP */}
<div className="flex-1 overflow-y-auto p-3 lg:p-4 flex flex-col gap-2.5 min-h-0 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
  {cart.map((item) => (
    <div
      key={item.product.id}
      className="flex items-center justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors"
    >
      {/* Infos produit réorganisées */}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs lg:text-[10px] font-black text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-tight">
          {item.product.name}
        </h4>
        <div className="text-[11px] font-bold text-zinc-400 mt-1">
          {item.product.sellingPrice.toLocaleString()} XOF 
          <span className="font-normal text-zinc-400/60"> x {item.quantity}</span>
        </div>
      </div>

      {/* Actions & Prix de la ligne */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right text-xs lg:text-sm font-black text-zinc-900 dark:text-zinc-100">
          {(item.product.sellingPrice * item.quantity).toLocaleString()} XOF
        </div>
        
        {/* Contrôles de quantité plus compacts sur desktop */}
        <div className="flex items-center bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 shadow-sm">
          <button
            onClick={() => updateQuantity(item.product.id, -1)}
            className="p-1 text-zinc-500 hover:text-primary transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-6 text-center text-xs font-black text-zinc-800 dark:text-zinc-200">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.product.id, 1)}
            className="p-1 text-zinc-500 hover:text-primary transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  ))}
  {cart.length === 0 && (
    <div className="flex-1 flex flex-col items-center justify-center py-16 opacity-25">
      <ShoppingCart className="h-12 w-12 mb-2 text-zinc-400" />
      <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
        Panier vide
      </p>
    </div>
  )}
</div>
{/* Bloc Totaux, Remises & Règlements - COMPACTÉ SUR DESKTOP (`lg:p-3 lg:gap-2`) */}
{/* Bloc Totaux, Remises & Règlements - ANCRÉ ET SÉCURISÉ EN BAS */}
<div className="p-4 lg:p-3 bg-zinc-900 dark:bg-black text-white flex flex-col gap-3 lg:gap-2 shrink-0 border-t border-zinc-800 mt-auto ">
  <div className="flex flex-col gap-1.5">
    <div className="flex justify-between items-center text-zinc-400 font-bold text-[11px] uppercase tracking-widest">
      <span>Sous-total</span>
      <span className="text-zinc-300">{subtotal.toLocaleString()} XOF</span>
    </div>
    {/* Remise brute (XOF) */}
    {(user?.role === "MANAGER" ||
      user?.role === "ADMIN" ||
      user?.role === "SUPER_ADMIN" ||
      user?.role === "CASHIER") && (
      <div className="flex justify-between items-center bg-white/5 px-2 py-1 rounded-lg border border-white/5">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
          Remise (XOF)
        </span>
        <input
          type="number"
          value={discountAmountInput}
          min="0"
          max={subtotal}
          onChange={(e) => setDiscountAmountInput(e.target.value)}
          className="w-24 bg-white/10 border border-white/10 rounded px-2 py-0.5 text-right text-xs font-black text-amber-400 outline-none focus:border-primary"
        />
      </div>
    )}
    
    <div className="flex justify-between items-center text-white font-black mt-1 border-t border-white/10 pt-1.5">
      <span className="text-[11px] uppercase tracking-wider text-zinc-400">Total net</span>
      <span className="text-emerald-400 text-xl lg:text-2xl font-black">
        {total.toLocaleString()} <span className="text-xs font-normal text-white/40">XOF</span>
      </span>
    </div>
  </div>

  {/* Moyens de Paiement */}
  <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-white/5 rounded-lg">
    <button
      onClick={() => setPaymentMethod("CASH")}
      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${paymentMethod === "CASH" ? "bg-white text-black font-black shadow" : "text-zinc-400 hover:text-white text-xs"}`}
    >
      <Banknote className="h-3.5 w-3.5" />
      <span className="text-[10px] font-black uppercase">Espèce</span>
    </button>
    <button
      onClick={() => setPaymentMethod("MOBILE_MONEY")}
      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${paymentMethod === "MOBILE_MONEY" ? "bg-primary text-white font-black shadow" : "text-zinc-400 hover:text-white text-xs"}`}
    >
      <Smartphone className="h-3.5 w-3.5" />
      <span className="text-[10px] font-black uppercase">Mobile</span>
    </button>
  </div>

  {paymentMethod === "CASH" ? (
    <div className="flex flex-col gap-1">
      <input
        type="number"
        placeholder="Montant reçu (XOF)..."
        value={amountReceived}
        onChange={(e) => setAmountReceived(e.target.value)}
        className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 lg:py-2 text-xs lg:text-sm font-black text-white outline-none focus:border-primary text-center placeholder:text-zinc-600"
      />
      {change > 0 && (
        <div className="flex justify-between items-center px-2 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/20">
          <span className="text-[9px] font-black uppercase text-emerald-400">À rendre :</span>
          <span className="text-xs font-black text-emerald-400">{change.toLocaleString()} XOF</span>
        </div>
      )}
    </div>
  ) : (
    <div className="grid grid-cols-3 gap-1">
      {["WAVE", "ORANGE", "MTN"].map((p) => (
        <button
          key={p}
          onClick={() => setMobileProvider(p as any)}
          className={`py-1.5 rounded-md text-[10px] font-black border transition-all ${mobileProvider === p ? "bg-primary text-white border-primary" : "border-white/10 text-zinc-400 bg-white/5"}`}
        >
          {p}
        </button>
      ))}
    </div>
  )}

  <Button
    onClick={handleCheckout}
    variant="primary"
    className="h-10 lg:h-11 w-full text-xs font-black uppercase tracking-wider shadow-md"
    loading={isProcessing}
    disabled={cart.length === 0}
  >
    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
    Encaisser
  </Button>
</div>
</div>
  );
  return (
    <AppLayout title="Point de Vente" subtitle={currentShop?.name || "Caisse"}>
      {/* BANNIÈRE SESSION DE CAISSE */}
      {!cashSession ? (
        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-2xl flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Wallet className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-black text-amber-700 dark:text-amber-400">
                Ouverture obligatoire de session
              </p>
              <p className="text-xs text-amber-600/70">
                Veuillez renseigner le fond de caisse initial pour démarrer.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="number"
              placeholder="Fond initial (XOF)"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800 rounded-xl text-sm font-bold w-full md:w-40 outline-none"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenSession}
              loading={isOpeningSession}
            >
              Valider
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">
              Session Active — Fond de caisse:{" "}
              {cashSession.openingBalance.toLocaleString()} XOF
            </p>
          </div>
          <button
            onClick={handleCloseSession}
            className="px-3 py-1 bg-red-500/10 text-red-600 rounded-lg text-xs font-bold hover:bg-red-500/20"
          >
            Clôturer la caisse
          </button>
        </div>
      )}
      {/* STRATÉGIE RESPONSIVE DE GRILLE SANS CONFLIT */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)] overflow-hidden relative">
        {" "}
        {/* LE CATALOGUE PRODUIT : Prend toute la largeur sur Mobile, et 65% sur Écran Large */}
        <div className="flex-1 lg:w-[60%] xl:w-[62%] flex flex-col gap-4 h-full overflow-hidden">
          {" "}
          {/* Barre recherche & toggles */}
          <div className="flex gap-3 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher un produit (Nom, Barcode, SKU)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:border-primary shadow-sm"
              />
            </div>
            <div className="hidden sm:flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-xl ${viewMode === "grid" ? "bg-white dark:bg-zinc-700 text-primary shadow" : "text-zinc-400"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-xl ${viewMode === "list" ? "bg-white dark:bg-zinc-700 text-primary shadow" : "text-zinc-400"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Catégories de produits */}
          {/* <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${!selectedCategory ? "bg-primary text-white" : "bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200"}`}
            >
              Tous
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${selectedCategory === cat.id ? "bg-primary text-white" : "bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200"}`}
              >
                {cat.name}
              </button>
            ))}
          </div> */}
          {/* Grille Principale Dynamique avec Scroll Autonome */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                  : "flex flex-col gap-2"
              }
            >
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-primary/50 transition-all text-left shadow-sm active:scale-[0.98] ${viewMode === "grid" ? "flex flex-col p-4 h-32 justify-between" : "flex items-center justify-between p-3"}`}
                >
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-xs font-black text-zinc-800 dark:text-zinc-200 truncate">
                      {product.name}
                    </h3>
                    <span className="text-[11px] font-medium text-zinc-400 mt-0.5">
                      SKU: {product.sku || "N/A"}
                    </span>
                  </div>
                  <div
                    className={`flex items-center justify-between mt-2 ${viewMode === "list" && "gap-6"}`}
                  >
                    <span className="text-sm font-black text-primary">
                      {product.sellingPrice.toLocaleString()} XOF
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${product.stockQty <= product.minStockQty ? "bg-red-50 text-red-600" : "bg-zinc-100 text-zinc-600"}`}
                    >
                      Stock: {product.stockQty}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* PANIER DESKTOP SYSTEM : Fixe à droite (35% de l'espace), masqué sur mobile */}
              {/* PANIER DESKTOP SYSTEM : Fixe à droite (35% de l'espace), masqué sur mobile */}
        <div className="hidden lg:block lg:w-[40%] xl:w-[38%] h-[calc(100vh-4rem)] border-l border-zinc-200 dark:border-zinc-800 pl-4 overflow-hidden">
          <Card className="h-full flex flex-col !p-0 overflow-hidden border-none shadow-xl rounded-3xl bg-white dark:bg-zinc-900">
            {renderCartContent()}
          </Card>
        </div>
        {/* ACTION MOBILE : Bouton flottant moderne pour appeler le Panier */}
        {cart.length > 0 && (
          <div className="lg:hidden fixed bottom-6 left-4 right-4 z-40 animate-bounce">
            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="w-full bg-primary text-white h-14 rounded-2xl flex items-center justify-between px-6 shadow-2xl font-black text-sm uppercase tracking-wider"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </div>
                <span>Voir le Panier</span>
              </div>
              <span>{total.toLocaleString()} XOF</span>
            </button>
          </div>
        )}
        {/* TIROIR (DRAWER) MOBILE : S'ouvre en plein écran par-dessus le catalogue */}
        {isMobileCartOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/60 z-50 flex flex-col justify-end transition-opacity duration-300">
            <div className="bg-white dark:bg-zinc-900 w-full h-[92vh] rounded-t-[2.5rem] overflow-hidden flex flex-col shadow-2xl border-t border-zinc-200">
              {/* Entête de fermeture pour le mobile */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50">
                <button
                  onClick={() => setIsMobileCartOpen(false)}
                  className="flex items-center gap-2 text-zinc-600 text-xs font-bold"
                >
                  <ArrowLeft className="h-4 w-4" /> Retour boutique
                </button>
                <span className="text-xs font-black uppercase text-zinc-400">
                  Finalisation de commande
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                {renderCartContent()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zone de rendu d'impression masquée */}
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
