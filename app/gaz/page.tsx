"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import {
  Flame,
  RefreshCcw,
  Truck,
  Box,
  ShoppingCart,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  Eye,
  X,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Users,
  LayoutDashboard,
  FileText,
} from "lucide-react";

interface GasProduct {
  id: number;
  name: string;
  price: number;
  consignment: number;
  stock: number;
  description?: string;
  history?: string[];
}

const mockGas: GasProduct[] = [
  { id: 1, name: "Petroci B6 (6kg)", price: 2000, consignment: 15000, stock: 35, description: "Bouteille de gaz Petroci de 6 kg, format mobile populaire.", history: ["Arrivage le 01 Mai 2026: +40 bouteilles"] },
  { id: 2, name: "Oryx B12 (12kg)", price: 5500, consignment: 25000, stock: 22, description: "Bouteille de gaz Oryx de 12 kg, le format standard des ménages ivoiriens.", history: ["Arrivage le 01 Mai 2026: +30 bouteilles"] },
  { id: 3, name: "Total B28 (28kg)", price: 14000, consignment: 55000, stock: 8, description: "Bouteille de gaz Total de 28 kg format industriel pour restaurateurs.", history: ["Arrivage le 28 Avril 2026: +12 bouteilles"] },
];

export default function GazPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"dashboard" | "sales" | "deliveries" | "supplier" | "balance">("dashboard");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<{ id: number; qty: number; action: "recharge" | "consigne" }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<GasProduct | null>(null);

  // Delivery / Planning state
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveries, setDeliveries] = useState<any[]>([
    { address: "Cocody Riviera 3", phone: "0701020304", total: 5500, date: "12:30", items: ["1x Oryx B12 (recharge)"], status: "Prévue" },
    { address: "Marcory Zone 4", phone: "0501020304", total: 2000, date: "14:15", items: ["1x Petroci B6 (recharge)"], status: "Livrée" },
  ]);

  // Supplier supply arrival in bulk
  const [supplierName, setSupplierName] = useState("");
  const [suppliedProduct, setSuppliedProduct] = useState<number | "">("");
  const [suppliedQty, setSuppliedQty] = useState<number>(20);
  const [supplyHistory, setSupplyHistory] = useState<any[]>([
    { supplier: "Petroci CI", item: "Petroci B6 (6kg)", qty: 50, date: "01/05/2026" },
  ]);

  // General state products
  const [products, setProducts] = useState<GasProduct[]>(mockGas);

  const filteredGas = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (id: number, action: "recharge" | "consigne", e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const existing = cart.find((c) => c.id === id && c.action === action);
    if (existing) {
      setCart(cart.map((c) => (c.id === id && c.action === action ? { ...c, qty: c.qty + 1 } : c)));
    } else {
      setCart([...cart, { id, qty: 1, action }]);
    }
    const name = products.find((p) => p.id === id)?.name;
    showToast(`${name} (${action}) ajouté au panier !`, "success");
  };

  const updateQuantity = (id: number, action: "recharge" | "consigne", delta: number) => {
    setCart(
      cart
        .map((c) => (c.id === id && c.action === action ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
    showToast("Le panier de gaz a été vidé.", "info");
  };

  const getProductPrice = (id: number, action: "recharge" | "consigne") => {
    const p = products.find((prod) => prod.id === id);
    if (!p) return 0;
    return action === "recharge" ? p.price : p.consignment;
  };

  const getTotal = () =>
    cart.reduce((sum, item) => sum + getProductPrice(item.id, item.action) * item.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    showToast(`Vente de Gaz enregistrée : ${getTotal()} FCFA !`, "success");
    clearCart();
  };

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryAddress || !deliveryPhone || !deliveryDate || cart.length === 0) return;
    const d = {
      address: deliveryAddress,
      phone: deliveryPhone,
      items: cart.map((c) => `${c.qty}x ${products.find((p) => p.id === c.id)?.name} (${c.action})`),
      total: getTotal(),
      date: deliveryDate,
      status: "Prévue",
    };
    setDeliveries([d, ...deliveries]);
    showToast(`Livraison enregistrée pour ${deliveryAddress} à ${deliveryDate} !`, "success");
    setDeliveryAddress("");
    setDeliveryPhone("");
    setDeliveryDate("");
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
    setSuppliedQty(20);
  };

  // SVG-based simple premium Bar Chart Component
  const renderBarChart = () => {
    const salesData = [
      { day: "Lun", amount: 45000 },
      { day: "Mar", amount: 65000 },
      { day: "Mer", amount: 110000 },
      { day: "Jeu", amount: 80000 },
      { day: "Ven", amount: 140000 },
      { day: "Sam", amount: 195000 },
      { day: "Dim", amount: 125000 },
    ];
    const maxAmount = Math.max(...salesData.map((d) => d.amount));

    return (
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-black text-foreground opacity-80 uppercase tracking-wider">
          Volume des ventes de la semaine (FCFA)
        </h4>
        <div className="flex items-end justify-between h-44 bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800/50 p-4 rounded-xl gap-2 select-none">
          {salesData.map((d, i) => {
            const pct = (d.amount / maxAmount) * 100;
            return (
              <div key={i} className="flex flex-col items-center gap-2 h-full justify-end w-full">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {d.amount >= 1000 ? `${d.amount / 1000}k` : d.amount}
                </span>
                <div
                  style={{ height: `${pct}%` }}
                  className="w-full min-h-[4px] max-w-[36px] bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-t-lg transition-all cursor-pointer relative group"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded hidden group-hover:block pointer-events-none whitespace-nowrap shadow-lg">
                    {d.amount} FCFA
                  </div>
                </div>
                <span className="text-xs font-bold text-zinc-500">{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AppLayout title="Gaz & Livraisons" subtitle="Suivi des ventes, recharges et logistique">
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
          <RefreshCcw className="h-4 w-4" />
          Recharges & Ventes
        </button>
        <button
          onClick={() => setActiveTab("deliveries")}
          className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer shrink-0 ${
            activeTab === "deliveries"
              ? "bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700"
          }`}
        >
          <Truck className="h-4 w-4" />
          Planning Livraisons
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
          Arrivages Fournisseurs
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
                  <Flame className="h-5 w-5" />
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-lg">
                  Direct
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-500">Total Recharges (Aujourd'hui)</h4>
                <p className="text-2xl font-black text-foreground">345,000 FCFA</p>
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => setActiveTab("deliveries")}
              className="p-5 bg-card border border-border rounded-2xl flex flex-col justify-between h-32 cursor-pointer transition-all hover:border-emerald-500/50"
            >
              <div className="flex justify-between items-start">
                <span className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Truck className="h-5 w-5" />
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-lg">
                  Domicile
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-500">Ventes par Livraison</h4>
                <p className="text-2xl font-black text-foreground">115,000 FCFA</p>
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
                  Arrivage
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-500">Volume Total Bouteilles</h4>
                <p className="text-2xl font-black text-foreground">65 pleines</p>
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
                <p className="text-2xl font-black text-foreground">46,000 FCFA</p>
              </div>
            </Card>
          </div>

          {/* Graphical Section Bar Chart */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <Card className="p-6 bg-card border border-border rounded-2xl md:col-span-2">
              {renderBarChart()}
            </Card>

            <Card className="p-6 bg-card border border-border rounded-2xl flex flex-col gap-4">
              <h4 className="text-xs font-black text-foreground opacity-80 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Niveaux des stocks critiques
              </h4>
              <div className="flex flex-col gap-3">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
                    <span className="text-sm font-bold text-foreground leading-none">{p.name}</span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${p.stock < 10 ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400" : "bg-emerald-100 text-emerald-700"}`}>
                      {p.stock}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB: SALES, RECHARGES & CONSIGNES */}
      {activeTab === "sales" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Products grid */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher une bouteille de gaz"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-xs outline-none focus:border-emerald-500 font-medium transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredGas.map((p) => (
                <Card
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="flex flex-col justify-between p-5 bg-card border border-border rounded-2xl cursor-pointer"
                >
                  <div>
                    <span className="text-xs bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 px-2.5 py-1 rounded-lg font-bold">
                      Bouteille de Gaz
                    </span>
                    <h4 className="mt-2 text-base font-extrabold text-foreground leading-tight">
                      {p.name}
                    </h4>
                    <div className="flex flex-col mt-2 gap-1 text-sm font-bold">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Recharge : {p.price} FCFA
                      </span>
                      <span className="text-blue-600 dark:text-blue-400">
                        Consigne : {p.consignment} FCFA
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
                    <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Détails
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => addToCart(p.id, "recharge", e)}
                        className="px-3 py-2 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold text-xs rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all cursor-pointer"
                      >
                        Recharge
                      </button>
                      <button
                        onClick={(e) => addToCart(p.id, "consigne", e)}
                        className="px-3 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all cursor-pointer"
                      >
                        Consigne
                      </button>
                    </div>
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
                  Panier de Gaz
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
                    Aucun article dans le panier
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cart.map((item, idx) => {
                    const p = products.find((prod) => prod.id === item.id);
                    if (!p) return null;
                    const price = item.action === "recharge" ? p.price : p.consignment;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/40 rounded-xl"
                      >
                        <div className="flex-1 min-w-0 flex flex-col">
                          <span className="text-sm font-bold text-foreground leading-tight">
                            {p.name}
                          </span>
                          <span className="text-xs font-semibold text-zinc-400 mt-1 capitalize">
                            Mode: {item.action} — {price} FCFA
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.action, -1)}
                            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 transition-all cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-extrabold text-foreground w-4 text-center">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.action, 1)}
                            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 transition-all cursor-pointer"
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

                  <Button onClick={handleCheckout} variant="primary" size="lg" className="w-full mt-1 font-black text-sm tracking-tight flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Enregistrer la vente
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TAB: DELIVERIES & LOGISTICS */}
      {activeTab === "deliveries" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Card className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xl flex flex-col gap-4">
            <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-500" />
              Planifier une Livraison
            </h3>
            <p className="text-xs opacity-75 leading-normal mb-1">
              Remplissez l'adresse Ivoirienne du client et le créneau horaire après avoir sélectionné les articles.
            </p>

            <form onSubmit={handleDeliverySubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Adresse de livraison (Ex: Cocody Riviera 3)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Abidjan, Angré 7ème Tranche"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Téléphone du client
                </label>
                <input
                  type="text"
                  placeholder="Ex: 07 00 00 00 00"
                  value={deliveryPhone}
                  onChange={(e) => setDeliveryPhone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Heure de livraison
                </label>
                <input
                  type="time"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="pt-2">
                {cart.length === 0 ? (
                  <p className="text-xs text-red-500 font-bold animate-pulse">
                    * Le panier doit contenir des articles
                  </p>
                ) : (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl flex justify-between items-center text-xs font-bold">
                    <span className="text-zinc-500">Total :</span>
                    <span className="text-emerald-600">{getTotal()} FCFA</span>
                  </div>
                )}
              </div>

              <Button type="submit" variant="primary" size="lg" disabled={cart.length === 0} className="mt-1 font-black text-sm tracking-tight">
                Confirmer la livraison
              </Button>
            </form>
          </Card>

          {/* Planning view */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              Calendrier de livraison du jour
            </h3>
            {deliveries.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-border text-center rounded-2xl text-xs font-bold text-zinc-400">
                Aucun planning de livraison enregistré
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {deliveries.map((d, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col p-4 bg-card border border-border rounded-xl"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-black text-foreground leading-tight">
                        {d.address}
                      </h4>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        {d.total} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs opacity-75">
                        Contact: {d.phone} | Heure: {d.date}
                      </p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${d.status === "Livrée" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                        {d.status}
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-border text-xs font-semibold">
                      {d.items.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: SUPPLIER BULK SUPPLY ARRIVALS */}
      {activeTab === "supplier" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Card className="p-5 sm:p-6 bg-card border border-border rounded-2xl shadow-xl flex flex-col gap-4">
            <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
              <Box className="h-5 w-5 text-orange-500" />
              Réception de Bouteilles en gros
            </h3>
            <p className="text-xs opacity-75 leading-normal mb-1">
              Enregistrez la livraison de gaz par les camions fournisseurs (Petroci, Oryx, etc.).
            </p>

            <form onSubmit={handleSupplierSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground opacity-90">
                  Fournisseur de gaz
                </label>
                <input
                  type="text"
                  placeholder="Ex: Petroci CI, Oryx Gaz"
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
                  <option value="">-- Choisir une bouteille --</option>
                  {products.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name} (Stock actuel: {p.stock})
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
              Historique des arrivages
            </h3>
            {supplyHistory.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-border text-center rounded-2xl text-xs font-bold text-zinc-400">
                Aucun arrivage enregistré.
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

      {/* TAB: BALANCE AND TRACKING */}
      {activeTab === "balance" && (
        <div className="flex flex-col gap-6">
          <Card className="p-6 bg-card border border-border rounded-2xl flex flex-col gap-5">
            <div className="flex flex-col leading-none gap-1">
              <h3 className="text-lg font-black text-foreground tracking-tight">Bilan & Suivi de Trésorerie du jour</h3>
              <p className="text-xs opacity-75">Visualisez les marges et clôturez votre journée de ventes de Gaz.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 rounded-xl flex flex-col justify-between h-28">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Volume Recharges</span>
                <p className="text-xl font-black text-foreground">172 Bouteilles</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Performance : +12% vs hier</span>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 rounded-xl flex flex-col justify-between h-28">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recettes Brutes</span>
                <p className="text-xl font-black text-foreground">585,000 FCFA</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">100% encaissé</span>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 rounded-xl flex flex-col justify-between h-28">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pertes ou Avaries</span>
                <p className="text-xl font-black text-foreground">0 Bouteilles</p>
                <span className="text-[10px] text-zinc-500 font-bold">Aucune anomalie</span>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <Button variant="primary" size="lg" onClick={() => showToast("Journée clôturée avec succès !", "success")} className="font-extrabold text-sm tracking-wide">
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
                <span className="p-3 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-xl">
                  <Flame className="h-6 w-6" />
                </span>
                <div className="flex flex-col leading-none">
                  <span className="text-xs text-zinc-400 font-bold tracking-wider uppercase">Gaz & Livraisons</span>
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
                <span className="text-zinc-400 font-bold">Prix de Recharge</span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{selectedProduct.price} FCFA</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-bold">Prix de Consigne</span>
                <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{selectedProduct.consignment} FCFA</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-bold">Bouteilles en stock</span>
                <span className="text-sm font-extrabold text-foreground">{selectedProduct.stock}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-foreground">Description de la bouteille</h4>
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

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  addToCart(selectedProduct.id, "recharge");
                  setSelectedProduct(null);
                }}
                variant="primary"
                size="lg"
                className="flex-1 font-black text-sm tracking-tight flex items-center justify-center gap-2"
              >
                Recharge
              </Button>
              <Button
                onClick={() => {
                  addToCart(selectedProduct.id, "consigne");
                  setSelectedProduct(null);
                }}
                variant="outline"
                size="lg"
                className="flex-1 font-black text-sm tracking-tight flex items-center justify-center gap-2"
              >
                Consigne
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
