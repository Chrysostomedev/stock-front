"use client";

import Button from "@/components/ui/Button";
import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import AppLayout from "@/components/layouts/AppLayout";
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

/* ─────────────────────────────────────────────────────────
   ICÔNES INLINE  (lucide-react reste disponible si besoin)
───────────────────────────────────────────────────────── */
import {
  ShoppingCart, Search, Plus, Minus, CheckCircle2,
  Smartphone, Banknote, Wallet, User, X, LayoutGrid,
  List, Apple, Droplets, ShoppingBag, Package,
  ChevronUp, Scissors, RefreshCw, Trash2,
  Clock, Pause
} from "lucide-react";
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
  const componentRef = useRef<HTMLDivElement>(null);
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

  /* Mobile drawer */
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  /* Inject styles */
  useEffect(() => {
    if (document.getElementById("pos-styles")) return;
    const s = document.createElement("style");
    s.id = "pos-styles";
    s.textContent = POS_STYLES;
    document.head.appendChild(s);
    return () => { document.getElementById("pos-styles")?.remove(); };
  }, []);

  /* ── Chargement données ── */
  const loadData = async () => {
    if (!user) return;
    if (!user.shopId) {
      showToast("Erreur: compte non associé à une boutique.", "error");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let prodRes;
      try {
        prodRes = await ProductService.getAll({ shopId: user.shopId, limit: 200 });
      } catch (err) {
        console.warn("Retrying ProductService.getAll without limit due to backend error:", err);
        prodRes = await ProductService.getAll({ shopId: user.shopId });
      }

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

      setProducts(toList(prodRes));
      setCategories(toList(catRes));
      setCustomers(toList(custRes));
      setCurrentShop(shopRes);

      if (user?.id) {
        try { setCashSession(await CashSessionService.getActive(user.id)); }
        catch { setCashSession(null); }
      }
    } catch {
      showToast("Erreur lors du chargement des données", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

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

  /* ── Filtrage ── */
  const filteredProducts = products.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.barcode?.includes(q) || p.sku?.toLowerCase().includes(q);
    const matchC = !selectedCategory || p.categoryId === selectedCategory;
    return matchQ && matchC;
  });

  /* ── Print & Checkout ── */
  const handlePrint = useReactToPrint({ contentRef: componentRef, documentTitle: `Ticket_${lastSaleId}` });

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
      showToast("Vente validée !", "success");
      setTimeout(() => {
        handlePrint();
        setCart([]);
        setAmountReceived("");
        setSelectedCustomer(null);
        setDiscountAmount(0);
        setMobileCartOpen(false);
        loadData();
      }, 300);
    } catch (e) {
      console.error(e);
      showToast("Erreur lors de la vente. Vérifiez les stocks.", "error");
    } finally { setIsProcessing(false); }
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
            <button className="pos-close-session-btn" onClick={handleCloseSession}>
              Fermer la caisse
            </button>
          </div>
        )}
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
                <span className="pos-cat-count">{products.length}</span>
              </button>

              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    className={`pos-cat-btn ${selectedCategory === cat.id ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <Package size={14} />
                    {cat.name}
                    <span className="pos-cat-count">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="pos-session-bar">
              {cashSession ? (
                <div className="pos-session-open">
                  <span><span className="pos-session-dot" />Session active</span>
                  <span style={{ fontSize: 10, opacity: .7 }}>{fmt(cashSession.openingBalance)} XOF</span>
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
              <div className="pos-search-wrap">
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
              ) : filteredProducts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", opacity: .4, fontSize: 13 }}>
                  Aucun produit trouvé
                </div>
              ) : viewMode === "grid" ? (
                /* ── VUE GRILLE ── */
                <div className="pos-product-grid">
                  {filteredProducts.map((p) => {
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
                  {filteredProducts.map((p) => {
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
            </div>
          </div>

          {/* ────── PANNEAU PANIER & PAIEMENT ────── */}
          <div
            className="pos-cart"
            style={{
              // Mobile: drawer en bas
              ...(typeof window !== "undefined" && window.innerWidth <= 1024
                ? {
                    display: "flex",
                    position: "fixed",
                    bottom: 0, left: 0, right: 0,
                    zIndex: 200,
                    maxHeight: "90dvh",
                    borderRadius: "20px 20px 0 0",
                    transform: mobileCartOpen ? "translateY(0)" : "translateY(100%)",
                    transition: "transform .3s cubic-bezier(.32,.72,0,1)",
                  }
                : {}),
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
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            padding: "10px 16px",
            background: "var(--pos-surface)",
            borderTop: "1px solid var(--pos-border)",
            display: "flex", alignItems: "center", gap: 12,
            zIndex: 99,
          }}
          className="lg:hidden" // Tailwind : caché sur desktop
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

        {/* Ticket caché pour impression */}
        <div style={{ display: "none" }}>
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
    </AppLayout>
  );
}