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
  ShoppingCart,
  Search,
  Plus,
  Minus,
  CheckCircle2,
  Smartphone,
  Banknote,
  Wallet,
  User,
  X,
  LayoutGrid,
  List,
  ShoppingBag,
  Package,
  ChevronUp,
  Scissors,
  RefreshCw,
  Trash2,
  Clock,
  Pause,
  Printer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { POS_STYLES } from "@/types/post-caise-super";

/* ─────────────────────────────────────────────────────────
   UTILITAIRES
───────────────────────────────────────────────────────── */
const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

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

  /* 📴 PARTIE OFFLINE : États pour les paniers en attente
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingCarts, setPendingCarts] = useState<{ id: string; name: string; items: CartItem[]; timestamp: string; total: number }[]>(() => {
    try {
      const saved = localStorage.getItem("super_pending_carts");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  ───────────────────────────────────────────────────────── */

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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  /* Paiement */
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOBILE_MONEY">(
    "CASH",
  );
  const [mobileProvider, setMobileProvider] = useState<
    "ORANGE" | "MTN" | "WAVE"
  >("WAVE");
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
  const [saleCustomerSnapshot, setSaleCustomerSnapshot] = useState<
    string | undefined
  >(undefined);
  const [salePayMethodSnapshot, setSalePayMethodSnapshot] =
    useState<string>("CASH");
  const [saleMobileProvSnapshot, setSaleMobileProvSnapshot] = useState<
    string | undefined
  >(undefined);

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
    return () => {
      document.getElementById("pos-styles")?.remove();
    };
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
        try {
          setCashSession(await CashSessionService.getActive(user.id));
        } catch {
          setCashSession(null);
        }
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
        userId: user.id,
        shopId: user.shopId,
      });
      setDailyTotal((prev) => Math.max(prev, overview.kpis.revenue));
      setDailyCount((prev) => Math.max(prev, overview.kpis.totalTransactions));
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
      const prodList =
        prodRes?.data && Array.isArray(prodRes.data)
          ? prodRes.data
          : Array.isArray(prodRes)
            ? prodRes
            : [];
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
    if (!targetShopId) {
      showToast("Aucun point de vente associé", "error");
      return;
    }
    setIsOpeningSession(true);
    try {
      const session = await CashSessionService.open({
        shopId: targetShopId,
        userId: user.id,
        openingBalance: parseFloat(openingBalance) || 0,
        notes: `Session ouverte par ${user.name}`,
      });
      setCashSession(session);
      showToast(
        `Caisse ouverte — ${fmt(parseFloat(openingBalance) || 0)} XOF`,
        "success",
      );
    } catch (e: any) {
      showToast(
        e?.response?.status === 409
          ? "Session déjà active"
          : "Erreur ouverture",
        "error",
      );
    } finally {
      setIsOpeningSession(false);
    }
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
      showToast(
        `Caisse fermée — ${fmt(parseFloat(s) || 0)} XOF déclarés`,
        "success",
      );
    } catch {
      showToast("Erreur lors de la fermeture", "error");
    }
  };

  /* ── Panier ── */
  const addToCart = (product: Product) => {
    if (product.stockQty <= 0) {
      showToast("Stock épuisé", "error");
      return;
    }
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id);
      if (ex) {
        if (ex.quantity >= product.stockQty) {
          showToast("Limite de stock atteinte", "error");
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
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
        setCart((prev) =>
          prev.map((i) =>
            i.product.id === selectedItemId ? { ...i, quantity: 1 } : i,
          ),
        );
      if (numpadMode === "remise") setDiscountAmount(0);
      return;
    }
    if (key === "⌫") {
      const nb = numpadBuffer.slice(0, -1);
      setNumpadBuffer(nb);
      if (numpadMode === "qty" && selectedItemId)
        setCart((prev) =>
          prev.map((i) =>
            i.product.id === selectedItemId
              ? { ...i, quantity: Math.max(1, parseInt(nb) || 1) }
              : i,
          ),
        );
      if (numpadMode === "remise") setDiscountAmount(parseFloat(nb) || 0);
      return;
    }
    const nb = numpadBuffer + key;
    setNumpadBuffer(nb);
    if (numpadMode === "qty" && selectedItemId) {
      const qty = parseInt(nb) || 1;
      const maxStock =
        cart.find((i) => i.product.id === selectedItemId)?.product.stockQty ??
        0;
      setCart((prev) =>
        prev.map((i) =>
          i.product.id === selectedItemId
            ? { ...i, quantity: Math.min(qty, maxStock) }
            : i,
        ),
      );
    }
    if (numpadMode === "remise") setDiscountAmount(parseFloat(nb) || 0);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const nq = item.quantity + delta;
          if (nq > item.product.stockQty) {
            showToast("Stock insuffisant", "error");
            return item;
          }
          return { ...item, quantity: nq };
        })
        .filter((i) => i.quantity > 0),
    );
  };

  /* ── Calculs ── */
  const subtotal = cart.reduce(
    (s, i) => s + i.product.sellingPrice * i.quantity,
    0,
  );
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
          <span
            key={`dots-${idx}`}
            className="px-1 text-[10px] font-bold text-zinc-400"
          >
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
    // Force la transaction en ligne uniquement
    if (!navigator.onLine) {
      return showToast(
        "Connexion internet requise pour effectuer une vente.",
        "error",
      );
    }

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
      setSaleMobileProvSnapshot(
        paymentMethod === "MOBILE_MONEY" ? mobileProvider : undefined,
      );
      setDailyTotal((prev) => prev + total);
      setDailyCount((prev) => prev + 1);
      showToast("Vente validée !", "success");
      setShowPrintConfirm(true);
    } catch (e) {
      console.error(e);
      showToast("Erreur lors de la vente. Vérifiez les stocks.", "error");
    } finally {
      setIsProcessing(false);
    }
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

  /* 📴 PARTIE OFFLINE : Méthodes de mise en attente et localStorage
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
  ───────────────────────────────────────────────────────── */

  return (
    <AppLayout title="Point de Vente" subtitle={currentShop?.name || "Caisse"}>
      <div className="pos-root">
        {/* ── Bannière session ── */}
        {!cashSession ? (
          <div className="pos-session-banner pos-session-closed-banner">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flex: 1,
              }}
            >
              <Wallet size={16} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 12 }}>
                  Ouvrir la caisse
                </div>
                <div style={{ fontSize: 11, opacity: 0.75 }}>
                  Déclarez votre fond initial avant de vendre
                </div>
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: "rgba(255,255,255,.18)",
                  padding: "4px 12px",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ opacity: 0.8 }}>CA jour :</span>
                <strong>{fmt(dailyTotal)} XOF</strong>
                <span style={{ opacity: 0.6 }}>
                  · {dailyCount} vente{dailyCount > 1 ? "s" : ""}
                </span>
              </div>
              <button
                className="pos-close-session-btn"
                onClick={handleCloseSession}
              >
                Fermer la caisse
              </button>
            </div>
          </div>
        )}

        {/* Layout principal */}
        <div className="pos-layout">
          {/* ────── SIDEBAR CATÉGORIES (desktop) ────── */}
          <aside className="pos-sidebar">
            <div className="pos-sidebar-logo">
              <ShoppingBag size={18} />
              <div>
                GestShop
                <div className="pos-sidebar-shop">
                  {currentShop?.name || "Boutique"}
                </div>
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
                  <span>
                    <span className="pos-session-dot" />
                    Session active
                  </span>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>
                    {fmt(cashSession.openingBalance)} XOF fond
                  </span>
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: "1px solid rgba(255,255,255,.15)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        opacity: 0.6,
                        textTransform: "uppercase",
                        letterSpacing: ".08em",
                        fontWeight: 800,
                      }}
                    >
                      CA du jour
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 800 }}>
                      {fmt(dailyTotal)} XOF
                    </span>
                    <span style={{ fontSize: 10, opacity: 0.7 }}>
                      {dailyCount} vente{dailyCount > 1 ? "s" : ""} aujourd'hui
                    </span>
                  </div>
                </div>
              ) : (
                <div className="pos-session-closed">⚠ Caisse fermée</div>
              )}
            </div>
          </aside>

          {/* ────── CATALOGUE PRODUITS ────── */}
          <div className="pos-catalog">
            {/* Header desktop */}
            <div className="pos-catalog-header">
              <div
                className="pos-search-wrap"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
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
                <div
                  style={{ textAlign: "center", padding: "40px", opacity: 0.5 }}
                >
                  <RefreshCw
                    size={24}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                </div>
              ) : products.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    opacity: 0.4,
                    fontSize: 13,
                  }}
                >
                  Aucun produit trouvé
                </div>
              ) : (
                <>
                  {viewMode === "grid" ? (
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
                            {ci && (
                              <div className="pos-in-cart-badge">
                                {ci.quantity}
                              </div>
                            )}
                            <div className="pos-prod-cat">
                              {p.category?.name || "—"}
                            </div>
                            <div className="pos-prod-name">{p.name}</div>
                            <div className="pos-prod-price">
                              {fmt(p.sellingPrice)} <small>XOF</small>
                            </div>
                            <div
                              className={`pos-prod-stock ${p.stockQty <= (p.minStockQty || 5) && p.stockQty > 0 ? "low" : ""}`}
                            >
                              {noStock
                                ? "Rupture de stock"
                                : p.stockQty <= (p.minStockQty || 5)
                                  ? `⚠ ${p.stockQty} restants`
                                  : `${p.stockQty} en stock`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
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
                              <div className="pos-prod-row-sub">
                                {p.category?.name || "—"} ·{" "}
                                {p.sku || p.barcode || ""}
                              </div>
                            </div>
                            {ci && (
                              <span className="pos-prod-row-qty-badge">
                                {ci.quantity}×
                              </span>
                            )}
                            <div className="pos-prod-row-price">
                              {fmt(p.sellingPrice)}{" "}
                              <small
                                style={{
                                  fontSize: 10,
                                  fontWeight: 400,
                                  color: "var(--pos-text3)",
                                }}
                              >
                                XOF
                              </small>
                            </div>
                            <div
                              className={`pos-prod-row-stock ${p.stockQty <= (p.minStockQty || 5) && p.stockQty > 0 ? "low" : ""}`}
                            >
                              {noStock
                                ? "Rupture"
                                : p.stockQty <= (p.minStockQty || 5)
                                  ? `⚠ ${p.stockQty}`
                                  : p.stockQty}
                            </div>
                            <button
                              className="pos-row-add-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!noStock) addToCart(p);
                              }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination */}
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
                      <span className="text-primary font-black">
                        {totalProducts}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400">
                          Taille:
                        </span>
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

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={page === 1}
                          className="p-1 border border-zinc-250 dark:border-zinc-750 rounded-lg text-zinc-500 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-50"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        {renderPageNumbers()}
                        <button
                          type="button"
                          onClick={() =>
                            setPage((prev) => Math.min(prev + 1, totalPages))
                          }
                          disabled={page === totalPages}
                          className="p-1 border border-zinc-250 dark:border-zinc-750 rounded-lg text-zinc-500 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-50"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
