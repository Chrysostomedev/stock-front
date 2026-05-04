"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import {
  ShoppingCart,
  Trash,
  Plus,
  Minus,
  CheckCircle2,
  Wallet,
  Phone,
  Search,
  Box,
  AlertTriangle,
  Receipt,
  FileText,
  X,
  Eye,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  stock: number;
  category: string;
  description?: string;
  history?: string[];
}

interface CartItem extends Product {
  quantity: number;
  customPrice?: number;
}

const mockProducts: Product[] = [
  { id: 1, name: "Riz Maman 5kg", price: 3500, unit: "Sac", stock: 15, category: "Alimentation", description: "Riz parfumé de qualité supérieure de marque Maman.", history: ["Arrivage le 01 Mai 2026: +20 sacs", "Avaries signalées: 5 sacs"] },
  { id: 2, name: "Huile Dinor 1.5L", price: 1750, unit: "Bouteille", stock: 24, category: "Alimentation", description: "Huile végétale raffinée Dinor pour la cuisson.", history: ["Arrivage le 01 Mai 2026: +50 bouteilles"] },
  { id: 3, name: "Sachet d'Eau Kirene", price: 100, unit: "Sachet", stock: 120, category: "Boissons", description: "Eau minérale saine en sachet de 300ml.", history: ["Arrivage le 02 Mai 2026: +200 sachets"] },
  { id: 4, name: "Lait Bonnet Rouge", price: 650, unit: "Boîte", stock: 45, category: "Produits laitiers", description: "Lait concentré sucré en boîte de conserve.", history: ["Arrivage le 30 Avril 2026: +50 boîtes"] },
  { id: 5, name: "Spaghetti Maman", price: 400, unit: "Paquet", stock: 60, category: "Alimentation", description: "Pâte de spaghetti de blé dur de marque Maman.", history: ["Arrivage le 01 Mai 2026: +100 paquets"] },
  { id: 6, name: "Coca Cola 33cl", price: 500, unit: "Canette", stock: 36, category: "Boissons", description: "Boisson gazeuse rafraîchissante Coca Cola originale.", history: ["Arrivage le 03 Mai 2026: +50 canettes"] },
];

