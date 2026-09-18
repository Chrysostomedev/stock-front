"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import SaleService, { Sale } from "@/services/sale.service";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus,
  Search,
  Building2,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Power,
  Mail,
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  ShoppingCart,
  Clock,
  User,
  Wrench,
  AlertTriangle,
  RotateCcw,
  XCircle,
  Package,
  CheckCircle2,
} from "lucide-react";
import { useShops } from "@/hooks/admin/useShops";
import { Shop } from "@/types/admin";
import { ShopType } from "@/services/shop.service";
import Pagination from "@/components/ui/Pagination";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Espèces (Cash)" },
  { value: "MOBILE_MONEY", label: "Mobile Money (Wave, Orange, MTN...)" },
  { value: "BANK_CARD", label: "Carte Bancaire" },
  { value: "CHECK", label: "Chèque" },
  { value: "OTHER", label: "Autre" },
];

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
const SHOP_TYPE_LABELS: Record<string, string> = {
  SUPERMARKET:  "Superette / Épicerie",
  HARDWARE:     "Quincaillerie / Matériaux",
  PHARMACY:     "Pharmacie",
  RESTAURANT:   "Restaurant / Fast-food",
  GAS_STATION:  "Station-service / Dépôt de gaz",
  CLOTHING:     "Prêt-à-porter / Textile",
  ELECTRONICS:  "High-tech / Électronique",
  BAKERY:       "Boulangerie / Pâtisserie",
  WHOLESALE:    "Commerce de gros",
  OTHER:        "Autre",
};

