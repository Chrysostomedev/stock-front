"use client";

import React, { useState, useEffect, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ProductService, { Product } from "@/services/product.service";
import { useToast } from "@/contexts/ToastContext";
import {
  AlertTriangle,
  Link2,
  Search,
  X,
  Package,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  Barcode,
} from "lucide-react";

interface UnknownBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  scannedBarcode: string;
  shopId: string;
  onAssociateAndAddToCart: (product: Product, newBarcode: string) => Promise<void> | void;
  onManualSearch?: () => void;
}

export default function UnknownBarcodeModal({
  isOpen,
  onClose,
  scannedBarcode,
  shopId,
  onAssociateAndAddToCart,
  onManualSearch,
}: UnknownBarcodeModalProps) {
  const { showToast } = useToast();
  const [view, setView] = useState<"choice" | "search">("choice");
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [associatingId, setAssociatingId] = useState<string | null>(null);

  // Réinitialiser la vue quand la modale s'ouvre
  useEffect(() => {
    if (isOpen) {
      setView("choice");
      setSearchTerm("");
      setProducts([]);
      setAssociatingId(null);
    }
  }, [isOpen]);

  // Recherche des produits dans la boutique
  const handleSearch = useCallback(
    async (term: string) => {
      if (!shopId) return;
      setLoading(true);
      try {
        const res = await ProductService.getAll({
          shopId,
          search: term.trim() || undefined,
          isActive: true,
          limit: 30,
        });
        const list: Product[] = Array.isArray(res) ? res : res.data || [];
        setProducts(list.filter((p) => p.isActive !== false));
      } catch {
        showToast("Erreur lors de la recherche des produits", "error");
      } finally {
        setLoading(false);
      }
    },
    [shopId, showToast]
  );

  // Charger les premiers produits lors du passage en mode association
  useEffect(() => {
    if (view === "search" && isOpen) {
      handleSearch(searchTerm);
    }
  }, [view, isOpen, handleSearch, searchTerm]);

  // Associer et ajouter au panier
  const handleSelectProduct = async (product: Product) => {
    if (!scannedBarcode || !product.id) return;
    setAssociatingId(product.id);
    try {
      // 1. Sauvegarder le nouveau code-barres sur le produit
      const updatedProduct = await ProductService.update(product.id, {
        barcode: scannedBarcode,
      });

      const finalProduct: Product = {
        ...product,
        ...updatedProduct,
        barcode: scannedBarcode,
      };

      // 2. Notifier et ajouter au panier
      await onAssociateAndAddToCart(finalProduct, scannedBarcode);

      showToast(
        `Code ${scannedBarcode} associé à "${product.name}" et ajouté au panier !`,
        "success"
      );

      // Déclencher un événement global pour que le catalogue se mette à jour
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("catalog-updated"));
      }

      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Impossible d'associer le code-barres à ce produit";
      showToast(msg, "error");
    } finally {
      setAssociatingId(null);
    }
  };

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        view === "choice"
          ? "Code-barres non reconnu"
          : "Associer le code à un article"
      }
      size="md"
    >
      <div className="flex flex-col gap-4 p-1 sm:p-2">
        {view === "choice" ? (
          /* ── ÉCRAN 1 : CHOIX DES ACTIONS RAPIDES ── */
          <div className="flex flex-col gap-4">
            {/* Bannière Alerte Code Inconnu */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  Code scanné introuvable
                </h4>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-amber-700 dark:text-amber-300 bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700/60">
                    {scannedBarcode}
                  </span>
                </div>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-2 font-medium">
                  Ce code ne correspond à aucun produit de votre boutique. Que
                  souhaitez-vous faire ?
                </p>
              </div>
            </div>

            {/* Les 3 Options Métier */}
            <div className="flex flex-col gap-2.5 pt-1">
              {/* Option 1 : Associer */}
              <button
                type="button"
                onClick={() => setView("search")}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-primary text-white hover:bg-primary/95 transition-all shadow-md shadow-primary/20 text-left cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Link2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-black block">
                      1. Associer ce code à un produit existant
                    </span>
                    <span className="text-[11px] text-white/80 block mt-0.5">
                      Rechercher l&apos;article, enregistrer son code et l&apos;ajouter au panier en 1 clic
                    </span>
                  </div>
                </div>
              </button>

              {/* Option 2 : Recherche manuelle */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onManualSearch?.();
                }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-foreground block">
                      2. Recherche manuelle
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Fermer cette fenêtre et chercher par nom dans le catalogue
                    </span>
                  </div>
                </div>
              </button>

              {/* Option 3 : Annuler */}
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 shrink-0">
                    <X className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">
                    3. Annuler / Réessayer le scan
                  </span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* ── ÉCRAN 2 : RECHERCHE RAPIDE & ASSOCIATION IMMÉDIATE ── */
          <div className="flex flex-col gap-3">
            {/* Barre de retour et rappel du code */}
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setView("choice")}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour aux options</span>
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                <Barcode className="h-3.5 w-3.5" />
                <span>{scannedBarcode}</span>
              </div>
            </div>

            {/* Input de recherche immédiate */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder="Taper le nom ou SKU du produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Liste des résultats */}
            <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {loading ? (
                <div className="py-8 text-center text-xs font-bold text-muted-foreground flex flex-col items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                  <span>Recherche des produits...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="py-8 text-center text-xs font-bold text-muted-foreground">
                  Aucun produit trouvé pour &quot;{searchTerm}&quot;
                </div>
              ) : (
                products.map((p) => {
                  const isAssociating = associatingId === p.id;
                  return (
                    <div
                      key={p.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-primary shrink-0">
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-black text-foreground truncate">
                            {p.name}
                          </h5>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            <span className="font-black text-foreground">
                              {fmtCurrency(p.sellingPrice)}
                            </span>
                            <span>•</span>
                            <span
                              className={
                                p.stockQty <= 0
                                  ? "text-rose-500 font-bold"
                                  : "text-zinc-400"
                              }
                            >
                              Stock : {p.stockQty}
                            </span>
                            {p.barcode && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-zinc-400 truncate max-w-[90px]">
                                  Actuel : {p.barcode}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSelectProduct(p)}
                        disabled={isAssociating}
                        className="rounded-xl h-8 px-3 text-xs font-black shrink-0 whitespace-nowrap shadow-sm"
                      >
                        {isAssociating ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        )}
                        <span>Associer & Vendre</span>
                      </Button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
