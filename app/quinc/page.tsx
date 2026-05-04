"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import {
  Wrench,
  Search,
  Plus,
  Minus,
  CheckCircle2,
  Wallet,
  Users,
  AlertTriangle,
  Eye,
  X,
  LayoutDashboard,
  Box,
  TrendingUp,
  FileText,
  ShoppingCart,
  Calendar,
} from "lucide-react";

interface HardwareItem {
  id: number;
  name: string;
  price: number;
  stock: number;
  unit: string;
  description?: string;
  history?: string[];
}

const mockHardware: HardwareItem[] = [
  { id: 1, name: "Ciment Bélier 50kg", price: 4500, stock: 120, unit: "Sac", description: "Ciment de type CPJ35 pour travaux de maçonnerie générale.", history: ["Arrivage le 01 Mai 2026: +200 sacs"] },
  { id: 2, name: "Fer à Béton 8mm", price: 600, stock: 450, unit: "Barre", description: "Barre de fer à béton laminé pour construction et chaînage.", history: ["Arrivage le 30 Avril 2026: +500 barres"] },
  { id: 3, name: "Pointes 70mm (1kg)", price: 850, stock: 35, unit: "Paquet", description: "Pointes de charpente en acier galvanisé de 70 mm.", history: ["Arrivage le 01 Mai 2026: +40 paquets"] },
  { id: 4, name: "Peinture Ripolin Blanc", price: 18500, stock: 12, unit: "Seau", description: "Peinture acrylique blanche satinée de marque Ripolin.", history: ["Arrivage le 26 Avril 2026: +15 seaux"] },
];

