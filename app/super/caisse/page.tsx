"use client";

import Button from "@/components/ui/Button";
import { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import { printReceipt } from "@/lib/printReceipt";
import { useToast } from "@/contexts/ToastContext";
import ProductService, { Product } from "@/services/product.service";
import CategoryService, { Category } from "@/services/category.service";
import ShopService, { Shop } from "@/services/shop.service";
import CustomerService, { Customer } from "@/services/customer.service";
import SaleService from "@/services/sale.service";
import CashSessionService from "@/services/super/cashSession.service";
import CashierDashboardService from "@/services/super/cashierDashboard.service";
import { CashSession } from "@/types/super";
import { useAuth } from "@/hooks/useAuth";
/* ─────────────────────────────────────────────────────────
   ICÔNES INLINE  (lucide-react reste disponible si besoin)
───────────────────────────────────────────────────────── */
import {
  ShoppingCart, Search, Plus, Minus, CheckCircle2,
  Smartphone, Banknote, Wallet, User, X, LayoutGrid,
  List, ShoppingBag, Package,
  ChevronUp, Scissors, RefreshCw, Trash2,
  Clock, Pause, Printer, ChevronLeft, ChevronRight
} from "lucide-react";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { POS_STYLES } from "@/types/post-caise-super";

/* ─────────────────────────────────────────────────────────
   UTILITAIRES
───────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(n));


interface CartItem {
  product: Product;
  quantity: number;
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT PRINCIPAL
───────────────────────────────────────────────────────── */
export default function SuperCaissePage() {
  const { showToast } = useToast();
  const { user } = useAuth();
// États pour les paniers en attente
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingCarts, setPendingCarts] = useState<{ id: string; name: string; items: CartItem[]; timestamp: string; total: number }[]>(() => {
    try {
      const saved = localStorage.getItem("super_pending_carts");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  /* Données */
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  /* Session de caisse */
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [openingBalance, setOpeningBalance] = useState("");
  const [isOpeningSession, setIsOpeningSession] = useState(false);

  /* UI catalogue */
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  /* Pagination et recherche debouncée */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  /* Panier */
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  /* Paiement */
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOBILE_MONEY">("CASH");
  const [mobileProvider, setMobileProvider] = useState<"ORANGE" | "MTN" | "WAVE">("WAVE");
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<string>("");

  /* Stats journalières caissière */
  const [dailyTotal, setDailyTotal] = useState(0);
  const [dailyCount, setDailyCount] = useState(0);

  /* Mobile drawer */
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  /* Confirmation impression + snapshots vente */
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [saleCartSnapshot, setSaleCartSnapshot] = useState<CartItem[]>([]);
  const [saleTotalSnapshot, setSaleTotalSnapshot] = useState(0);
  const [saleSubtotalSnapshot, setSaleSubtotalSnapshot] = useState(0);
  const [saleDiscountSnapshot, setSaleDiscountSnapshot] = useState(0);
  const [saleReceivedSnapshot, setSaleReceivedSnapshot] = useState(0);
  const [saleChangeSnapshot, setSaleChangeSnapshot] = useState(0);
  const [saleCustomerSnapshot, setSaleCustomerSnapshot] = useState<string | undefined>(undefined);
  const [salePayMethodSnapshot, setSalePayMethodSnapshot] = useState<string>("CASH");
  const [saleMobileProvSnapshot, setSaleMobileProvSnapshot] = useState<string | undefined>(undefined);

  /* Desktop POS — sélection ligne + pavé numérique */
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [numpadMode, setNumpadMode] = useState<"qty" | "remise">("qty");
  const [numpadBuffer, setNumpadBuffer] = useState("");

  /* Inject styles */
  useEffect(() => {
    if (document.getElementById("pos-styles")) return;
    const s = document.createElement("style");
    s.id = "pos-styles";
    s.textContent = POS_STYLES;
    document.head.appendChild(s);
    return () => { document.getElementById("pos-styles")?.remove(); };
  }, []);

  // Debounce sur la recherche
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Réinitialiser la page courante si le terme de recherche ou la catégorie change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory]);

  /* ── Chargement des données statiques ── */
  const loadStaticData = async () => {
    if (!user) return;
    if (!user.shopId) {
      showToast("Erreur: compte non associé à une boutique.", "error");
      return;
    }
    try {
      let catRes;
      try {
        catRes = await CategoryService.getByShop(user.shopId, { limit: 100 });
      } catch (err) {
        console.warn("Retrying CategoryService.getByShop without limit:", err);
        catRes = await CategoryService.getByShop(user.shopId);
      }

      const [shopRes, custRes] = await Promise.all([
        user.shopId
          ? ShopService.getById(user.shopId)
          : ShopService.getAll().then((r) => r.data?.[0] || r?.[0]),
        CustomerService.getAll(),
      ]);
      const toList = (r: any) =>
        r?.data && Array.isArray(r.data) ? r.data : Array.isArray(r) ? r : [];

      setCategories(toList(catRes));
      setCustomers(toList(custRes));
      setCurrentShop(shopRes);

      if (user?.id) {
        try { setCashSession(await CashSessionService.getActive(user.id)); }
        catch { setCashSession(null); }
      }
      await loadDailyStats();
    } catch {
      showToast("Erreur lors du chargement des données", "error");
    }
  };

  const loadDailyStats = async () => {
    if (!user?.shopId || !user?.id) return;
    try {
      const overview = await CashierDashboardService.getOverview({
        userId:  user.id,
        shopId:  user.shopId,
      });
      // Jamais écraser un total plus élevé déjà accumulé localement.
      // Empêche le bug où useEffect([user]) re-déclenche ce chargement
      // pendant qu'une vente vient d'être faite mais n'est pas encore
      // reflétée côté backend (lag réseau, offline queue, etc.).
      setDailyTotal(prev => Math.max(prev, overview.kpis.revenue));
      setDailyCount(prev => Math.max(prev, overview.kpis.totalTransactions));
    } catch {
      // non-critique : ne pas bloquer la caisse
    }
  };

  /* ── Chargement dynamique des produits paginés ── */
  const loadProducts = async () => {
    if (!user?.shopId) return;
    setLoading(true);
    try {
      const params: any = {
        shopId: user.shopId,
        page,
        limit,
      };
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      if (selectedCategory) {
        params.categoryId = selectedCategory;
      }

      const prodRes = await ProductService.getAll(params);
      const prodList = prodRes?.data && Array.isArray(prodRes.data) ? prodRes.data : (Array.isArray(prodRes) ? prodRes : []);
      setProducts(prodList);
      setTotalPages(prodRes?.totalPages ?? 1);
      setTotalProducts(prodRes?.total ?? prodList.length);
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de la récupération des produits", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadData = () => {
    loadProducts();
  };

  useEffect(() => {
    loadStaticData();
  }, [user]);

  useEffect(() => {
    loadProducts();
  }, [user, page, limit, debouncedSearch, selectedCategory]);
  /* ── Session ── */
  const handleOpenSession = async () => {
    if (!user?.id) return;
    const targetShopId = user.shopId || currentShop?.id;
    if (!targetShopId) { showToast("Aucun point de vente associé", "error"); return; }
    setIsOpeningSession(true);
    try {
      const session = await CashSessionService.open({
        shopId: targetShopId,
        userId: user.id,
        openingBalance: parseFloat(openingBalance) || 0,
        notes: `Session ouverte par ${user.name}`,
      });
      setCashSession(session);
      showToast(`Caisse ouverte — ${fmt(parseFloat(openingBalance) || 0)} XOF`, "success");
    } catch (e: any) {
      showToast(e?.response?.status === 409 ? "Session déjà active" : "Erreur ouverture", "error");
    } finally { setIsOpeningSession(false); }
  };
  const handleCloseSession = async () => {
    if (!cashSession) return;
    const s = prompt("Montant réel compté en caisse (XOF) :");
    if (!s) return;
    try {
      await CashSessionService.close(cashSession.id, {
        closingBalance: parseFloat(s) || 0,
        notes: `Session fermée par ${user?.name}`,
      });
      setCashSession(null);
      showToast(`Caisse fermée — ${fmt(parseFloat(s) || 0)} XOF déclarés`, "success");
    } catch { showToast("Erreur lors de la fermeture", "error"); }
  };

  /* ── Panier ── */
  const addToCart = (product: Product) => {
    if (product.stockQty <= 0) { showToast("Stock épuisé", "error"); return; }
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id);
      if (ex) {
        if (ex.quantity >= product.stockQty) { showToast("Limite de stock atteinte", "error"); return prev; }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleBarcodeScan = async (barcode: string) => {
    if (!user?.shopId) return;
    try {
      const product = await ProductService.getByBarcode(barcode, user.shopId);
      if (product) {
        addToCart(product);
        showToast(`${product.name} ajouté au panier`, "success");
      } else {
        showToast(`Code-barres "${barcode}" introuvable`, "error");
      }
    } catch {
      showToast("Erreur lors de la recherche du code-barres", "error");
    }
  };

  useBarcodeScanner({ onScan: handleBarcodeScan, enabled: !!cashSession });



  const handleNumpadKey = (key: string) => {
    if (key === "C") {
      setNumpadBuffer("");
      if (numpadMode === "qty" && selectedItemId)
        setCart((prev) => prev.map((i) => i.product.id === selectedItemId ? { ...i, quantity: 1 } : i));
      if (numpadMode === "remise") setDiscountAmount(0);
      return;
    }
    if (key === "⌫") {
      const nb = numpadBuffer.slice(0, -1);
      setNumpadBuffer(nb);
      if (numpadMode === "qty" && selectedItemId)
        setCart((prev) => prev.map((i) => i.product.id === selectedItemId ? { ...i, quantity: Math.max(1, parseInt(nb) || 1) } : i));
      if (numpadMode === "remise") setDiscountAmount(parseFloat(nb) || 0);
      return;
    }
    const nb = numpadBuffer + key;
    setNumpadBuffer(nb);
    if (numpadMode === "qty" && selectedItemId) {
      const qty = parseInt(nb) || 1;
      const maxStock = cart.find((i) => i.product.id === selectedItemId)?.product.stockQty ?? 0;
      setCart((prev) => prev.map((i) => i.product.id === selectedItemId ? { ...i, quantity: Math.min(qty, maxStock) } : i));
    }
    if (numpadMode === "remise") setDiscountAmount(parseFloat(nb) || 0);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const nq = item.quantity + delta;
        if (nq > item.product.stockQty) { showToast("Stock insuffisant", "error"); return item; }
        return { ...item, quantity: nq };
      }).filter((i) => i.quantity > 0)
    );
  };
  /* ── Calculs ── */
  const subtotal = cart.reduce((s, i) => s + i.product.sellingPrice * i.quantity, 0);
  const discAmt = Math.max(0, Math.min(subtotal, discountAmount));
  const total = subtotal - discAmt;
  const received = parseFloat(amountReceived) || 0;
  const change = Math.max(0, received - total);

  const inCart = (id: string) => cart.find((i) => i.product.id === id);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  /* ── Pagination helper ── */
  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 3;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages.map((p, idx) => {
      if (p === "...") {
        return (
          <span key={`dots-${idx}`} className="px-1 text-[10px] font-bold text-zinc-400">
            ...
          </span>
        );
      }

      const isCurrent = p === page;
      return (
        <button
          key={`page-${p}`}
          type="button"
          onClick={() => setPage(p as number)}
          className={`h-6 min-w-[24px] px-1.5 rounded-lg text-[10px] font-black transition-all ${
            isCurrent
              ? "bg-primary text-white shadow-sm"
              : "border border-zinc-250 dark:border-zinc-750 text-zinc-500 hover:bg-white dark:hover:bg-zinc-800"
          }`}
        >
          {p}
        </button>
      );
    });
  };

  /* ── Checkout ── */
  const handleCheckout = async () => {
    if (cart.length === 0) return showToast("Panier vide", "error");
    if (!user?.shopId) return showToast("Boutique non identifiée", "error");
    setIsProcessing(true);
    try {
      const res = await SaleService.create({
        shopId: user.shopId,
        userId: user.id,
        customerId: selectedCustomer?.id || undefined,
        cashSessionId: cashSession?.id || undefined,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPrice: i.product.sellingPrice,
          discount: 0,
        })),
        payments: [{
          method: paymentMethod,
          amount: total,
          reference: paymentMethod === "MOBILE_MONEY" ? `${mobileProvider}_${Date.now()}` : undefined,
        }],
        discountAmount: discAmt,
        notes: `Vente par ${user.name}`,
      } as any);
      setLastSaleId(res.id);
      setSaleCartSnapshot([...cart]);
      setSaleTotalSnapshot(total);
      setSaleSubtotalSnapshot(subtotal);
      setSaleDiscountSnapshot(discAmt);
      setSaleReceivedSnapshot(received || total);
      setSaleChangeSnapshot(change);
      setSaleCustomerSnapshot(selectedCustomer?.name);
      setSalePayMethodSnapshot(paymentMethod);
      setSaleMobileProvSnapshot(paymentMethod === "MOBILE_MONEY" ? mobileProvider : undefined);
      setDailyTotal((prev) => prev + total);
      setDailyCount((prev) => prev + 1);
      showToast("Vente validée !", "success");
      setShowPrintConfirm(true);
    } catch (e) {
      console.error(e);
      showToast("Erreur lors de la vente. Vérifiez les stocks.", "error");
    } finally { setIsProcessing(false); }
  };
  const resetAfterSuperSale = () => {
    setShowPrintConfirm(false);
    setCart([]);
    setAmountReceived("");
    setSelectedCustomer(null);
    setDiscountAmount(0);
    setMobileCartOpen(false);
    loadData();
  };

  const handlePutOnHold = () => {
    if (cart.length === 0) { showToast("Le panier est vide !", "error"); return; }
    const name = prompt("Nom ou note pour ce panier :", `Client #${pendingCarts.length + 1}`);
    if (name === null) return;
    const nameVal = name.trim() || `Client #${pendingCarts.length + 1}`;
    const newPending = {
      id: Math.random().toString(36).slice(-6),
      name: nameVal,
      items: [...cart],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      total,
    };
    const updated = [newPending, ...pendingCarts];
    setPendingCarts(updated);
    localStorage.setItem("super_pending_carts", JSON.stringify(updated));
    setCart([]);
    showToast(`Panier de "${nameVal}" mis en attente.`, "success");
  };
  const handleRestoreCart = (item: { id: string; name: string; items: CartItem[]; total: number }) => {
    setCart(item.items);
    const updated = pendingCarts.filter((c) => c.id !== item.id);
    setPendingCarts(updated);
    localStorage.setItem("super_pending_carts", JSON.stringify(updated));
    setShowPendingModal(false);
    showToast(`Panier de "${item.name}" restauré !`, "success");
  };
  const handleDeletePendingCart = (id: string, name: string) => {
    const updated = pendingCarts.filter((c) => c.id !== id);
    setPendingCarts(updated);
    localStorage.setItem("super_pending_carts", JSON.stringify(updated));
    showToast(`Panier de "${name}" supprimé.`, "success");
  };
  /* ────────────────────────────────────────────────────────
     RENDU
  ──────────────────────────────────────────────────────── */
  return (
    <AppLayout title="Point de Vente" subtitle={currentShop?.name || "Caisse"}>
      <div className="pos-root">

        {/* ── Bannière session ── */}
        {!cashSession ? (
          <div className="pos-session-banner pos-session-closed-banner">
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
              <Wallet size={16} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 12 }}>Ouvrir la caisse</div>
                <div style={{ fontSize: 11, opacity: .75 }}>Déclarez votre fond initial avant de vendre</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number"
                placeholder="Fond initial (XOF)"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="pos-session-input"
              />
              <button
                className="pos-session-btn"
                onClick={handleOpenSession}
                disabled={isOpeningSession}
              >
                {isOpeningSession ? "…" : "Ouvrir"}
              </button>
            </div>
          </div>
        ) : (
          <div className="pos-session-banner pos-session-open-banner">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="pos-session-dot" />
              <span style={{ fontWeight: 700 }}>
                Caisse ouverte — Fond : {fmt(cashSession.openingBalance)} XOF
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,.18)", padding: "4px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ opacity: .8 }}>CA jour :</span>
                <strong>{fmt(dailyTotal)} XOF</strong>
                <span style={{ opacity: .6 }}>· {dailyCount} vente{dailyCount > 1 ? "s" : ""}</span>
              </div>
              <button className="pos-close-session-btn" onClick={handleCloseSession}>
                Fermer la caisse
              </button>
            </div>
          </div>
        )}
        {/* ══ LAYOUT MOBILE (masqué sur desktop) ══ */}
        <div className="pos-mobile-view">
        {/* ── Layout principal ── */}
        <div className="pos-layout">
          {/* ────── SIDEBAR CATÉGORIES (desktop) ────── */}
          <aside className="pos-sidebar">
            <div className="pos-sidebar-logo">
              <ShoppingBag size={18} />
              <div>
                GestShop
                <div className="pos-sidebar-shop">{currentShop?.name || "Boutique"}</div>
              </div>
            </div>

            <div className="pos-cats-list">
              {/* Bouton "Tous" */}
              <button
                className={`pos-cat-btn ${!selectedCategory ? "active" : ""}`}
                onClick={() => setSelectedCategory(null)}
              >
                <LayoutGrid size={14} />
                Tous
                <span className="pos-cat-count">{totalProducts}</span>
              </button>

              {categories.map((cat) => {
                return (
                  <button
                    key={cat.id}
                    className={`pos-cat-btn ${selectedCategory === cat.id ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <Package size={14} />
                    {cat.name}
                  </button>
                );
              })}
            </div>

            <div className="pos-session-bar">
              {cashSession ? (
                <div className="pos-session-open" style={{ gap: 4 }}>
                  <span><span className="pos-session-dot" />Session active</span>
                  <span style={{ fontSize: 10, opacity: .7 }}>{fmt(cashSession.openingBalance)} XOF fond</span>
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,.15)", display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 9, opacity: .6, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 800 }}>CA du jour</span>
                    <span style={{ fontSize: 15, fontWeight: 800 }}>{fmt(dailyTotal)} XOF</span>
                    <span style={{ fontSize: 10, opacity: .7 }}>{dailyCount} vente{dailyCount > 1 ? "s" : ""} aujourd'hui</span>
                  </div>
                </div>
              ) : (
                <div className="pos-session-closed">⚠ Caisse fermée</div>
              )}
            </div>
          </aside>
          {/* ────── CATALOGUE PRODUITS ────── */}
          <div className="pos-catalog">
            {/* ── Header mobile : search + catégories toujours visibles ── */}
            <div className="pos-mobile-header">
              <div className="pos-mobile-search-wrap">
                <Search />
                <input
                  className="pos-mobile-search"
                  type="text"
                  placeholder="Rechercher un produit…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="pos-mobile-cats">
                <button
                  className={`pos-mob-cat ${!selectedCategory ? "active" : ""}`}
                  onClick={() => setSelectedCategory(null)}
                >
                  Tous
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`pos-mob-cat ${selectedCategory === cat.id ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            {/* Header desktop */}
            <div className="pos-catalog-header">
              <div className="pos-search-wrap" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Search />
                <input
                  className="pos-search"
                  type="text"
                  placeholder="Nom, SKU, code-barre…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="pos-view-toggle">
                <button
                  className={`pos-view-btn ${viewMode === "grid" ? "active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Vue grille"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  className={`pos-view-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                  title="Vue liste"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
            {/* Produits */}
            <div className="pos-products-wrap">
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px", opacity: .5 }}>
                  <RefreshCw size={24} style={{ animation: "spin 1s linear infinite" }} />
                </div>
              ) : products.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", opacity: .4, fontSize: 13 }}>
                  Aucun produit trouvé
                </div>
              ) : (
                <>
                  {viewMode === "grid" ? (
                    /* ── VUE GRILLE ── */
                    <div className="pos-product-grid">
                      {products.map((p) => {
                        const ci = inCart(p.id);
                        const noStock = p.stockQty <= 0;
                        return (
                          <div
                            key={p.id}
                            className={`pos-prod-card ${noStock ? "no-stock" : ""}`}
                            onClick={() => !noStock && addToCart(p)}
                          >
                            {ci && <div className="pos-in-cart-badge">{ci.quantity}</div>}
                            <div className="pos-prod-cat">{p.category?.name || "—"}</div>
                            <div className="pos-prod-name">{p.name}</div>
                            <div className="pos-prod-price">
                              {fmt(p.sellingPrice)} <small>XOF</small>
                            </div>
                            <div className={`pos-prod-stock ${p.stockQty <= (p.minStockQty || 5) && p.stockQty > 0 ? "low" : ""}`}>
                              {noStock ? "Rupture de stock" : p.stockQty <= (p.minStockQty || 5) ? `⚠ ${p.stockQty} restants` : `${p.stockQty} en stock`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* ── VUE LISTE ── */
                    <div className="pos-product-list">
                      {products.map((p) => {
                        const ci = inCart(p.id);
                        const noStock = p.stockQty <= 0;
                        return (
                          <div
                            key={p.id}
                            className={`pos-prod-row ${noStock ? "no-stock" : ""}`}
                            onClick={() => !noStock && addToCart(p)}
                          >
                            <div className="pos-prod-row-info">
                              <div className="pos-prod-row-name">{p.name}</div>
                              <div className="pos-prod-row-sub">{p.category?.name || "—"} · {p.sku || p.barcode || ""}</div>
                            </div>
                            {ci && <span className="pos-prod-row-qty-badge">{ci.quantity}×</span>}
                            <div className="pos-prod-row-price">{fmt(p.sellingPrice)} <small style={{ fontSize: 10, fontWeight: 400, color: "var(--pos-text3)" }}>XOF</small></div>
                            <div className={`pos-prod-row-stock ${p.stockQty <= (p.minStockQty || 5) && p.stockQty > 0 ? "low" : ""}`}>
                              {noStock ? "Rupture" : p.stockQty <= (p.minStockQty || 5) ? `⚠ ${p.stockQty}` : p.stockQty}
                            </div>
                            <button className="pos-row-add-btn" onClick={(e) => { e.stopPropagation(); if (!noStock) addToCart(p); }}>
                              <Plus size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination Compacte pour la caisse */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-150 dark:border-zinc-800/60 rounded-2xl p-3 shadow-sm mt-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">
                      <span>Affichage de</span>
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {Math.min((page - 1) * limit + 1, totalProducts)}
                      </span>
                      <span>à</span>
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {Math.min(page * limit, totalProducts)}
                      </span>
                      <span>sur</span>
                      <span className="text-primary font-black">{totalProducts}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Sélecteur de taille */}
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400">Taille:</span>
                        <select
                          value={limit}
                          onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                          }}
                          className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-1.5 py-1 text-[10px] font-bold outline-none cursor-pointer focus:border-primary"
                        >
                          <option value="12">12</option>
                          <option value="24">24</option>
                          <option value="48">48</option>
                          <option value="96">96</option>
                        </select>
                      </div>

                      {/* Chevrons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                          disabled={page === 1}
                          className="p-1 border border-zinc-250 dark:border-zinc-750 rounded-lg text-zinc-500 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>

                        {renderPageNumbers()}

                        <button
                          type="button"
                          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={page === totalPages}
                          className="p-1 border border-zinc-250 dark:border-zinc-750 rounded-lg text-zinc-500 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ────── PANNEAU PANIER & PAIEMENT ────── */}
          <div
            className="pos-cart"
            style={{
              transform: mobileCartOpen ? "translateY(0)" : "translateY(100%)",
              transition: "transform .3s cubic-bezier(.32,.72,0,1)",
            }}
          >
            {/* En-tête */}
            <div className="pos-cart-head">
              <div className="pos-cart-title">
                <ShoppingCart size={14} />
                Panier
                <span className="pos-cart-badge">{totalItems}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {pendingCarts.length > 0 && (
                  <button
                    onClick={() => setShowPendingModal(true)}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: "#7B93C8", background: "rgba(37,99,235,.12)", padding: "4px 8px", borderRadius: 8, border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: ".06em" }}
                  >
                    <Clock size={11} />
                    {pendingCarts.length} en attente
                  </button>
                )}
                {cart.length > 0 && (
                  <button
                    onClick={handlePutOnHold}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: "#7B93C8", background: "rgba(37,99,235,.12)", padding: "4px 8px", borderRadius: 8, border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: ".06em" }}
                  >
                    <Pause size={11} />
                    Attente
                  </button>
                )}
                <button className="pos-cart-clear-btn" onClick={() => setCart([])}>Vider</button>
                {cart.length > 0 && (
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing || cart.length === 0}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 800, color: "#fff", background: isProcessing ? "#6B7280" : "#16A34A", padding: "5px 11px", borderRadius: 8, border: "none", cursor: isProcessing ? "not-allowed" : "pointer", textTransform: "uppercase", letterSpacing: ".05em", flexShrink: 0 }}
                  >
                    <CheckCircle2 size={12} />
                    {isProcessing ? "…" : fmt(total)}
                  </button>
                )}
              </div>
            </div>

            {/* Sélection client */}
            <div className="pos-cust-wrap">
              <div className="pos-cust-label">
                <User size={12} style={{ display: "inline", marginRight: 4, verticalAlign: -2 }} />
                Client
              </div>
              {selectedCustomer ? (
                <div className="pos-cust-selected">
                  <div className="pos-cust-name">
                    <User size={13} />
                    {selectedCustomer.name}
                  </div>
                  <button className="pos-cust-clear" onClick={() => setSelectedCustomer(null)}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <select
                  className="pos-cust-select"
                  onChange={(e) => setSelectedCustomer(customers.find((c) => c.id === e.target.value) || null)}
                  value=""
                >
                  <option value="">— Client de passage —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.phone ? ` (${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Articles */}
            <div className="pos-cart-items">
              {cart.length === 0 ? (
                <div className="pos-cart-empty">
                  <ShoppingCart size={36} />
                  <p>Panier vide</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="pos-ci">
                    <div className="pos-ci-name">{item.product.name}</div>
                    <div className="pos-ci-meta">
                      <span>{fmt(item.product.sellingPrice)} XOF</span>
                      <span>× {item.quantity}</span>
                    </div>
                    <div className="pos-ci-controls">
                      <div className="pos-ci-total">{fmt(item.product.sellingPrice * item.quantity)}</div>
                      <div className="pos-ci-qty-row">
                        <button
                          className="pos-ci-btn del"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus size={11} />
                        </button>
                        <span className="pos-ci-qty">{item.quantity}</span>
                        <button
                          className="pos-ci-btn"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Totaux */}
            <div className="pos-totals">
              <div className="pos-tot-row">
                <span>Sous-total</span>
                <span className="pos-tot-val">{fmt(subtotal)} XOF</span>
              </div>
              <div className="pos-tot-row pos-discount-row">
                <label>
                  <Scissors size={12} />
                  Remise
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    className="pos-discount-input"
                    type="number"
                    min={0}
                    max={subtotal}
                    placeholder="0"
                    value={discountAmount || ""}
                    onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                  <span className="pos-discount-unit">XOF</span>
                </div>
              </div>
              <div className="pos-tot-main">
                <span className="pos-tot-main-label">Total</span>
                <span className="pos-tot-main-val">{fmt(total)} XOF</span>
              </div>
            </div>
            {/* Paiement */}
            <div className="pos-payment">
              <div className="pos-pay-label">Mode de paiement</div>
              <div className="pos-pay-methods">
                <button
                  className={`pos-pay-btn ${paymentMethod === "CASH" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("CASH")}
                >
                  <Banknote size={16} />Espèces
                </button>
                <button
                  className={`pos-pay-btn ${paymentMethod === "MOBILE_MONEY" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("MOBILE_MONEY")}
                >
                  <Smartphone size={16} />Mobile
                </button>
              </div>
              {paymentMethod === "CASH" ? (
                <div className="pos-cash-wrap">
                  <input
                    className="pos-cash-input"
                    type="number"
                    placeholder="Montant reçu…"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                  />
                  {received > 0 && cart.length > 0 && (
                    <div className="pos-change-row">
                      <span className="pos-change-label">Monnaie à rendre</span>
                      <span className="pos-change-val">{fmt(change)} XOF</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pos-mobile-ops">
                  {(["WAVE", "ORANGE", "MTN"] as const).map((op) => (
                    <button
                      key={op}
                      className={`pos-mobile-op ${mobileProvider === op ? "active" : ""}`}
                      onClick={() => setMobileProvider(op)}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              )}

              <button
                className="pos-checkout-btn"
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing}
              >
                <CheckCircle2 size={18} />
                {isProcessing ? "Traitement…" : `Valider · ${fmt(total)} XOF`}
              </button>
            </div>
          </div>
        </div>

        {/* ────── BOUTON PANIER MOBILE (FAB) ────── */}
        <div
          className="pos-cart-fab"
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            padding: "10px 16px",
            background: "var(--pos-surface)",
            borderTop: "1px solid var(--pos-border)",
            display: "flex", alignItems: "center", gap: 12,
            zIndex: 99,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
            {fmt(total)} XOF
          </span>
          <button
            onClick={() => setMobileCartOpen((v) => !v)}
            style={{
              flex: 1, padding: "13px", background: "var(--pos-primary)",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 13, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: ".06em", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: "inherit",
            }}
          >
            <ShoppingCart size={18} />
            Panier
            <span style={{
              background: "var(--pos-accent)", color: "#fff", fontSize: 11,
              fontWeight: 700, padding: "2px 8px", borderRadius: 12,
            }}>
              {totalItems}
            </span>
            <ChevronUp size={16} style={{ marginLeft: 4, transform: mobileCartOpen ? "rotate(180deg)" : "none", transition: "transform .3s" }} />
          </button>
        </div>

        {/* Overlay mobile quand panier ouvert */}
        {mobileCartOpen && (
          <div
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
              zIndex: 199, backdropFilter: "blur(2px)",
            }}
            onClick={() => setMobileCartOpen(false)}
          />
        )}
        </div>{/* fin pos-mobile-view */}

        {/* ══ LAYOUT DESKTOP PRO (masqué sur mobile) ══ */}
        <div className="pos-desktop-view">

          {/* Top bar */}
          <div className="pdt-topbar">
            <div className="pdt-topbar-left">
              <div className="pdt-topbar-field">
                <span className="pdt-topbar-label">Client</span>
                {selectedCustomer ? (
                  <div className="pdt-cust-pill">
                    <User size={12} />{selectedCustomer.name}
                    <button onClick={() => setSelectedCustomer(null)}><X size={11} /></button>
                  </div>
                ) : (
                  <select className="pdt-cust-select" onChange={(e) => setSelectedCustomer(customers.find((c) => c.id === e.target.value) || null)} value="">
                    <option value="">— Passage —</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
              <div className="pdt-topbar-stat"><span>Nb lignes</span><strong>{cart.length}</strong></div>
              <div className="pdt-topbar-stat"><span>Nb articles</span><strong>{totalItems}</strong></div>
              {cashSession && (
                <div className="pdt-topbar-stat pdt-session-ok">
                  <span className="pdt-session-dot" />
                  CA : <strong>{fmt(dailyTotal)}</strong>
                  <span style={{ opacity: .6 }}>· {dailyCount}v</span>
                </div>
              )}
            </div>
            <div className="pdt-topbar-right">
              <span className="pdt-topbar-total-label">Total à régler</span>
              <span className="pdt-topbar-total">{fmt(total)} XOF</span>
            </div>
          </div>

          {/* Zone principale : ticket | numpad */}
          <div className="pdt-main">

            {/* Ticket de vente */}
            <div className="pdt-ticket">
              {cart.length === 0 ? (
                <div className="pdt-ticket-empty"><ShoppingCart size={28} /><p>Sélectionnez des produits</p></div>
              ) : (
                <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                  <table className="pdt-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left" }}>ARTICLE</th>
                        <th>Prix U.</th>
                        <th>Remise</th>
                        <th>Qté</th>
                        <th>Net Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr
                          key={item.product.id}
                          className={`pdt-row${selectedItemId === item.product.id ? " selected" : ""}`}
                          onClick={() => { setSelectedItemId(item.product.id); setNumpadBuffer(String(item.quantity)); setNumpadMode("qty"); }}
                        >
                          <td className="pdt-td-name">{item.product.name}</td>
                          <td className="pdt-td-num">{fmt(item.product.sellingPrice)}</td>
                          <td className="pdt-td-num">—</td>
                          <td className="pdt-td-num pdt-qty">{item.quantity}</td>
                          <td className="pdt-td-num pdt-net">{fmt(item.product.sellingPrice * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="pdt-ticket-footer">
                <div className="pdt-tot-row"><span>Sous-total</span><span>{fmt(subtotal)} XOF</span></div>
                {discAmt > 0 && <div className="pdt-tot-row pdt-disc"><span>Remise</span><span>-{fmt(discAmt)} XOF</span></div>}
                <div className="pdt-tot-row pdt-grand"><span>TOTAL</span><span>{fmt(total)} XOF</span></div>
              </div>
            </div>

            {/* Panneau numpad + paiement */}
            <div className="pdt-numpad-panel">
              <div className="pdt-total-box">
                <span className="pdt-total-label">Total à régler</span>
                <span className="pdt-total-val">{fmt(total)} XOF</span>
              </div>
              <div className="pdt-mode-grid">
                <button
                  className={`pdt-mode-btn${numpadMode === "qty" ? " active" : ""}`}
                  onClick={() => { setNumpadMode("qty"); setNumpadBuffer(selectedItemId ? String(cart.find((i) => i.product.id === selectedItemId)?.quantity ?? "") : ""); }}
                >Quantité</button>
                <button
                  className="pdt-mode-btn pdt-btn-danger"
                  onClick={() => { if (selectedItemId) { setCart((p) => p.filter((i) => i.product.id !== selectedItemId)); setSelectedItemId(null); setNumpadBuffer(""); } }}
                >Enlever</button>
                <button
                  className={`pdt-mode-btn${numpadMode === "remise" ? " active" : ""}`}
                  onClick={() => { setNumpadMode("remise"); setNumpadBuffer(discountAmount ? String(discountAmount) : ""); }}
                >Remise</button>
                <button className="pdt-mode-btn" onClick={() => { setCart([]); setSelectedItemId(null); setNumpadBuffer(""); }}>Vider</button>
              </div>
              <div className="pdt-buffer-display">
                {numpadMode === "qty" && selectedItemId && <span>Qté : <strong>{numpadBuffer || "—"}</strong></span>}
                {numpadMode === "remise" && <span>Remise : <strong>{numpadBuffer || "0"} XOF</strong></span>}
                {numpadMode === "qty" && !selectedItemId && <span style={{ opacity: .4 }}>← Sélectionnez un article</span>}
              </div>
              <div className="pdt-numpad">
                {["7","8","9","4","5","6","1","2","3","C","0","⌫"].map((k) => (
                  <button key={k} className={`pdt-num-btn${k === "C" ? " clear" : k === "⌫" ? " backspace" : ""}`} onClick={() => handleNumpadKey(k)}>{k}</button>
                ))}
              </div>
              <div className="pdt-payment">
                <div className="pdt-pay-methods">
                  <button className={`pdt-pay-btn${paymentMethod === "CASH" ? " active" : ""}`} onClick={() => setPaymentMethod("CASH")}><Banknote size={13} />Espèces</button>
                  <button className={`pdt-pay-btn${paymentMethod === "MOBILE_MONEY" ? " active" : ""}`} onClick={() => setPaymentMethod("MOBILE_MONEY")}><Smartphone size={13} />Mobile</button>
                </div>
                {paymentMethod === "CASH" && (
                  <input className="pdt-cash-input" type="number" placeholder="Montant reçu…" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} />
                )}
                {paymentMethod === "CASH" && received > 0 && cart.length > 0 && (
                  <div className="pdt-change-row"><span>Monnaie à rendre</span><strong>{fmt(change)} XOF</strong></div>
                )}
                {paymentMethod === "MOBILE_MONEY" && (
                  <div className="pdt-mobile-ops">
                    {(["WAVE","ORANGE","MTN"] as const).map((op) => (
                      <button key={op} className={`pdt-mob-op${mobileProvider === op ? " active" : ""}`} onClick={() => setMobileProvider(op)}>{op}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="pdt-annexe">
                {cart.length > 0 && <button className="pdt-hold-btn" onClick={handlePutOnHold}><Pause size={12} />Attente</button>}
                {pendingCarts.length > 0 && <button className="pdt-hold-btn" onClick={() => setShowPendingModal(true)}><Clock size={12} />{pendingCarts.length} en attente</button>}
              </div>
            </div>
          </div>

          {/* Barre recherche + catégories */}
          <div className="pdt-catbar">
            <div className="pdt-search-box">
              <Search size={14} />
              <input className="pdt-search" type="text" placeholder="Nom, SKU, code-barre…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="pdt-cats">
              <button className={`pdt-cat-btn${!selectedCategory ? " active" : ""}`} onClick={() => setSelectedCategory(null)}>
                Tous <span className="pdt-cat-count">{totalProducts}</span>
              </button>
              {categories.map((cat) => (
                <button key={cat.id} className={`pdt-cat-btn${selectedCategory === cat.id ? " active" : ""}`} onClick={() => setSelectedCategory(cat.id)}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grille produits */}
          <div className="pdt-products">
            {loading ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "20px", opacity: .5 }}>
                <RefreshCw size={20} style={{ animation: "spin 1s linear infinite" }} />
              </div>
            ) : products.length === 0 ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "20px", opacity: .4, fontSize: 12 }}>Aucun produit</div>
            ) : (
              products.map((p) => {
                const ci = inCart(p.id);
                const noStock = p.stockQty <= 0;
                return (
                  <button
                    key={p.id}
                    className={`pdt-prod-btn${noStock ? " no-stock" : ""}${ci ? " in-cart" : ""}`}
                    onClick={() => !noStock && addToCart(p)}
                    title={`${p.name} — ${fmt(p.sellingPrice)} XOF`}
                  >
                    {ci && <span className="pdt-prod-badge">{ci.quantity}</span>}
                    <span className="pdt-prod-name">{p.name}</span>
                    <span className="pdt-prod-price">{fmt(p.sellingPrice)}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Encaisser */}
          <div className="pdt-footer">
            <button
              className="pdt-encaisser-btn"
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing || !cashSession}
            >
              <CheckCircle2 size={20} />
              {isProcessing ? "Traitement en cours…" : `ENCAISSER  —  ${fmt(total)} XOF`}
            </button>
          </div>

        </div>{/* fin pos-desktop-view */}

      </div>
      {/* Modal des Paniers en attente */}
      {showPendingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2.5">
                <Clock className="h-5 w-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">Paniers en attente</h3>
                  <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{pendingCarts.length} paniers suspendus</p>
                </div>
              </div>
              <button onClick={() => setShowPendingModal(false)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
            
            <div className="p-4 max-h-[360px] overflow-y-auto flex flex-col gap-2.5">
              {pendingCarts.map((item) => (
                <div key={item.id} className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-150/40 dark:border-zinc-800 flex justify-between items-center group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-zinc-800 dark:text-zinc-200 truncate">{item.name}</span>
                      <span className="text-[9px] font-bold text-zinc-400 bg-zinc-200/50 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{item.timestamp}</span>
                    </div>
                    <p className="text-[9px] font-bold text-zinc-400 mt-1">
                      {item.items.reduce((acc: number, it: CartItem) => acc + it.quantity, 0)} articles • {fmt(item.total)} XOF
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestoreCart(item)}
                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      Récupérer
                    </button>
                    <button
                      onClick={() => handleDeletePendingCart(item.id, item.name)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-xl transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {pendingCarts.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center opacity-30 text-center">
                  <Clock className="h-10 w-10 text-zinc-400 mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest">Aucun panier suspendu</p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-150 dark:border-zinc-800 flex justify-end">
              <Button onClick={() => setShowPendingModal(false)} variant="outline" size="sm" className="text-[10px] font-black tracking-widest uppercase">
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmation impression ── */}
      {showPrintConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 340, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.25)", display: "flex", flexDirection: "column", gap: 20, fontFamily: "inherit" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Printer size={24} style={{ color: "#2563EB" }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F1E3D" }}>Imprimer le ticket ?</div>
                <div style={{ fontSize: 12, color: "#8A9BBD", marginTop: 3 }}>
                  {saleCartSnapshot.length} article{saleCartSnapshot.length > 1 ? "s" : ""} · Total : <strong>{fmt(saleTotalSnapshot)} FCFA</strong>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={resetAfterSuperSale}
                style={{ flex: 1, padding: "12px 0", border: "1.5px solid #D0DBF0", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "#4A5A7A", background: "#fff", cursor: "pointer", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "inherit" }}
              >
                Non merci
              </button>
              <button
                onClick={() => {
                  printReceipt({
                    shop: currentShop,
                    user,
                    items: saleCartSnapshot,
                    subtotal: saleSubtotalSnapshot,
                    discountAmount: saleDiscountSnapshot,
                    total: saleTotalSnapshot,
                    paymentMethod: salePayMethodSnapshot,
                    mobileProvider: saleMobileProvSnapshot,
                    amountReceived: saleReceivedSnapshot,
                    change: saleChangeSnapshot,
                    saleId: lastSaleId,
                    customerName: saleCustomerSnapshot,
                  });
                  resetAfterSuperSale();
                }}
                style={{ flex: 1, padding: "12px 0", background: "#2563EB", border: "none", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "inherit" }}
              >
                Oui, imprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}