// Hook pour détecter la taille d'écran de manière réactive
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}
// ---- Composant carte mobile ----
function MobileShopCard({
  s,
  onEdit,
  onToggle,
  onDelete,
  onViewSales,
  onCaisse,
}: {
  s: Shop;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onViewSales: () => void;
  onCaisse: () => void;
}) {
  return (
    <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${s.shopType === ShopType.HARDWARE ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" : "bg-primary/10 text-primary"}`}>
            {s.shopType === ShopType.HARDWARE ? (
              <Wrench className="h-4 w-4" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-foreground">{s.name}</span>
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
              {s.shopTypeLabel || SHOP_TYPE_LABELS[s.shopType] || s.shopType}
            </span>
          </div>
        </div>
        <Badge variant={s.isActive ? "success" : "outline"}>
          {s.isActive ? "Actif" : "Inactif"}
        </Badge>
      </div>
      <div className="flex flex-col gap-1.5 text-xs font-bold text-zinc-500">
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-zinc-400" />
          {s.address}
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3 text-zinc-400" />
          {s.phone}
        </div>
        {s.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3 text-zinc-400" />
            {s.email}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
        <Button
          variant="primary"
          size="sm"
          className="flex-1 text-[10px] font-black uppercase"
          onClick={onViewSales}
        >
          <TrendingUp className="h-3.5 w-3.5 mr-1" /> Ventes
        </Button>
        <button
          onClick={onCaisse}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all border border-emerald-200 dark:border-emerald-800"
          title="Accéder à la caisse"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Caisse
        </button>
        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-primary transition-all"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={onToggle}
          className={`p-2 rounded-lg transition-all ${s.isActive ? "hover:bg-red-50 text-zinc-400 hover:text-red-600" : "hover:bg-green-50 text-zinc-400 hover:text-green-600"}`}
        >
          <Power className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-600 transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
export default function AdminBoutiquesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const {
    shops,
    loading,
    error,
    addShop,
    updateShop,
    deleteShop,
    toggleStatus,
    refresh,
  } = useShops();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();

  const SALES_LIMIT = 100;

  // Detailed Sales View States
  const [salesViewShop, setSalesViewShop] = useState<Shop | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState(false);
  const [salesPage, setSalesPage] = useState(1);
  const [salesTotalPages, setSalesTotalPages] = useState(1);
  const [salesTotal, setSalesTotal] = useState(0);
  const [expandedDays, setExpandedDays] = useState<{ [key: string]: boolean }>(
    {},
  );
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);

  // Handlers VOID (Annulation)
  const [isVoidOpen, setIsVoidOpen] = useState(false);
  const [voidSale, setVoidSale] = useState<Sale | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [isVoidSubmitting, setIsVoidSubmitting] = useState(false);

  // Handlers REFUND (Remboursement / Retour)
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [refundSale, setRefundSale] = useState<Sale | null>(null);
  const [refundMode, setRefundMode] = useState<"total" | "partial">("total");
  const [refundReason, setRefundReason] = useState("");
  const [refundReference, setRefundReference] = useState("");
  const [refundPaymentMethod, setRefundPaymentMethod] = useState("CASH");
  const [returnToStock, setReturnToStock] = useState(true);
  const [refundItems, setRefundItems] = useState<
    { saleItemId: string; quantity: number; maxQty: number; productName: string }[]
  >([]);
  const [isRefundSubmitting, setIsRefundSubmitting] = useState(false);

  /* ── Actions Annulation ── */
  const openVoidModal = (sale: any) => {
    setVoidSale(sale);
    setVoidReason("");
    setIsVoidOpen(true);
  };

  const handleVoid = async () => {
    if (!voidSale || !voidReason.trim()) return;
    setIsVoidSubmitting(true);
    try {
      const updated = await SaleService.void(voidSale.id, {
        userId: user?.id || "",
        reason: voidReason.trim(),
      });
      setSales((prev) =>
        prev.map((s) => s.id === voidSale.id ? { ...s, status: "VOIDED", notes: updated.notes } : s)
      );
      if (selectedSaleDetail?.id === voidSale.id) {
        setSelectedSaleDetail((prev) => prev ? { ...prev, status: "VOIDED" } : null);
      }
      showToast(
        `Vente ${updated.receiptNumber || voidSale.receiptNumber} annulée — stock restitué`,
        "success"
      );
      setIsVoidOpen(false);
      setVoidSale(null);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || "Erreur lors de l'annulation", "error");
    } finally {
      setIsVoidSubmitting(false);
    }
  };

  /* ── Actions Remboursement ── */
  const openRefundModal = (sale: any) => {
    setRefundSale(sale);
    setRefundMode("total");
    setRefundReason("");
    setRefundReference("");
    setRefundPaymentMethod("CASH");
    setReturnToStock(true);
    setRefundItems(
      (sale.items || []).map((item: any) => ({
        saleItemId: item.id,
        quantity: 0,
        maxQty: Number(item.quantity),
        productName: item.productName || "Produit",
      }))
    );
    setIsRefundOpen(true);
  };

  const updateRefundItemQty = (saleItemId: string, qty: number) => {
    setRefundItems((prev) =>
      prev.map((i) =>
        i.saleItemId === saleItemId
          ? { ...i, quantity: Math.max(0, Math.min(qty, i.maxQty)) }
          : i
      )
    );
  };

  const refundTotal = useMemo(() => {
    if (!refundSale) return 0;
    if (refundMode === "total") return Number(refundSale.totalAmount || refundSale.total || 0);
    return refundItems.reduce((acc, ri) => {
      const item = refundSale.items?.find((i: any) => i.id === ri.saleItemId);
      if (!item || ri.quantity === 0) return acc;
      return acc + Number(item.unitPrice) * ri.quantity;
    }, 0);
  }, [refundSale, refundMode, refundItems]);

  const handleRefund = async () => {
    if (!refundSale || !refundReason.trim()) return;
    if (refundMode === "partial" && refundItems.every((i) => i.quantity === 0)) {
      showToast("Veuillez saisir au moins une quantité à rembourser", "error");
      return;
    }
    setIsRefundSubmitting(true);
    try {
      const dto: any = {
        userId: user?.id || "",
        paymentMethod: refundPaymentMethod,
        returnToStock,
        reason: refundReason.trim(),
      };
      if ((refundPaymentMethod === "MOBILE_MONEY" || refundPaymentMethod === "BANK_CARD") && refundReference.trim()) {
        dto.reference = refundReference.trim();
      }
      if (refundMode === "partial") {
        dto.items = refundItems
          .filter((i) => i.quantity > 0)
          .map((i) => ({ saleItemId: i.saleItemId, quantity: i.quantity }));
      }

      const refundResult = await SaleService.refund(refundSale.id, dto);
      setSales((prev) => [refundResult, ...prev]);
      if (salesViewShop) {
        fetchSales(salesViewShop, salesPage);
      }
      showToast(
        `Remboursement ${refundResult.receiptNumber} créé — ${fmt(refundResult.totalAmount || refundResult.total || 0)} XOF remboursés`,
        "success"
      );
      setIsRefundOpen(false);
      setRefundSale(null);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || "Erreur lors du remboursement", "error");
    } finally {
      setIsRefundSubmitting(false);
    }
  };

  const needsReference = refundPaymentMethod === "MOBILE_MONEY" || refundPaymentMethod === "BANK_CARD";

  const [formData, setFormData] = useState<Partial<Shop>>({
    name: "",
    address: "",
    phone: "",
    email: "",
    currency: "XOF",
    isActive: true,
    shopType: ShopType.SUPERMARKET,
    shopTypeLabel: "",
  });

  useEffect(() => {
    if (selectedShop) {
      setFormData({
        name: selectedShop.name,
        address: selectedShop.address,
        phone: selectedShop.phone,
        email: selectedShop.email,
        currency: selectedShop.currency,
        isActive: selectedShop.isActive,
        shopType: selectedShop.shopType,
        shopTypeLabel: selectedShop.shopTypeLabel,
      });
    } else {
      setFormData({
        name: "",
        address: "",
        phone: "",
        email: "",
        currency: "XOF",
        isActive: true,
        shopType: ShopType.SUPERMARKET,
        shopTypeLabel: "",
      });
    }
  }, [selectedShop, isModalOpen]);

  const fetchSales = async (shop: Shop, page = 1) => {
    setSalesLoading(true);
    setSalesError(false);
    try {
      const response = await SaleService.getAll({
        shopId: shop.id,
        page,
        limit: SALES_LIMIT,
      });
      const list =
        response.data && Array.isArray(response.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];
      setSales(list);
      setSalesTotal(response.total ?? list.length);
      setSalesTotalPages(response.totalPages ?? 1);
      setSalesPage(page);
      if (page === 1 && list.length > 0) {
        const firstDateStr = new Date(list[0].createdAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        setExpandedDays({ [firstDateStr]: true });
      }
    } catch (err) {
      console.error("Error loading sales for shop", err);
      setSalesError(true);
    } finally {
      setSalesLoading(false);
    }
  };
  // Load Sales when salesViewShop is selected
  useEffect(() => {
    if (salesViewShop) {
      fetchSales(salesViewShop, 1);
    } else {
      setSales([]);
      setExpandedDays({});
      setSalesPage(1);
      setSalesTotalPages(1);
      setSalesTotal(0);
      setSalesError(false);
    }
  }, [salesViewShop]);

  const toggleDayExpansion = (dayStr: string) => {
    setExpandedDays((prev) => ({ ...prev, [dayStr]: !prev[dayStr] }));
  };

  const handleSubmit = async () => {
    try {
      if (selectedShop) {
        await updateShop(selectedShop.id, formData);
      } else {
        await addShop(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  };
  const filteredShops = shops.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.address.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  // Group Sales by Calendar Day
  const salesByDay = React.useMemo(() => {
    const groups: {
      [dateStr: string]: { date: Date; sales: any[]; totalAmount: number };
    } = {};
    sales.forEach((s) => {
      const date = new Date(s.createdAt);
      const dateStr = date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!groups[dateStr]) {
        groups[dateStr] = { date, sales: [], totalAmount: 0 };
      }
      groups[dateStr].sales.push(s);
      if (s.status !== "VOIDED" && s.status !== "REFUNDED") {
        groups[dateStr].totalAmount += Number(s.totalAmount || s.total || 0);
      }
    });
    return Object.entries(groups).sort(
      (a, b) => b[1].date.getTime() - a[1].date.getTime(),
    );
  }, [sales]);

  const totalShopsCA = sales.reduce(
    (acc, s) => acc + Number(s.totalAmount || s.total || 0),
    0,
  );

  // Icône selon le type de boutique
  const ShopIcon = ({ shopType }: { shopType: string }) =>
    shopType === ShopType.HARDWARE ? (
      <Wrench className="h-5 w-5" />
    ) : (
      <Building2 className="h-5 w-5" />
    );

  // Couleur de fond de l'icône selon le type
  const shopIconBg = (shopType: string) =>
    shopType === ShopType.HARDWARE
      ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
      : "bg-primary/10 text-primary";

  // ----- COLONNES DESKTOP (DataTable) -----
  const columns: {
    header: string;
    accessor: keyof Shop | ((item: Shop) => React.ReactNode);
    className?: string;
  }[] = [
    {
      header: "Boutique",
      accessor: (s: Shop) => (
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center ${shopIconBg(s.shopType)}`}
          >
            <ShopIcon shopType={s.shopType} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-foreground">{s.name}</span>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              {s.shopTypeLabel || SHOP_TYPE_LABELS[s.shopType] || s.shopType}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Emplacement",
      accessor: (s: Shop) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-zinc-400 shrink-0" />
          <span className="text-xs font-bold">{s.address}</span>
        </div>
      ),
    },
    {
      header: "Contact",
      accessor: (s: Shop) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-zinc-400 shrink-0" />
            <span className="text-[10px] font-bold">{s.phone}</span>
          </div>
          {s.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-zinc-400 shrink-0" />
              <span className="text-[10px] text-zinc-400 font-bold">
                {s.email}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Statut",
      accessor: (s: Shop) => (
        <Badge variant={s.isActive ? "success" : "outline"}>
          {s.isActive ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessor: (s: Shop) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] font-black uppercase tracking-wider py-1.5 px-3"
            onClick={() => setSalesViewShop(s)}
          >
            Ventes
          </Button>
          <button
            onClick={() => router.push(`/admin/caisse?shopId=${s.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border border-emerald-200 dark:border-emerald-800 hover:border-emerald-500"
            title={`Accéder à la caisse de ${s.name}`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Caisse
          </button>
          <button
            onClick={() => {
              setSelectedShop(s);
              setIsModalOpen(true);
            }}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"
            title="Modifier"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedShop(s);
              setIsConfirmOpen(true);
            }}
            className={`p-2 rounded-lg transition-all ${
              s.isActive
                ? "hover:bg-red-50 text-zinc-400 hover:text-red-600"
                : "hover:bg-green-50 text-zinc-400 hover:text-green-600"
            }`}
            title={s.isActive ? "Désactiver" : "Activer"}
          >
            <Power className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedShop(s);
              setIsDeleteConfirmOpen(true);
            }}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-zinc-400 hover:text-red-600 transition-all"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: "text-right",
    },
  ];
  // ---- Vue détaillée des ventes d'une boutique ----
  if (salesViewShop) {
    return (
      <AppLayout
        title={`Suivi d'Activité : ${salesViewShop.name}`}
        subtitle={`Ventes journalières détaillées — ${salesViewShop.shopTypeLabel || SHOP_TYPE_LABELS[salesViewShop.shopType] || salesViewShop.shopType}`}
        backUrl="#"
        rightElement={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSalesViewShop(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux Boutiques
          </Button>
        }
      >
        <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-32 md:pb-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-foreground tracking-tight flex items-center gap-2">
                <Calendar className="h-5 w-5 text-zinc-400" />
                Journal des Ventes par Journée régroupés par 100 dernières transactions
              </h3>
              {salesTotalPages > 1 && (
                <span className="text-[11px] font-bold text-zinc-400">
                  Page {salesPage} / {salesTotalPages}
                </span>
              )}
            </div>
            {salesLoading ? (
              <div className="py-20 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
                Chargement de l&apos;activité...
              </div>
            ) : salesError ? (
              <Card className="p-12 text-center flex flex-col items-center gap-3">
                <p className="text-sm font-black text-rose-500">Impossible de charger les ventes</p>
                <p className="text-xs font-bold text-zinc-400">Le serveur a retourné une erreur. Réessayez dans quelques instants.</p>
                <button
                  onClick={() => salesViewShop && fetchSales(salesViewShop, 1)}
                  className="mt-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-black hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                >
                  Réessayer
                </button>
              </Card>
            ) : salesByDay.length === 0 ? (
              <Card className="p-12 text-center text-zinc-400 font-bold text-sm">
                Aucune vente n&apos;a encore été enregistrée pour cette
                boutique.
              </Card>
            ) : (
              salesByDay.map(([dayStr, group]) => {
                const isOpen = !!expandedDays[dayStr];
                return (
                  <Card
                    key={dayStr}
                    className="p-0 overflow-hidden border border-zinc-150 dark:border-zinc-800 shadow-md"
                  >
                    <button
                      onClick={() => toggleDayExpansion(dayStr)}
                      className="w-full flex items-center justify-between p-5 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100/50 transition-all border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        {isOpen ? (
                          <ChevronDown className="h-5 w-5 text-zinc-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-zinc-400" />
                        )}
                        <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                          {dayStr}
                        </span>
                      </div>
                      <span className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 rounded-full text-[10px] uppercase font-black tracking-wider text-zinc-500">
                        {group.sales.length}{" "}
                        {group.sales.length > 1 ? "Ventes" : "Vente"}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="p-4 overflow-x-auto">
                        <table className="w-full text-left text-xs font-bold border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider">
                              <th className="py-2.5 px-3">Ticket</th>
                              <th className="py-2.5 px-3">Heure</th>
                              <th className="py-2.5 px-3">Client</th>
                              <th className="py-2.5 px-3">Statut</th>
                              <th className="py-2.5 px-3">Paiement</th>
                              <th className="py-2.5 px-3 text-right">
                                Montant
                              </th>
                              <th className="py-2.5 px-3 text-right">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.sales.map((sale) => {
                              const paymentMethod =
                                sale.payments?.[0]?.method || "CASH";
                              const isVoided = sale.status === "VOIDED";
                              const isRefunded = sale.status === "REFUNDED";
                              const isInactive = isVoided || isRefunded;
                              return (
                                <tr
                                  key={sale.id}
                                  className={`border-b border-zinc-100/70 dark:border-zinc-800/40 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/20 ${isInactive ? "opacity-60 bg-zinc-50/20 dark:bg-zinc-900/20" : ""}`}
                                >
                                  <td className="py-3 px-3 text-foreground font-black">
                                    {sale.receiptNumber ||
                                      sale.id.slice(-6).toUpperCase()}
                                  </td>
                                  <td className="py-3 px-3 text-zinc-500">
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-3.5 w-3.5 opacity-60" />
                                      {new Date(
                                        sale.createdAt,
                                      ).toLocaleTimeString("fr-FR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">
                                    <div className="flex items-center gap-1.5">
                                      <User className="h-3.5 w-3.5 opacity-60" />
                                      {sale.customer?.name ||
                                        "Client de passage"}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3">
                                    {isVoided ? (
                                      <Badge variant="danger" className="text-[9px] uppercase tracking-wider">
                                        Annulée
                                      </Badge>
                                    ) : isRefunded ? (
                                      <Badge variant="warning" className="text-[9px] uppercase tracking-wider">
                                        Remboursée
                                      </Badge>
                                    ) : (
                                      <Badge variant="success" className="text-[9px] uppercase tracking-wider">
                                        Payée
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="py-3 px-3">
                                    <Badge
                                      variant={
                                        paymentMethod === "CASH"
                                          ? "success"
                                          : "primary"
                                      }
                                      className="text-[9px] uppercase tracking-wider"
                                    >
                                      {paymentMethod}
                                    </Badge>
                                  </td>
                                  <td className={`py-3 px-3 text-right font-black ${isVoided ? "line-through text-zinc-400" : isRefunded ? "text-amber-600 dark:text-amber-400" : "text-primary"}`}>
                                    {fmt(sale.totalAmount || sale.total || 0)} XOF
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="py-1 px-2.5 text-[10px] font-black uppercase tracking-wider"
                                        onClick={() =>
                                          setSelectedSaleDetail(sale)
                                        }
                                      >
                                        Panier
                                      </Button>

                                      {!isInactive && (
                                        <>
                                          <button
                                            onClick={() => openRefundModal(sale)}
                                            className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white dark:bg-amber-950/30 dark:text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border border-amber-200 dark:border-amber-800 hover:border-amber-500"
                                            title="Rembourser / Retourner cette vente"
                                          >
                                            <RotateCcw className="h-3 w-3" />
                                            Retour
                                          </button>
                                          <button
                                            onClick={() => openVoidModal(sale)}
                                            className="flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white dark:bg-red-950/30 dark:text-red-400 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border border-red-200 dark:border-red-800 hover:border-red-600"
                                            title="Annuler cette vente et restituer le stock"
                                          >
                                            <XCircle className="h-3 w-3" />
                                            Annuler
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                );
              })
            )}

            <Pagination
              currentPage={salesPage}
              totalPages={salesTotalPages}
              total={salesTotal}
              limit={SALES_LIMIT}
              onPageChange={(page) => {
                if (salesViewShop) {
                  fetchSales(salesViewShop, page);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            />
          </div>
        </div>

        {/* Modal détail vente */}
        <Modal
          isOpen={!!selectedSaleDetail}
          onClose={() => setSelectedSaleDetail(null)}
          title={`Détails Ticket : ${selectedSaleDetail?.receiptNumber || selectedSaleDetail?.id?.slice(-6)?.toUpperCase()}`}
          size="lg"
        >
          {selectedSaleDetail && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4 text-xs font-bold bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-400 uppercase text-[9px] tracking-wider font-black">
                    Date & Heure
                  </span>
                  <span className="text-foreground">
                    {new Date(selectedSaleDetail.createdAt).toLocaleDateString(
                      "fr-FR",
                    )}{" "}
                    à{" "}
                    {new Date(selectedSaleDetail.createdAt).toLocaleTimeString(
                      "fr-FR",
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-400 uppercase text-[9px] tracking-wider font-black">
                    Client
                  </span>
                  <span className="text-foreground">
                    {selectedSaleDetail.customer?.name || "Client de passage"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-400 uppercase text-[9px] tracking-wider font-black">
                    Mode de Paiement
                  </span>
                  <span className="text-foreground">
                    {selectedSaleDetail.payments?.[0]?.method || "CASH"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-400 uppercase text-[9px] tracking-wider font-black">
                    Montant Reçu
                  </span>
                  <span className="text-foreground">
                    {new Intl.NumberFormat("fr-FR").format(
                      selectedSaleDetail.payments?.[0]?.amount ||
                        selectedSaleDetail.totalAmount ||
                        0,
                    )}{" "}
                    XOF
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-black uppercase text-zinc-500 tracking-wider">
                  Produits Achetés (Panier)
                </h4>
                <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs font-bold">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[9px] text-zinc-400 uppercase tracking-widest">
                        <th className="py-2 px-3">Désignation</th>
                        <th className="py-2 px-3 text-center">Qté</th>
                        <th className="py-2 px-3 text-right">P.U.</th>
                        <th className="py-2 px-3 text-right">Réduction</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSaleDetail.items?.map(
                        (item: any, idx: number) => {
                          const quantity = Number(item.quantity);
                          const unitPrice = Number(item.unitPrice);
                          const discount = Number(item.discount || 0);
                          const totalPrice = Number(
                            item.totalPrice || quantity * unitPrice - discount,
                          );
                          return (
                            <tr
                              key={idx}
                              className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50"
                            >
                              <td className="py-2.5 px-3">
                                <div className="flex flex-col">
                                  <span className="text-foreground font-black">
                                    {item.productName || "Produit inconnu"}
                                  </span>
                                  {item.productSku && (
                                    <span className="text-[9px] text-zinc-400 font-mono">
                                      SKU: {item.productSku}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center text-zinc-600 dark:text-zinc-300 font-black">
                                {quantity}
                              </td>
                              <td className="py-2.5 px-3 text-right text-zinc-600 dark:text-zinc-300">
                                {new Intl.NumberFormat("fr-FR").format(
                                  unitPrice,
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right text-red-500 font-medium">
                                -
                                {new Intl.NumberFormat("fr-FR").format(
                                  discount,
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right text-primary font-black">
                                {new Intl.NumberFormat("fr-FR").format(
                                  totalPrice,
                                )}{" "}
                                XOF
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <div className="flex justify-between w-64 text-xs">
                  <span className="text-zinc-400">Sous-total :</span>
                  <span className="font-bold">
                    {new Intl.NumberFormat("fr-FR").format(
                      Number(
                        selectedSaleDetail.subtotal ||
                          selectedSaleDetail.totalAmount,
                      ),
                    )}{" "}
                    XOF
                  </span>
                </div>
                <div className="flex justify-between w-64 text-xs">
                  <span className="text-zinc-400">Remise globale :</span>
                  <span className="font-bold text-red-500">
                    -
                    {new Intl.NumberFormat("fr-FR").format(
                      Number(selectedSaleDetail.discountAmount || 0),
                    )}{" "}
                    XOF
                  </span>
                </div>
                <div className="flex justify-between w-64 text-sm font-black border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-1.5 mt-1">
                  <span className="text-foreground">Total payé :</span>
                  <span className="text-primary">
                    {new Intl.NumberFormat("fr-FR").format(
                      Number(
                        selectedSaleDetail.totalAmount ||
                          selectedSaleDetail.total,
                      ),
                    )}{" "}
                    XOF
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  {selectedSaleDetail.status !== "VOIDED" && selectedSaleDetail.status !== "REFUNDED" && (
                    <>
                      <button
                        onClick={() => {
                          const sale = selectedSaleDetail;
                          setSelectedSaleDetail(null);
                          openRefundModal(sale);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white dark:bg-amber-950/30 dark:text-amber-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-amber-200 dark:border-amber-800"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Rembourser / Retour
                      </button>
                      <button
                        onClick={() => {
                          const sale = selectedSaleDetail;
                          setSelectedSaleDetail(null);
                          openVoidModal(sale);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white dark:bg-red-950/30 dark:text-red-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-red-200 dark:border-red-800"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Annuler la vente
                      </button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSaleDetail(null)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* ══════════════ MODAL VOID (ANNULATION) ══════════════ */}
        <Modal
          isOpen={isVoidOpen}
          onClose={() => { setIsVoidOpen(false); setVoidReason(""); }}
          title="Annuler la vente"
          size="sm"
        >
          {voidSale && (
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-black text-red-800 dark:text-red-400">
                    Annulation de la vente {voidSale.receiptNumber || voidSale.id.slice(-6).toUpperCase()}
                  </p>
                  <p className="text-[11px] text-red-700/80 dark:text-red-500">
                    Le stock des articles sera automatiquement restitué. Cette action ne peut pas être inversée.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Raison de l&apos;annulation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Ex : Erreur de saisie, annulation admin, client a changé d'avis…"
                  rows={3}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-red-400 transition-all resize-none"
                />
                <p className="text-[10px] text-zinc-400">
                  {voidReason.trim().length} / minimum 5 caractères
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setIsVoidOpen(false); setVoidReason(""); }}
                  disabled={isVoidSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-red-600 hover:bg-red-700 border-red-600"
                  onClick={handleVoid}
                  loading={isVoidSubmitting}
                  disabled={voidReason.trim().length < 5}
                >
                  Confirmer l&apos;annulation
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* ══════════════ MODAL REFUND (REMBOURSEMENT) ══════════════ */}
        <Modal
          isOpen={isRefundOpen}
          onClose={() => { setIsRefundOpen(false); setRefundSale(null); }}
          title="Rembourser / Retourner une vente"
          size="md"
        >
          {refundSale && (
            <div className="flex flex-col gap-5">
              {/* Info vente */}
              <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl text-xs">
                <div>
                  <p className="font-black text-foreground">{refundSale.receiptNumber || refundSale.id.slice(-6).toUpperCase()}</p>
                  <p className="text-zinc-400">{fmt(refundSale.totalAmount || refundSale.total || 0)} XOF</p>
                </div>
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">
                  {refundSale.items?.length || 0} article(s)
                </span>
              </div>

              {/* Toggle mode */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRefundMode("total")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition-all ${
                    refundMode === "total"
                      ? "bg-violet-600 text-white border-violet-600"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-violet-400"
                  }`}
                >
                  Remboursement total
                </button>
                <button
                  type="button"
                  onClick={() => setRefundMode("partial")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition-all ${
                    refundMode === "partial"
                      ? "bg-violet-600 text-white border-violet-600"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-violet-400"
                  }`}
                >
                  Remboursement partiel
                </button>
              </div>

              {/* Articles (mode partiel) */}
              {refundMode === "partial" && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" /> Articles à rembourser
                  </p>
                  <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden">
                    {refundItems.map((ri) => (
                      <div key={ri.saleItemId} className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-foreground truncate">{ri.productName}</p>
                          <p className="text-[10px] text-zinc-400">Vendu : {ri.maxQty}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-zinc-400 font-bold">Qté :</span>
                          <input
                            type="number"
                            min={0}
                            max={ri.maxQty}
                            value={ri.quantity}
                            onChange={(e) => updateRefundItemQty(ri.saleItemId, Number(e.target.value))}
                            className="w-16 text-center px-2 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-black outline-none focus:border-violet-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Montant estimé */}
              <div className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-900/30 rounded-xl">
                <span className="text-xs font-black text-violet-700 dark:text-violet-400">Montant à rembourser</span>
                <span className="text-sm font-black text-violet-700 dark:text-violet-300">{fmt(refundTotal)} XOF</span>
              </div>

              {/* Méthode de remboursement */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Méthode de remboursement <span className="text-red-500">*</span>
                </label>
                <select
                  value={refundPaymentMethod}
                  onChange={(e) => { setRefundPaymentMethod(e.target.value); setRefundReference(""); }}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-violet-400 transition-all"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Référence transaction (conditionnel) */}
              {needsReference && (
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    Référence de transaction
                  </label>
                  <input
                    type="text"
                    value={refundReference}
                    onChange={(e) => setRefundReference(e.target.value)}
                    placeholder="Ex : OM-TXN-987654"
                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-violet-400 transition-all"
                  />
                </div>
              )}

              {/* Retour au stock */}
              <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                  returnToStock ? "bg-emerald-500 border-emerald-500" : "border-zinc-300 dark:border-zinc-600"
                }`}>
                  {returnToStock && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={returnToStock}
                  onChange={(e) => setReturnToStock(e.target.checked)}
                  className="sr-only"
                />
                <div>
                  <p className="text-xs font-black text-foreground">Remettre les articles en stock</p>
                  <p className="text-[10px] text-zinc-400">Décocher si le produit est défectueux ou ne peut pas être revendu</p>
                </div>
              </label>

              {/* Raison */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Raison du remboursement <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Ex : Client insatisfait, produit défectueux, erreur admin…"
                  rows={2}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-violet-400 transition-all resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setIsRefundOpen(false); setRefundSale(null); }}
                  disabled={isRefundSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-violet-600 hover:bg-violet-700 border-violet-600"
                  onClick={handleRefund}
                  loading={isRefundSubmitting}
                  disabled={refundReason.trim().length < 5 || refundTotal === 0}
                >
                  Confirmer le remboursement
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </AppLayout>
    );
  }

  // ---- Vue principale liste des boutiques ----
  return (
    <AppLayout
      title="Gestion des Boutiques"
      subtitle="Configurez vos points de vente et entrepôts"
      rightElement={
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setSelectedShop(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isMobile ? "Nouvelle" : "Nouvelle Boutique"}
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
            {error}
            <button onClick={refresh} className="ml-4 underline">
              Réessayer
            </button>
          </div>
        )}

        <Card className="p-4 md:p-6 pb-28 md:pb-12">
          <div className="relative mb-5">
            <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher une boutique..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          {loading ? (
            <div className="py-20 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
              Chargement des boutiques...
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="py-16 text-center">
              <Building2 className="h-10 w-10 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Aucune boutique trouvée
              </p>
            </div>
          ) : isMobile ? (
            <div className="flex flex-col gap-3">
              {filteredShops.map((s) => (
                <MobileShopCard
                  key={s.id}
                  s={s}
                  onEdit={() => {
                    setSelectedShop(s);
                    setIsModalOpen(true);
                  }}
                  onToggle={() => {
                    setSelectedShop(s);
                    setIsConfirmOpen(true);
                  }}
                  onDelete={() => {
                    setSelectedShop(s);
                    setIsDeleteConfirmOpen(true);
                  }}
                  onViewSales={() => setSalesViewShop(s)}
                  onCaisse={() => router.push(`/admin/caisse?shopId=${s.id}`)}
                />
              ))}
            </div>
          ) : (
            <DataTable columns={columns} data={filteredShops} />
          )}
        </Card>
      </div>

      {/* ---- MODAL Ajout / Modification ---- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedShop ? "Modifier Boutique" : "Nouvelle Boutique"}
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">
                Nom de la boutique
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Superette Plateau"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">
                Type de boutique
              </label>
              <select
                value={formData.shopType ?? ShopType.SUPERMARKET}
                onChange={(e) => {
                  const st = e.target.value as ShopType;
                  setFormData({
                    ...formData,
                    shopType: st,
                    shopTypeLabel: SHOP_TYPE_LABELS[st] ?? st,
                  });
                }}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                {Object.entries(SHOP_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">
                Libellé personnalisé{" "}
                <span className="normal-case font-medium text-zinc-400">(Optionnel)</span>
              </label>
              <input
                type="text"
                value={formData.shopTypeLabel ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, shopTypeLabel: e.target.value })
                }
                placeholder={SHOP_TYPE_LABELS[formData.shopType ?? ShopType.SUPERMARKET]}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">
              Adresse / Localisation
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Ex: Avenue 10, Plateau, Abidjan"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">
                Téléphone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Ex: +225 0701020304"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">
                Email{" "}
                <span className="normal-case font-medium text-zinc-400">
                  (Optionnel)
                </span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Ex: plateau@spservices.com"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">
                Devise
              </label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                <option value="XOF">FCFA (XOF)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar ($)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5 justify-center sm:pt-5">
              <label className="text-xs font-black text-zinc-500 uppercase sm:opacity-0 select-none">
                Statut
              </label>
              <label
                htmlFor="isActive"
                className="flex items-center gap-3 cursor-pointer p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-primary transition-all"
              >
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
                />
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Activer immédiatement
                </span>
              </label>
            </div>
          </div>

          <Button
            variant="primary"
            className="mt-2"
            onClick={handleSubmit}
            disabled={!formData.name || !formData.address || !formData.phone}
          >
            {selectedShop ? "Mettre à jour" : "Créer la boutique"}
          </Button>
        </div>
      </Modal>

      {/* ---- MODAL Activer / Désactiver ---- */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => {
          if (selectedShop) {
            await toggleStatus(selectedShop.id, selectedShop.isActive);
            setIsConfirmOpen(false);
          }
        }}
        title={
          selectedShop?.isActive
            ? "Désactiver la boutique"
            : "Activer la boutique"
        }
        message={`Voulez-vous vraiment ${selectedShop?.isActive ? "désactiver" : "activer"} la boutique "${selectedShop?.name}" ?`}
        confirmLabel={selectedShop?.isActive ? "Désactiver" : "Activer"}
        variant={selectedShop?.isActive ? "danger" : "primary"}
      />

      {/* ---- MODAL Suppression ---- */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          if (selectedShop) {
            await deleteShop(selectedShop.id);
            setIsDeleteConfirmOpen(false);
          }
        }}
        title="Supprimer la boutique"
        message={`Attention : toutes les données associées seront inaccessibles. Voulez-vous vraiment supprimer définitivement "${selectedShop?.name}" ?`}
        confirmLabel="Supprimer définitivement"
        variant="danger"
      />
    </AppLayout>
  );
}