export default function QuincailleriePage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"dashboard" | "sales" | "credits" | "supplier" | "balance">("dashboard");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<{ id: number; qty: number; customPrice?: number }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<HardwareItem | null>(null);

  // General state products
  const [products, setProducts] = useState<HardwareItem[]>(mockHardware);

  // Credits state
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [credits, setCredits] = useState<any[]>([
    { customer: "M. Bakayoko", phone: "0708091011", total: 24500, date: "10:15", items: ["3x Ciment Bélier", "1x Peinture Ripolin"] },
  ]);

  // Supplier delivery state
  const [supplierName, setSupplierName] = useState("");
  const [suppliedProduct, setSuppliedProduct] = useState<number | "">("");
  const [suppliedQty, setSuppliedQty] = useState<number>(50);
  const [supplyHistory, setSupplyHistory] = useState<any[]>([
    { supplier: "SOTACI CI", item: "Fer à Béton 8mm", qty: 100, date: "02/05/2026" },
  ]);

  const filteredItems = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: HardwareItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(cart.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item)));
    } else {
      setCart([...cart, { id: product.id, qty: 1 }]);
    }
    showToast(`${product.name} ajouté au panier Quincaillerie !`, "success");
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(
      cart
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const updateCustomPrice = (id: number, price: number) => {
    setCart(cart.map((item) => (item.id === id ? { ...item, customPrice: price } : item)));
  };

  const clearCart = () => {
    setCart([]);
    showToast("Le panier a été vidé.", "info");
  };

  const getPrice = (id: number) => {
    const p = products.find((prod) => prod.id === id);
    return p ? p.price : 0;
  };

  const getTotal = () =>
    cart.reduce((sum, item) => sum + (item.customPrice ?? getPrice(item.id)) * item.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    showToast(`Vente de Quincaillerie validée : ${getTotal()} FCFA !`, "success");
    clearCart();
  };

  const handleCreditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !phone || cart.length === 0) return;
    const c = {
      customer,
      phone,
      total: getTotal(),
      date: new Date().toLocaleTimeString(),
      items: cart.map((item) => `${item.qty}x ${products.find((p) => p.id === item.id)?.name}`),
    };
    setCredits([c, ...credits]);
    showToast(`Crédit enregistré pour ${customer} (${getTotal()} FCFA) !`, "success");
    setCustomer("");
    setPhone("");
    clearCart();
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

    const record = {
      supplier: supplierName,
      item: prod.name,
      qty: suppliedQty,
      date: new Date().toLocaleDateString(),
    };
    setSupplyHistory([record, ...supplyHistory]);
    showToast(`Arrivage enregistré : +${suppliedQty} ${prod.name} !`, "success");
    setSupplierName("");
    setSuppliedProduct("");
    setSuppliedQty(50);
  };

  // SVG-based Circular / Pie Chart Component
  const renderPieChart = () => {
    const data = [
      { label: "Ciment", value: 45, color: "#10b981" },
      { label: "Fers", value: 30, color: "#f59e0b" },
      { label: "Peintures", value: 15, color: "#ef4444" },
      { label: "Quincaillerie", value: 10, color: "#3b82f6" },
    ];
    let cumPercent = 0;

    const getCoordinatesForPercent = (percent: number) => {
      const x = Math.cos(2 * Math.PI * percent);
      const y = Math.sin(2 * Math.PI * percent);
      return [x, y];
    };

    return (
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-black text-foreground opacity-80 uppercase tracking-wider">
          Répartition du chiffre d'affaires par secteur
        </h4>
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-around bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800/50 p-4 rounded-xl select-none">
          <svg className="w-36 h-36 -rotate-90" viewBox="-1 -1 2 2">
            {data.map((d, i) => {
              const [startX, startY] = getCoordinatesForPercent(cumPercent);
              cumPercent += d.value / 100;
              const [endX, endY] = getCoordinatesForPercent(cumPercent);
              const largeArcFlag = d.value > 50 ? 1 : 0;
              const pathData = [
                `M ${startX} ${startY}`,
                `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                "L 0 0",
              ].join(" ");
              return <path key={i} d={pathData} fill={d.color} className="transition-all hover:opacity-90 cursor-pointer" />;
            })}
          </svg>

          <div className="flex flex-col gap-2 w-full max-w-[140px]">
            {data.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-foreground leading-none">{d.label}</span>
                </div>
                <span className="text-zinc-500 font-extrabold">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout title="Quincaillerie" subtitle="Gestion des ventes de matériel, stocks & crédits">
      {/* Dynamic Tab Navigation Bar */}
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
          <Wrench className="h-4 w-4" />
          Ventes au comptoir
        </button>
        <button
          onClick={() => setActiveTab("credits")}
          className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer shrink-0 ${
            activeTab === "credits"
              ? "bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700"
          }`}
        >
          <Users className="h-4 w-4" />
          Crédits Clients
        </button>
        <button
          onClick={() => setActiveTab("supplier")}
          className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer shrink-0 ${
            activeTab === "supplier"
              ? "bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700"
          }`}
        >
          <Box className="h-4 w-4" />
          Réception Fournisseurs
        </button>
        <button
          onClick={() => setActiveTab("balance")}
          className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer shrink-0 ${
            activeTab === "balance"
              ? "bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Bilan Journalier
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
                  Aujourd'hui
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-500">Recettes Ventes Comptoir</h4>
                <p className="text-2xl font-black text-foreground">845,000 FCFA</p>
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => setActiveTab("credits")}
              className="p-5 bg-card border border-border rounded-2xl flex flex-col justify-between h-32 cursor-pointer transition-all hover:border-emerald-500/50"
            >
              <div className="flex justify-between items-start">
                <span className="p-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
                  <Users className="h-5 w-5" />
                </span>
                <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-lg">
                  Risque
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-500">En-cours Crédit Clients</h4>
                <p className="text-2xl font-black text-foreground">412,000 FCFA</p>
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => setActiveTab("supplier")}
              className="p-5 bg-card border border-border rounded-2xl flex flex-col justify-between h-32 cursor-pointer transition-all hover:border-emerald-500/50"
            >
              <div className="flex justify-between items-start">
                <span className="p-2 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-xl">
                  <Box className="h-5 w-5" />
                </span>
                <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-lg">
                  Fournisseur
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-500">Total Matériaux en Stock</h4>
                <p className="text-2xl font-black text-foreground">1,017 articles</p>
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => setActiveTab("balance")}
              className="p-5 bg-card border border-border rounded-2xl flex flex-col justify-between h-32 cursor-pointer transition-all hover:border-emerald-500/50"
            >
              <div className="flex justify-between items-start">
                <span className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-lg">
                  Bilan
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-500">Bénéfice Net Estimé</h4>
                <p className="text-2xl font-black text-foreground">185,000 FCFA</p>
              </div>
            </Card>
          </div>

          {/* Graphs / Pie Chart Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <Card className="p-6 bg-card border border-border rounded-2xl md:col-span-2">
              {renderPieChart()}
            </Card>

            <Card className="p-6 bg-card border border-border rounded-2xl flex flex-col gap-4">
              <h4 className="text-xs font-black text-foreground opacity-80 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Stocks bas / Alertes
              </h4>
              <div className="flex flex-col gap-3">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
                    <span className="text-sm font-bold text-foreground leading-none">{p.name}</span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${p.stock < 50 ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400" : "bg-emerald-100 text-emerald-700"}`}>
                      {p.stock} {p.unit}
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
          {/* Catalog list */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher un article de quincaillerie"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-xs outline-none focus:border-emerald-500 font-medium transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map((p) => (
                <Card
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="flex flex-col justify-between p-5 bg-card border border-border rounded-2xl cursor-pointer"
                >
                  <div>
                    <span className="text-xs bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-lg font-bold">
                      {p.unit}
                    </span>
                    <h4 className="mt-2 text-base font-extrabold text-foreground leading-tight">
                      {p.name}
                    </h4>
                    <p className="text-base font-black text-emerald-600 mt-1">
                      {p.price} FCFA
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
                    <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Détails
                    </span>
                    <span
                      onClick={(e) => addToCart(p, e)}
                      className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all select-none cursor-pointer"
                    >
                      <Plus className="h-4.5 w-4.5" />
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
                  Caisse Quincaillerie
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-red-500 font-bold hover:text-red-700 transition-all cursor-pointer"
                  >
                    Vider
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl text-center gap-3">
                  <p className="text-xs font-bold text-zinc-400">
                    Aucun article sélectionné
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cart.map((item, idx) => {
                    const p = products.find((prod) => prod.id === item.id);
                    if (!p) return null;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/40 rounded-xl"
                      >
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="text-sm font-bold text-foreground truncate leading-tight">
                            {p.name}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-zinc-400">Prix:</span>
                            <input
                              type="number"
                              value={item.customPrice ?? p.price}
                              onChange={(e) => updateCustomPrice(item.id, Number(e.target.value))}
                              className="w-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded text-xs font-bold text-emerald-600 outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 transition-all cursor-pointer select-none"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-extrabold text-foreground w-4 text-center">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 transition-all cursor-pointer select-none"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-4 border-t border-border flex justify-between items-center">
                    <span className="text-sm font-bold text-zinc-600">Total</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      {getTotal()} FCFA
                    </span>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    variant="primary"
                    size="lg"
                    className="w-full mt-1 font-black text-sm tracking-tight flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    Valider la vente
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TAB: CREDITS CLIENTS */}
      {activeTab === "credits" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Add new credit */}
          <Card className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xl flex flex-col gap-4">
            <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-purple-500" />
              Enregistrer un Crédit Client
            </h3>
            <p className="text-xs opacity-75 leading-normal mb-1">
              Enregistrez une ardoise ou un crédit client après avoir ajouté les articles dans le panier.
            </p>

            <form onSubmit={handleCreditSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Nom du client
                </label>
                <input
                  type="text"
                  placeholder="Ex: M. Kouakou"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Téléphone du client
                </label>
                <input
                  type="text"
                  placeholder="Ex: 05 00 00 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              {cart.length === 0 ? (
                <p className="text-xs text-red-500 font-bold animate-pulse">
                  * Le panier doit contenir des articles
                </p>
              ) : (
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl flex justify-between items-center text-xs font-bold">
                  <span className="text-zinc-500">Total crédit :</span>
                  <span className="text-purple-600">{getTotal()} FCFA</span>
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" disabled={cart.length === 0} className="mt-1 font-black text-sm tracking-tight">
                Enregistrer le crédit
              </Button>
            </form>
          </Card>

          {/* Credits list */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500" />
              Liste des crédits clients
            </h3>
            {credits.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-border text-center rounded-2xl text-xs font-bold text-zinc-400">
                Aucun crédit client enregistré
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {credits.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col p-4 bg-card border border-border rounded-xl"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-black text-foreground leading-tight">
                        {c.customer}
                      </h4>
                      <span className="text-xs font-extrabold text-red-600">
                        {c.total} FCFA
                      </span>
                    </div>
                    <p className="text-xs opacity-75 mt-1">
                      Contact: {c.phone} | Heure: {c.date}
                    </p>
                    <div className="mt-2 pt-2 border-t border-border text-xs font-semibold">
                      {c.items.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: SUPPLIER BULK DELIVERIES */}
      {activeTab === "supplier" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Card className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xl flex flex-col gap-4">
            <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
              <Box className="h-5 w-5 text-orange-500" />
              Arrivage Matériaux en Gros
            </h3>
            <p className="text-xs opacity-75 leading-normal mb-1">
              Enregistrez les livraisons par camion de gros fournisseurs ivoiriens (Sotaci, Ciments Bélier).
            </p>

            <form onSubmit={handleSupplierSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Nom du fournisseur (Ex: SOTACI)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ciments d'Afrique (CIMAF)"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Sélectionner l'article
                </label>
                <select
                  value={suppliedProduct}
                  onChange={(e) => setSuppliedProduct(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                >
                  <option value="">-- Choisir un matériau --</option>
                  {products.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name} (Stock: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Quantité livrée
                </label>
                <input
                  type="number"
                  min="1"
                  value={suppliedQty}
                  onChange={(e) => setSuppliedQty(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <Button type="submit" variant="primary" size="lg" className="mt-1 font-black text-sm tracking-tight">
                Enregistrer l'arrivage
              </Button>
            </form>
          </Card>

          {/* Arrivage history */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              Historique des réceptions matériels
            </h3>
            {supplyHistory.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-border text-center rounded-2xl text-xs font-bold text-zinc-400">
                Aucune réception matérielle enregistrée.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {supplyHistory.map((sh, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-card border border-border rounded-xl"
                  >
                    <div>
                      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-orange-100 text-orange-800">
                        {sh.supplier}
                      </span>
                      <h4 className="text-sm font-bold text-foreground mt-1.5 leading-tight">
                        {sh.item}
                      </h4>
                    </div>
                    <div className="text-right flex flex-col">
                      <span className="text-sm font-extrabold text-foreground">
                        +{sh.qty}
                      </span>
                      <span className="text-xs text-zinc-400">{sh.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: BALANCE */}
      {activeTab === "balance" && (
        <div className="flex flex-col gap-6">
          <Card className="p-6 bg-card border border-border rounded-2xl flex flex-col gap-5">
            <div className="flex flex-col leading-none gap-1">
              <h3 className="text-lg font-black text-foreground tracking-tight">Bilan Journalier de la Quincaillerie</h3>
              <p className="text-xs opacity-75">Contrôlez les encaissements directs et le solde des crédits du jour.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 rounded-xl flex flex-col justify-between h-28">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Ventes Cash</span>
                <p className="text-xl font-black text-foreground">845,000 FCFA</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">100% encaissé</span>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 rounded-xl flex flex-col justify-between h-28">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Créances à Recouvrer</span>
                <p className="text-xl font-black text-foreground">412,000 FCFA</p>
                <span className="text-[10px] text-red-500 font-bold">À surveiller de près</span>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 rounded-xl flex flex-col justify-between h-28">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Bénéfice Net Brut</span>
                <p className="text-xl font-black text-foreground">185,000 FCFA</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Encaissement optimal</span>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <Button variant="primary" size="lg" onClick={() => showToast("Clôture Quincaillerie effectuée !", "success")} className="font-extrabold text-sm tracking-wide">
                Clôturer la journée
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* POPUP / DETAILED MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-card border border-border p-6 rounded-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <span className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Wrench className="h-6 w-6" />
                </span>
                <div className="flex flex-col leading-none">
                  <span className="text-xs text-zinc-400 font-bold tracking-wider uppercase">Quincaillerie</span>
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
                <span className="text-zinc-400 font-bold">Prix de Vente</span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{selectedProduct.price} FCFA</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-bold">Unité de mesure</span>
                <span className="text-sm font-extrabold text-foreground">{selectedProduct.unit}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-bold">Articles en stock</span>
                <span className="text-sm font-extrabold text-foreground">{selectedProduct.stock}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-foreground">Description du matériel</h4>
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
