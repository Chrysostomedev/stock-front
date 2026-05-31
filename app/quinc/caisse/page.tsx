"use client";

import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { TicketReceipt } from "@/components/ui/TicketReceipt";
import AppLayout from "@/components/layouts/AppLayout";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import QuincProductService from "@/services/quinc/product.service";
import QuincCategoryService from "@/services/quinc/category.service";
import QuincCustomerService from "@/services/quinc/customer.service";
import QuincCashSessionService from "@/services/quinc/cashSession.service";
import QuincSaleService from "@/services/quinc/sale.service";
import { Product, Category, Customer, CashSession } from "@/types/quinc";
import {
  ShoppingCart, Search, Plus, Minus, Trash2,
  Clock, Pause, X, LayoutGrid, List,
  Package, Banknote, Smartphone, CheckCircle2,
  Wallet, Scissors, User, ChevronUp, Wrench, Printer,
} from "lucide-react";
import { POS_STYLES } from "@/types/post_caise_style";


const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

interface CartItem {
  product: Product;
  qty: number;
  customPrice?: number;
}

export default function QuincaillerieCaissePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const componentRef = useRef<HTMLDivElement>(null);
  const [lastSaleId, setLastSaleId] = useState("");
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [saleCartSnapshot, setSaleCartSnapshot] = useState<typeof cart>([]);

  /* Données */
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  /* Session */
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [openingBalance, setOpeningBalance] = useState("");
  const [isOpeningSession, setIsOpeningSession] = useState(false);

  /* UI catalogue */
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  /* Panier */
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  /* Paiement */
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOBILE_MONEY">("CASH");
  const [mobileProvider, setMobileProvider] = useState<"ORANGE" | "MTN" | "WAVE">("WAVE");
  const [amountReceived, setAmountReceived] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  /* Paniers en attente */
  const [pendingCarts, setPendingCarts] = useState<{ id: string; name: string; items: CartItem[]; timestamp: string; total: number }[]>(() => {
    try {
      const saved = localStorage.getItem("quinc_pending_carts");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showPendingModal, setShowPendingModal] = useState(false);

  /* Mobile */
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  /* Inject styles */
  useEffect(() => {
    if (document.getElementById("qpos-styles")) return;
    const s = document.createElement("style");
    s.id = "qpos-styles";
    s.textContent = POS_STYLES;
    document.head.appendChild(s);
    return () => { document.getElementById("qpos-styles")?.remove(); };
  }, []);


  /* Chargement données */
  const loadData = async () => {
    if (!user?.shopId) {
      showToast("Erreur: votre compte n'est associé à aucune boutique.", "error");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [sessionRes, productsRes, catsRes, custsRes] = await Promise.all([
        QuincCashSessionService.getActive(user.shopId, user.id),
        QuincProductService.getAll(user.shopId),
        QuincCategoryService.getByShop(user.shopId, { limit: 100 }),
        QuincCustomerService.getAll(user.shopId),
      ]);
      setActiveSession(sessionRes);
      const filtered = Array.isArray(productsRes)
        ? productsRes
            .filter((p) => p.shopId === user.shopId)
            // Normalise : l'API peut renvoyer stockQty ou stock au lieu de stockQuantity
            .map((p) => ({
              ...p,
              stockQuantity: p.stockQuantity ?? (p as unknown as Record<string, number>).stockQty ?? (p as unknown as Record<string, number>).stock ?? 0,
              minStockAlert:  p.minStockAlert  ?? (p as unknown as Record<string, number>).minStockQty  ?? 5,
            }))
        : [];
      setProducts(filtered);
      setCategories(Array.isArray(catsRes) ? catsRes : []);
      setCustomers(Array.isArray(custsRes) ? custsRes : []);
    } catch {
      showToast("Erreur lors du chargement des données.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.shopId && user?.id) {
      loadData().catch(() => {});
    }
  }, [user?.shopId, user?.id]);

  /* Session */
  const handleOpenSession = async () => {
    if (!user?.shopId || !user?.id) return;
    setIsOpeningSession(true);
    try {
      const newSession = await QuincCashSessionService.open({
        shopId: user.shopId,
        userId: user.id,
        openingBalance: parseFloat(openingBalance) || 0,
        notes: `Session ouverte par ${user.name || user.email}`,
      });
      setActiveSession(newSession);
      showToast(`Caisse ouverte — ${fmt(parseFloat(openingBalance) || 0)} FCFA`, "success");
    } catch (error: any) {
      if (error.response?.status === 409) {
        try {
          const s = await QuincCashSessionService.getActive(user.shopId, user.id);
          if (s) { setActiveSession(s); return; }
        } catch { /* ignore */ }
      }
      showToast(error.response?.data?.message || "Impossible d'ouvrir la caisse.", "error");
    } finally {
      setIsOpeningSession(false);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    const s = prompt("Montant réel compté en caisse (FCFA) :");
    if (s === null) return;
    try {
      await QuincCashSessionService.close(activeSession.id, {
        closingBalance: parseFloat(s) || 0,
        notes: `Session fermée par ${user?.name}`,
      });
      setActiveSession(null);
      showToast(`Caisse fermée — ${fmt(parseFloat(s) || 0)} FCFA déclarés`, "success");
    } catch {
      showToast("Erreur lors de la fermeture.", "error");
    }
  };

  /* Panier */
  const addToCart = (product: Product) => {
    if (product.stockQuantity < 1) { showToast("Rupture de stock !", "error"); return; }
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id);
      if (ex) {
        if (ex.qty >= product.stockQuantity) { showToast("Stock maximum atteint", "error"); return prev; }
        return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== id) return item;
        const nq = item.qty + delta;
        if (nq > item.product.stockQuantity) { showToast("Stock insuffisant", "error"); return item; }
        return { ...item, qty: nq };
      }).filter((i) => i.qty > 0)
    );
  };

  const updateCustomPrice = (id: string, price: string) => {
    const val = parseFloat(price);
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === id
          ? { ...item, customPrice: isNaN(val) || val <= 0 ? undefined : val }
          : item
      )
    );
  };

  /* Calculs */
  const subtotal = cart.reduce(
    (s, i) => s + (i.customPrice ?? i.product.sellingPrice) * i.qty,
    0
  );
  const discAmt = Math.max(0, Math.min(subtotal, discountAmount));
  const total = subtotal - discAmt;
  const received = parseFloat(amountReceived) || 0;
  const change = Math.max(0, received - total);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const inCart = (id: string) => cart.find((i) => i.product.id === id);

  /* Filtrage produits */
  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q);
    const matchC = !selectedCategory || p.categoryId === selectedCategory;
    return matchQ && matchC;
  });

  /* Print */
  const handlePrint = useReactToPrint({ contentRef: componentRef, documentTitle: `Ticket_Quinc_${lastSaleId}` });

  const resetAfterQuincSale = () => {
    setShowPrintConfirm(false);
    setCart([]);
    setAmountReceived("");
    setSelectedCustomer(null);
    setDiscountAmount(0);
    setMobileCartOpen(false);
  };

  /* Checkout */
  const handleCheckout = async () => {
    if (cart.length === 0) return showToast("Panier vide", "error");
    if (!user?.shopId) return showToast("Boutique non identifiée", "error");
    setIsProcessing(true);
    try {
      await QuincSaleService.create({
        shopId: user.shopId,
        userId: user.id,
        cashSessionId: activeSession?.id,
        customerId: selectedCustomer?.id || undefined,
        totalAmount: total,
        discountAmount: discAmt,
        finalAmount: total,
        paidAmount: paymentMethod === "CASH" ? (received || total) : total,
        status: "COMPLETED" as const,
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.qty,
          unitPrice: item.customPrice ?? item.product.sellingPrice,
          totalPrice: (item.customPrice ?? item.product.sellingPrice) * item.qty,
        })),
        payments: [{
          method: paymentMethod,
          amount: total,
          reference: paymentMethod === "MOBILE_MONEY" ? `${mobileProvider}_${Date.now()}` : undefined,
        }],
      } as any);

      showToast(`Vente enregistrée : ${fmt(total)} FCFA !`, "success");

      // Mise à jour stock locale
      setProducts((prev) =>
        prev.map((p) => {
          const ci = cart.find((c) => c.product.id === p.id);
          return ci ? { ...p, stockQuantity: p.stockQuantity - ci.qty } : p;
        })
      );

      setSaleCartSnapshot([...cart]);
      setShowPrintConfirm(true);
    } catch {
      showToast("Erreur lors de la validation de la vente", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  /* Paniers en attente */
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
    localStorage.setItem("quinc_pending_carts", JSON.stringify(updated));
    setCart([]);
    showToast(`Panier de "${nameVal}" mis en attente.`, "success");
  };

  const handleRestoreCart = (pending: typeof pendingCarts[0]) => {
    setCart(pending.items);
    const updated = pendingCarts.filter((c) => c.id !== pending.id);
    setPendingCarts(updated);
    localStorage.setItem("quinc_pending_carts", JSON.stringify(updated));
    setShowPendingModal(false);
    showToast(`Panier de "${pending.name}" restauré !`, "success");
  };

  const handleDeletePendingCart = (id: string, name: string) => {
    const updated = pendingCarts.filter((c) => c.id !== id);
    setPendingCarts(updated);
    localStorage.setItem("quinc_pending_carts", JSON.stringify(updated));
    showToast(`Panier de "${name}" supprimé.`, "success");
  };

  if (loading) {
    return (
      <AppLayout title="Caisse Quincaillerie" subtitle="Chargement..." backUrl="/quinc">
        <div className="flex items-center justify-center p-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Caisse Quincaillerie" subtitle="Vente de matériaux et gros œuvre" backUrl="/quinc">
      <div className="qpos-root">

        {/* ── Bannière session ── */}
        {!activeSession ? (
          <div className="qpos-session-banner qpos-session-closed-banner">
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
                placeholder="Fond initial (FCFA)"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="qpos-session-input"
              />
              <button className="qpos-session-btn" onClick={handleOpenSession} disabled={isOpeningSession}>
                {isOpeningSession ? "…" : "Ouvrir"}
              </button>
            </div>
          </div>
        ) : (
          <div className="qpos-session-banner qpos-session-open-banner">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="qpos-session-dot" />
              <span style={{ fontWeight: 700 }}>
                Caisse ouverte — Fond : {fmt(activeSession.openingBalance)} FCFA
              </span>
            </div>
            <button className="qpos-close-session-btn" onClick={handleCloseSession}>
              Fermer la caisse
            </button>
          </div>
        )}
        {/* ── Layout principal ── */}
        <div className="qpos-layout">

          {/* ── SIDEBAR CATÉGORIES ── */}
          <aside className="qpos-sidebar">
            <div className="qpos-sidebar-logo">
              <Wrench size={18} />
              <div>
                Quincaillerie
                <div className="qpos-sidebar-shop">{user?.shopId ? "Matériaux & Outils" : "—"}</div>
              </div>
            </div>
            <div className="qpos-cats-list">
              <button
                className={`qpos-cat-btn ${!selectedCategory ? "active" : ""}`}
                onClick={() => setSelectedCategory(null)}
              >
                <Package size={14} />
                Tous
                <span className="qpos-cat-count">{products.length}</span>
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    className={`qpos-cat-btn ${selectedCategory === cat.id ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <Package size={14} />
                    {cat.name}
                    <span className="qpos-cat-count">{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="qpos-session-bar">
              {activeSession ? (
                <div className="qpos-session-open">
                  <span><span className="qpos-session-dot" />Session active</span>
                  <span style={{ fontSize: 10, opacity: .7 }}>{fmt(activeSession.openingBalance)} FCFA</span>
                </div>
              ) : (
                <div className="qpos-session-closed">⚠ Caisse fermée</div>
              )}
            </div>
          </aside>
          {/* ── CATALOGUE ── */}
          <div className="qpos-catalog">
            {/* Header mobile */}
            <div className="qpos-mobile-header">
              <div className="qpos-mobile-search-wrap">
                <Search />
                <input
                  className="qpos-mobile-search"
                  type="text"
                  placeholder="Rechercher un matériau…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="qpos-mobile-cats">
                <button
                  className={`qpos-mob-cat ${!selectedCategory ? "active" : ""}`}
                  onClick={() => setSelectedCategory(null)}
                >Tous</button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`qpos-mob-cat ${selectedCategory === cat.id ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >{cat.name}</button>
                ))}
              </div>
            </div>

            {/* Header desktop */}
            <div className="qpos-catalog-header">
              <div className="qpos-search-wrap">
                <Search />
                <input
                  className="qpos-search"
                  type="text"
                  placeholder="Nom, SKU du matériau…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="qpos-view-toggle">
                <button
                  className={`qpos-view-btn ${viewMode === "grid" ? "active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Vue grille"
                ><LayoutGrid size={16} /></button>
                <button
                  className={`qpos-view-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                  title="Vue liste"
                ><List size={16} /></button>
              </div>
            </div>

            {/* Produits */}
            <div className="qpos-products-wrap">
              {filteredProducts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", opacity: .4, fontSize: 13 }}>
                  Aucun matériau trouvé
                </div>
              ) : viewMode === "grid" ? (
                <div className="qpos-product-grid">
                  {filteredProducts.map((p) => {
                    const ci = inCart(p.id);
                    const noStock = p.stockQuantity <= 0;
                    return (
                      <div
                        key={p.id}
                        className={`qpos-prod-card ${noStock ? "no-stock" : ""}`}
                        onClick={() => !noStock && addToCart(p)}
                      >
                        {ci && <div className="qpos-in-cart-badge">{ci.qty}</div>}
                        <div className="qpos-prod-unit">{p.unit}</div>
                        <div className="qpos-prod-name">{p.name}</div>
                        <div className="qpos-prod-price">{fmt(p.sellingPrice)} <small>FCFA</small></div>
                        <div className={`qpos-prod-stock ${p.stockQuantity <= (p.minStockAlert || 5) && p.stockQuantity > 0 ? "low" : ""}`}>
                          {noStock ? "Rupture" : p.stockQuantity <= (p.minStockAlert || 5) ? `⚠ ${p.stockQuantity} restants` : `${p.stockQuantity} en stock`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="qpos-product-list">
                  {filteredProducts.map((p) => {
                    const ci = inCart(p.id);
                    const noStock = p.stockQuantity <= 0;
                    return (
                      <div
                        key={p.id}
                        className={`qpos-prod-row ${noStock ? "no-stock" : ""}`}
                        onClick={() => !noStock && addToCart(p)}
                      >
                        <div className="qpos-prod-row-info">
                          <div className="qpos-prod-row-name">{p.name}</div>
                          <div className="qpos-prod-row-sub">{p.unit} · {p.category?.name || "—"}{p.sku ? ` · ${p.sku}` : ""}</div>
                        </div>
                        {ci && <span className="qpos-prod-row-qty-badge">{ci.qty}×</span>}
                        <div className="qpos-prod-row-price">{fmt(p.sellingPrice)} <small style={{ fontSize: 10, fontWeight: 400 }}>FCFA</small></div>
                        <div className={`qpos-prod-row-stock ${p.stockQuantity <= (p.minStockAlert || 5) && p.stockQuantity > 0 ? "low" : ""}`}>
                          {noStock ? "Rupture" : p.stockQuantity <= (p.minStockAlert || 5) ? `⚠ ${p.stockQuantity}` : p.stockQuantity}
                        </div>
                        <button className="qpos-row-add-btn" onClick={(e) => { e.stopPropagation(); if (!noStock) addToCart(p); }}>
                          <Plus size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── PANNEAU PANIER & PAIEMENT ── */}
          <div
            className="qpos-cart"
            style={{
              transform: mobileCartOpen ? "translateY(0)" : "translateY(100%)",
              transition: "transform .3s cubic-bezier(.32,.72,0,1)",
            }}
          >
            {/* En-tête */}
            <div className="qpos-cart-head">
              <div className="qpos-cart-title">
                <ShoppingCart size={14} />
                Panier
                <span className="qpos-cart-badge">{totalItems}</span>
              </div>
              <div className="qpos-cart-actions">
                {pendingCarts.length > 0 && (
                  <button
                    onClick={() => setShowPendingModal(true)}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: "#FCD34D", background: "rgba(217,119,6,.15)", padding: "4px 8px", borderRadius: 8, border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: ".06em" }}
                  >
                    <Clock size={11} />
                    {pendingCarts.length} en attente
                  </button>
                )}
                {cart.length > 0 && (
                  <button
                    onClick={handlePutOnHold}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: "#93C5FD", background: "rgba(59,130,246,.12)", padding: "4px 8px", borderRadius: 8, border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: ".06em" }}
                  >
                    <Pause size={11} />
                    Attente
                  </button>
                )}
                <button className="qpos-cart-clear-btn" onClick={() => setCart([])}>Vider</button>
              </div>
            </div>
            {/* Sélection client */}
            <div className="qpos-cust-wrap">
              <div className="qpos-cust-label">
                <User size={12} style={{ display: "inline", marginRight: 4, verticalAlign: -2 }} />
                Client
              </div>
              {selectedCustomer ? (
                <div className="qpos-cust-selected">
                  <div className="qpos-cust-name">
                    <User size={13} />
                    {selectedCustomer.firstName} {selectedCustomer.lastName || ""}
                  </div>
                  <button className="qpos-cust-clear" onClick={() => setSelectedCustomer(null)}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <select
                  className="qpos-cust-select"
                  onChange={(e) => setSelectedCustomer(customers.find((c) => c.id === e.target.value) || null)}
                  value=""
                >
                  <option value="">— Client de passage —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName || ""}{c.phone ? ` (${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {/* Articles */}
            <div className="qpos-cart-items">
              {cart.length === 0 ? (
                <div className="qpos-cart-empty">
                  <ShoppingCart size={36} />
                  <p>Panier vide</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="qpos-ci">
                    <div className="qpos-ci-name">{item.product.name}</div>
                    <div className="qpos-ci-meta">
                      <span>{fmt(item.customPrice ?? item.product.sellingPrice)} FCFA</span>
                      <span>× {item.qty}</span>
                      <span style={{ fontSize: 9, opacity: .6 }}>{item.product.unit}</span>
                    </div>
                    <div className="qpos-ci-custom-price">
                      <span className="qpos-ci-custom-price-label">Prix :</span>
                      <input
                        className="qpos-ci-custom-price-input"
                        type="number"
                        placeholder={String(item.product.sellingPrice)}
                        value={item.customPrice ?? ""}
                        onChange={(e) => updateCustomPrice(item.product.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="qpos-ci-controls">
                      <div className="qpos-ci-total">
                        {fmt((item.customPrice ?? item.product.sellingPrice) * item.qty)}
                      </div>
                      <div className="qpos-ci-qty-row">
                        <button className="qpos-ci-btn del" onClick={() => updateQuantity(item.product.id, -1)}>
                          <Minus size={11} />
                        </button>
                        <span className="qpos-ci-qty">{item.qty}</span>
                        <button className="qpos-ci-btn" onClick={() => updateQuantity(item.product.id, 1)}>
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totaux */}
            <div className="qpos-totals">
              <div className="qpos-tot-row">
                <span>Sous-total</span>
                <span className="qpos-tot-val">{fmt(subtotal)} FCFA</span>
              </div>
              <div className="qpos-tot-row qpos-discount-row">
                <label>
                  <Scissors size={12} />
                  Remise
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    className="qpos-discount-input"
                    type="number"
                    min={0}
                    max={subtotal}
                    placeholder="0"
                    value={discountAmount || ""}
                    onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                  <span className="qpos-discount-unit">FCFA</span>
                </div>
              </div>
              <div className="qpos-tot-main">
                <span className="qpos-tot-main-label">Total</span>
                <span className="qpos-tot-main-val">{fmt(total)} FCFA</span>
              </div>
            </div>

            {/* Paiement */}
            <div className="qpos-payment">
              <div className="qpos-pay-label">Mode de paiement</div>
              <div className="qpos-pay-methods">
                <button
                  className={`qpos-pay-btn ${paymentMethod === "CASH" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("CASH")}
                >
                  <Banknote size={16} />Espèces
                </button>
                <button
                  className={`qpos-pay-btn ${paymentMethod === "MOBILE_MONEY" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("MOBILE_MONEY")}
                >
                  <Smartphone size={16} />Mobile
                </button>
              </div>

              {paymentMethod === "CASH" ? (
                <div className="qpos-cash-wrap">
                  <input
                    className="qpos-cash-input"
                    type="number"
                    placeholder="Montant reçu…"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                  />
                  {received > 0 && cart.length > 0 && (
                    <div className="qpos-change-row">
                      <span className="qpos-change-label">Monnaie à rendre</span>
                      <span className="qpos-change-val">{fmt(change)} FCFA</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="qpos-mobile-ops">
                  {(["WAVE", "ORANGE", "MTN"] as const).map((op) => (
                    <button
                      key={op}
                      className={`qpos-mobile-op ${mobileProvider === op ? "active" : ""}`}
                      onClick={() => setMobileProvider(op)}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              )}

              <button
                className="qpos-checkout-btn"
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing || !activeSession}
              >
                <CheckCircle2 size={18} />
                {isProcessing ? "Traitement…" : `Valider · ${fmt(total)} FCFA`}
              </button>
              {!activeSession && (
                <p style={{ fontSize: 10, color: "#D97706", textAlign: "center", margin: 0 }}>
                  Ouvrez la caisse avant de valider
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── FAB Panier Mobile ── */}
        <div
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
            {fmt(total)} FCFA
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
            <span style={{ background: "#92400E", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12 }}>
              {totalItems}
            </span>
            <ChevronUp size={16} style={{ marginLeft: 4, transform: mobileCartOpen ? "rotate(180deg)" : "none", transition: "transform .3s" }} />
          </button>
        </div>

        {/* Overlay mobile */}
        {mobileCartOpen && (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 199, backdropFilter: "blur(2px)" }}
            onClick={() => setMobileCartOpen(false)}
          />
        )}

        {/* ── Modal Paniers en attente ── */}
        {showPendingModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">Paniers en attente</h3>
                    <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{pendingCarts.length} paniers suspendus</p>
                  </div>
                </div>
                <button onClick={() => setShowPendingModal(false)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
                  <X className="h-4 w-4 text-zinc-400" />
                </button>
              </div>
              <div className="p-4 max-h-90 overflow-y-auto flex flex-col gap-2.5">
                {pendingCarts.map((item) => (
                  <div key={item.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-zinc-800 dark:text-zinc-200 truncate">{item.name}</span>
                        <span className="text-[9px] font-bold text-zinc-400 bg-zinc-200/50 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{item.timestamp}</span>
                      </div>
                      <p className="text-[9px] font-bold text-zinc-400 mt-1">
                        {item.items.reduce((acc, it) => acc + it.qty, 0)} articles · {fmt(item.total)} FCFA
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestoreCart(item)}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
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
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <button onClick={() => setShowPendingModal(false)} className="px-4 py-2 text-[10px] font-black uppercase tracking-wider border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ticket caché pour impression */}
      <div style={{ display: "none" }}>
        <TicketReceipt
          ref={componentRef}
          shop={null}
          user={user}
          items={saleCartSnapshot.map((i) => ({ product: i.product, quantity: i.qty }))}
          total={total}
          paymentMethod={paymentMethod}
          amountReceived={paymentMethod === "CASH" ? (received || total) : total}
          change={change}
          saleId={lastSaleId}
        />
      </div>

      {/* Modal confirmation impression */}
      {showPrintConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 340, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.25)", display: "flex", flexDirection: "column", gap: 20, fontFamily: "inherit" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Printer size={24} style={{ color: "#2563EB" }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F1E3D" }}>Imprimer le ticket ?</div>
                <div style={{ fontSize: 12, color: "#8A9BBD", marginTop: 3 }}>Voulez-vous imprimer le reçu de cette vente ?</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={resetAfterQuincSale}
                style={{ flex: 1, padding: "12px 0", border: "1.5px solid #D0DBF0", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "#4A5A7A", background: "#fff", cursor: "pointer", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "inherit" }}
              >
                Non merci
              </button>
              <button
                onClick={() => { handlePrint(); resetAfterQuincSale(); }}
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