export default function SuperettePage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"dashboard" | "sales" | "stock" | "finance">("dashboard");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mtn" | "moov" | "credit">("cash");
  const [customerName, setCustomerName] = useState("");
  const [isFlexPrice, setIsFlexPrice] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Stock management state
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [lossProduct, setLossProduct] = useState<number | "">("");
  const [lossQty, setLossQty] = useState<number>(1);
  const [lossReason, setLossReason] = useState("");

  // Supplier supply arrival in bulk for superette
  const [supplierName, setSupplierName] = useState("");
  const [suppliedProduct, setSuppliedProduct] = useState<number | "">("");
  const [suppliedQty, setSuppliedQty] = useState<number>(24);

  // Finance state
  const [financeType, setFinanceType] = useState<"decaissement" | "depense">("decaissement");
  const [financeAmount, setFinanceAmount] = useState("");
  const [financeDesc, setFinanceDesc] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);

  // Filtering products by search
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Adding item to cart
  const addToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    showToast(`${product.name} ajouté au panier !`, "success");
  };

  // Altering quantity
  const updateQuantity = (id: number, delta: number) => {
    setCart(
      cart
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  // Altering custom/negotiated price
  const updateCustomPrice = (id: number, price: number) => {
    setCart(cart.map((item) => (item.id === id ? { ...item, customPrice: price } : item)));
  };

  // Clearing cart
  const clearCart = () => {
    setCart([]);
    showToast("Le panier a été vidé.", "info");
  };

  // Get total
  const getTotal = () =>
    cart.reduce((sum, item) => sum + (item.customPrice ?? item.price) * item.quantity, 0);

  // Validate sale transaction
  const handleCheckout = () => {
    if (cart.length === 0) return;
    showToast(`Vente enregistrée : ${getTotal()} FCFA par ${paymentMethod.toUpperCase()} !`, "success");
    clearCart();
    setCustomerName("");
  };

  // Confirm loss
  const handleLossSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lossProduct) return;
    const prod = products.find((p) => p.id === Number(lossProduct));
    if (prod && prod.stock >= lossQty) {
      setProducts(
        products.map((p) =>
          p.id === prod.id ? { ...p, stock: p.stock - lossQty } : p
        )
      );
      showToast(`Perte enregistrée pour ${prod.name} (${lossQty} ${prod.unit}s).`, "success");
      setLossProduct("");
      setLossQty(1);
      setLossReason("");
    } else {
      showToast("Quantité de perte invalide ou stock insuffisant.", "error");
    }
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || !suppliedProduct || suppliedQty <= 0) return;
    const prod = products.find((p) => p.id === Number(suppliedProduct));
    if (!prod) return;

    setProducts(
      products.map((p) =>
        p.id === prod.id ? { ...p, stock: p.stock + suppliedQty } : p
      )
    );

    showToast(`Arrivage en gros enregistré : +${suppliedQty} ${prod.name} !`, "success");
    setSupplierName("");
    setSuppliedProduct("");
    setSuppliedQty(24);
  };

  // Register cash outflow (décaissement / dépense)
  const handleFinanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!financeAmount || !financeDesc) return;
    const t = {
      type: financeType,
      amount: Number(financeAmount),
      desc: financeDesc,
      date: new Date().toLocaleTimeString(),
    };
    setTransactions([t, ...transactions]);
    showToast(`${financeType === "decaissement" ? "Décaissement" : "Dépense"} enregistré !`, "success");
    setFinanceAmount("");
    setFinanceDesc("");
  };

  const renderBarChart = () => {
    const data = [
      { month: "Alimentation", amount: 480000 },
      { month: "Boissons", amount: 240000 },
      { month: "Laitiers", amount: 155000 },
    ];
    const max = Math.max(...data.map((d) => d.amount));

    return (
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-black text-foreground opacity-80 uppercase tracking-wider">
          Répartition des Ventes par Rayon
        </h4>
        <div className="flex flex-col gap-3.5 bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800/50 p-4 rounded-xl select-none">
          {data.map((d, i) => {
            const pct = (d.amount / max) * 100;
            return (
              <div key={i} className="flex flex-col gap-1 w-full">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-foreground leading-none">{d.month}</span>
                  <span className="text-emerald-600 font-black">{d.amount} FCFA</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div style={{ width: `${pct}%` }} className="h-full bg-emerald-500 rounded-full transition-all duration-300" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AppLayout
      title="Supérette"
      subtitle="Ventes, arrivages en gros & suivi d'activités"
      rightElement={
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold px-3 py-1.5 rounded-lg border border-emerald-200/50">
            FCFA
          </span>
          <Button
            onClick={() => setIsFlexPrice(!isFlexPrice)}
            variant={isFlexPrice ? "primary" : "outline"}
            size="sm"
            className="text-xs font-bold"
          >
            {isFlexPrice ? "Prix Flex" : "Prix Fixe"}
          </Button>
        </div>
      }
    >
      {/* Tabs Menu - Mobile and Desktop */}
      <div className="flex overflow-x-auto gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl mb-6 w-full max-w-4xl select-none transition-colors duration-300">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer shrink-0 ${
            activeTab === "dashboard"
              ? "bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("sales")}
          className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer shrink-0 ${
            activeTab === "sales"
              ? "bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700"
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          Ventes
        </button>
        <button
          onClick={() => setActiveTab("stock")}
          className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer shrink-0 ${
            activeTab === "stock"
              ? "bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700"
          }`}
        >
          <Box className="h-4 w-4" />
          Stock & Arrivages
        </button>
        <button
          onClick={() => setActiveTab("finance")}
          className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer shrink-0 ${
            activeTab === "finance"
              ? "bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700"
          }`}
        >
          <Wallet className="h-4 w-4" />
          Caisse & Bilan
        </button>
      </div>

      {/* TAB: DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="flex flex-col gap-6">
          {/* Top clickable stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card
              hoverable
              onClick={() => setActiveTab("sales")}
              className="p-5 bg-card border border-border rounded-2xl flex flex-col justify-between h-32 cursor-pointer transition-all hover:border-emerald-500/50"
            >
              <div className="flex justify-between items-start">
                <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <ShoppingCart className="h-5 w-5" />
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-lg">
                  Direct
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-500">Chiffre d'affaires Ventes</h4>
                <p className="text-2xl font-black text-foreground">875,000 FCFA</p>
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => setActiveTab("stock")}
              className="p-5 bg-card border border-border rounded-2xl flex flex-col justify-between h-32 cursor-pointer transition-all hover:border-emerald-500/50"
            >
              <div className="flex justify-between items-start">
                <span className="p-2 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-xl">
                  <Box className="h-5 w-5" />
                </span>
                <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-lg">
                  Arrivage
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-500">Total Articles Rayons</h4>
                <p className="text-2xl font-black text-foreground">300 items</p>
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => setActiveTab("finance")}
              className="p-5 bg-card border border-border rounded-2xl flex flex-col justify-between h-32 cursor-pointer transition-all hover:border-emerald-500/50"
            >
              <div className="flex justify-between items-start">
                <span className="p-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
                  <Receipt className="h-5 w-5" />
                </span>
                <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-lg">
                  Charges
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-500">Total Dépenses Sorties</h4>
                <p className="text-2xl font-black text-foreground">42,000 FCFA</p>
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => setActiveTab("finance")}
              className="p-5 bg-card border border-border rounded-2xl flex flex-col justify-between h-32 cursor-pointer transition-all hover:border-emerald-500/50"
            >
              <div className="flex justify-between items-start">
                <span className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-lg">
                  Bénéfice
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-500">Marge Brute Aujourd'hui</h4>
                <p className="text-2xl font-black text-foreground">148,500 FCFA</p>
              </div>
            </Card>
          </div>

          {/* Graphics section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <Card className="p-6 bg-card border border-border rounded-2xl md:col-span-2">
              {renderBarChart()}
            </Card>

            <Card className="p-6 bg-card border border-border rounded-2xl flex flex-col gap-4">
              <h4 className="text-xs font-black text-foreground opacity-80 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Articles à réapprovisionner
              </h4>
              <div className="flex flex-col gap-3">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
                    <span className="text-sm font-bold text-foreground leading-none">{p.name}</span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${p.stock < 25 ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400" : "bg-emerald-100 text-emerald-700"}`}>
                      {p.stock}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB: SALES */}
      {activeTab === "sales" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Products grid */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher un produit (riz, dinor, etc.)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-xs outline-none focus:border-emerald-500 font-medium transition-all"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((p) => (
                <Card
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="flex flex-col justify-between p-4 bg-card border border-border rounded-2xl cursor-pointer"
                >
                  <div>
                    <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg font-bold text-zinc-500">
                      {p.unit}
                    </span>
                    <h4 className="mt-2 text-sm font-extrabold text-foreground leading-tight">
                      {p.name}
                    </h4>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {p.price} FCFA
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-border">
                    <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Détails
                    </span>
                    <span
                      onClick={(e) => addToCart(p, e)}
                      className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all select-none cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart checkout */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <Card className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xl flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-emerald-500" />
                  Panier de vente
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-red-500 hover:text-red-700 font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Vider
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl text-center gap-3">
                  <span className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-full">
                    <ShoppingCart className="h-6 w-6" />
                  </span>
                  <p className="text-xs font-semibold text-zinc-400">
                    Aucun produit sélectionné
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/40 rounded-xl"
                    >
                      <div className="flex-1 flex flex-col min-w-0">
                        <span className="text-sm font-bold text-foreground truncate leading-tight">
                          {item.name}
                        </span>
                        {isFlexPrice ? (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-zinc-400">P.U. :</span>
                            <input
                              type="number"
                              value={item.customPrice ?? item.price}
                              onChange={(e) => updateCustomPrice(item.id, Number(e.target.value))}
                              className="w-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded text-xs font-bold text-emerald-600"
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {item.customPrice ?? item.price} FCFA
                          </span>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer select-none"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-extrabold text-foreground w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer select-none"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              <div className="pt-4 border-t border-border flex justify-between items-center">
                <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Total à payer</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {getTotal()} FCFA
                </span>
              </div>

              {/* Checkout modes */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Mode de Paiement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      paymentMethod === "cash"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold"
                        : "border-border hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <Wallet className="h-4 w-4" />
                    Espèces
                  </button>
                  <button
                    onClick={() => setPaymentMethod("mtn")}
                    className={`flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      paymentMethod === "mtn"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold"
                        : "border-border hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <Phone className="h-4 w-4 text-amber-500" />
                    MTN MoMo
                  </button>
                  <button
                    onClick={() => setPaymentMethod("moov")}
                    className={`flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      paymentMethod === "moov"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold"
                        : "border-border hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <Phone className="h-4 w-4 text-blue-500" />
                    Moov Money
                  </button>
                  <button
                    onClick={() => setPaymentMethod("credit")}
                    className={`flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      paymentMethod === "credit"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold"
                        : "border-border hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <FileText className="h-4 w-4 text-purple-500" />
                    Crédit Client
                  </button>
                </div>

                {paymentMethod === "credit" && (
                  <div className="flex flex-col gap-1 mt-1">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                      Nom du client (Crédit)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: M. Kouadio"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                variant="primary"
                size="lg"
                className="w-full mt-2 font-black text-sm tracking-tight flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-5 w-5" />
                Valider la vente
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* TAB: STOCK & BULK ARRIVALS */}
      {activeTab === "stock" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Card className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xl flex flex-col gap-4">
            <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
              <Box className="h-5 w-5 text-orange-500" />
              Réception d'Arrivage de Produits
            </h3>
            <p className="text-xs opacity-75 mb-2 leading-normal">
              Approvisionnez le magasin après un arrivage en gros.
            </p>

            <form onSubmit={handleSupplierSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Fournisseur / Transporteur
                </label>
                <input
                  type="text"
                  placeholder="Ex: Grossiste Marcory"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Sélectionner le produit
                </label>
                <select
                  value={suppliedProduct}
                  onChange={(e) => setSuppliedProduct(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                >
                  <option value="">-- Choisir un produit --</option>
                  {products.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Quantité reçue
                </label>
                <input
                  type="number"
                  min="1"
                  value={suppliedQty}
                  onChange={(e) => setSuppliedQty(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <Button type="submit" variant="primary" size="lg" className="mt-1 font-black text-sm tracking-tight flex items-center justify-center gap-2">
                Enregistrer l'arrivage
              </Button>
            </form>
          </Card>

          {/* Damage form */}
          <Card className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xl flex flex-col gap-4">
            <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Pertes & Avaries
            </h3>
            <p className="text-xs opacity-75 mb-2 leading-normal">
              Retirez du stock les articles volés ou abîmés.
            </p>

            <form onSubmit={handleLossSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Sélectionner le produit
                </label>
                <select
                  value={lossProduct}
                  onChange={(e) => setLossProduct(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                >
                  <option value="">-- Choisir un produit --</option>
                  {products.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name} (Dispo: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Quantité de perte
                </label>
                <input
                  type="number"
                  min="1"
                  value={lossQty}
                  onChange={(e) => setLossQty(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Raison
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sachet percé ou dégradation"
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <Button type="submit" variant="danger" size="lg" className="mt-1 font-black text-sm tracking-tight flex items-center justify-center gap-2">
                Enregistrer la perte
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* TAB: FINANCE & DAILY BALANCE */}
      {activeTab === "finance" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Card className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xl flex flex-col gap-4">
            <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-500" />
              Décaissement ou Dépenses
            </h3>
            <form onSubmit={handleFinanceSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Type de mouvement
                </label>
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setFinanceType("decaissement")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      financeType === "decaissement"
                        ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm font-extrabold"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700"
                    }`}
                  >
                    Décaissement
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinanceType("depense")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      financeType === "depense"
                        ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm font-extrabold"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700"
                    }`}
                  >
                    Dépense bénéfice
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Montant (FCFA)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 5000"
                  value={financeAmount}
                  onChange={(e) => setFinanceAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Motif
                </label>
                <input
                  type="text"
                  placeholder="Ex: Transport d'arrivage"
                  value={financeDesc}
                  onChange={(e) => setFinanceDesc(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <Button type="submit" variant="primary" size="lg" className="mt-1 font-black text-sm tracking-tight flex items-center justify-center gap-2">
                Enregistrer
              </Button>
            </form>
          </Card>

          {/* Right ledger */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              Journal des Mouvements financiers
            </h3>
            {transactions.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-border text-center rounded-2xl text-xs font-semibold text-zinc-400">
                Aucun mouvement ce jour.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {transactions.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 bg-card border border-border rounded-xl"
                  >
                    <div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${t.type === "decaissement" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {t.type}
                      </span>
                      <h4 className="text-sm font-bold text-foreground mt-1 tracking-tight">{t.desc}</h4>
                    </div>
                    <span className="text-sm font-black text-foreground">{t.amount} FCFA</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP / DETAILED MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-card border border-border p-6 rounded-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <span className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Box className="h-6 w-6" />
                </span>
                <div className="flex flex-col leading-none">
                  <span className="text-xs text-zinc-400 font-bold tracking-wider uppercase">{selectedProduct.category}</span>
                  <h3 className="text-lg font-black text-foreground mt-0.5 tracking-tight">{selectedProduct.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-bold">Prix de vente</span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{selectedProduct.price} FCFA</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-bold">Unité de mesure</span>
                <span className="text-sm font-extrabold text-foreground">{selectedProduct.unit}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-bold">Stock restant</span>
                <span className="text-sm font-extrabold text-foreground">{selectedProduct.stock}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-foreground">Description du produit</h4>
              <p className="text-xs opacity-75 leading-relaxed bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 p-3.5 rounded-xl">
                {selectedProduct.description}
              </p>
            </div>

            {selectedProduct.history && selectedProduct.history.length > 0 && (
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-foreground">Historique d'approvisionnement</h4>
                <div className="flex flex-col gap-1.5">
                  {selectedProduct.history.map((h, idx) => (
                    <div key={idx} className="text-xs opacity-75 bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800/60 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                addToCart(selectedProduct);
                setSelectedProduct(null);
              }}
              variant="primary"
              size="lg"
              className="mt-2 font-black text-sm tracking-tight flex items-center justify-center gap-2"
            >
              <ShoppingCart className="h-5 w-5" />
              Ajouter au panier
            </Button>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
