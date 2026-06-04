"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import SaleService from "@/services/sale.service";
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
  ShoppingBag,
  ShoppingCart,
  Clock,
  User,
  Wrench,
} from "lucide-react";
import { useShops } from "@/hooks/admin/useShops";
import { Shop } from "@/types/admin";
import { ShopType } from "@/services/shop.service";
import Pagination from "@/components/ui/Pagination";
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

  const SALES_LIMIT = 20;

  // Detailed Sales View States
  const [salesViewShop, setSalesViewShop] = useState<Shop | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesPage, setSalesPage] = useState(1);
  const [salesTotalPages, setSalesTotalPages] = useState(1);
  const [salesTotal, setSalesTotal] = useState(0);
  const [expandedDays, setExpandedDays] = useState<{ [key: string]: boolean }>(
    {},
  );
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<any>(null);

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
      groups[dateStr].totalAmount += Number(s.totalAmount || s.total || 0);
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
          {/* Stats rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-150 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
              <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Chiffre d&apos;Affaires Cumulé
                </p>
                <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                  {new Intl.NumberFormat("fr-FR").format(totalShopsCA)} FCFA
                </h4>
              </div>
            </div>
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-150 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
              <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Total Ventes
                </p>
                <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                  {salesTotal} transactions
                </h4>
              </div>
            </div>
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-150 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
              <div className="p-4 bg-amber-500/10 text-amber-600 rounded-2xl">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Panier Moyen
                </p>
                <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                  {sales.length > 0
                    ? new Intl.NumberFormat("fr-FR").format(
                        Math.round(totalShopsCA / sales.length),
                      )
                    : 0}{" "}
                  FCFA
                </h4>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-foreground tracking-tight flex items-center gap-2">
                <Calendar className="h-5 w-5 text-zinc-400" />
                Journal des Ventes par Journée
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
                      <div className="flex items-center gap-4 text-xs font-bold">
                        <span className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 rounded-full text-[10px] uppercase font-black tracking-wider text-zinc-500">
                          {group.sales.length}{" "}
                          {group.sales.length > 1 ? "Ventes" : "Vente"}
                        </span>
                        <span className="text-primary font-black text-sm">
                          {new Intl.NumberFormat("fr-FR").format(
                            group.totalAmount,
                          )}{" "}
                          FCFA
                        </span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="p-4 overflow-x-auto">
                        <table className="w-full text-left text-xs font-bold border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider">
                              <th className="py-2.5 px-3">Ticket</th>
                              <th className="py-2.5 px-3">Heure</th>
                              <th className="py-2.5 px-3">Client</th>
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
                              return (
                                <tr
                                  key={sale.id}
                                  className="border-b border-zinc-100/70 dark:border-zinc-800/40 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/20"
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
                                  <td className="py-3 px-3 text-right font-black text-primary">
                                    {new Intl.NumberFormat("fr-FR").format(
                                      sale.totalAmount || sale.total || 0,
                                    )}{" "}
                                    XOF
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="py-1 px-2.5 text-[10px] font-black uppercase tracking-wider"
                                      onClick={() =>
                                        setSelectedSaleDetail(sale)
                                      }
                                    >
                                      Détails Panier
                                    </Button>
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

              <div className="flex justify-end mt-2">
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
