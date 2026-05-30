"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import { useShopSettings } from "@/contexts/ShopSettingsContext";
import ShopSettingService from "@/services/shop-setting.service";
import { Palette, Receipt, Percent, Save, RefreshCw } from "lucide-react";

const PRESET_COLORS = [
  { name: "Bleu Royal", value: "#003b95" },
  { name: "Rouge SPServices", value: "#ef3340" },
  { name: "Vert Émeraude", value: "#10b981" },
  { name: "Orange Intense", value: "#f97316" },
  { name: "Violet Impérial", value: "#8b5cf6" },
  { name: "Rose Chic", value: "#ec4899" },
  { name: "Noir Profond", value: "#18181b" },
];

export default function QuincSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { getSettingValue, refreshSettings, updateSettingLocal } = useShopSettings();

  const [themeColor, setThemeColor] = useState("");
  const [receiptHeader, setReceiptHeader] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.shopId) {
      setThemeColor(getSettingValue("theme_color", "#003b95"));
      setReceiptHeader(getSettingValue("receipt_header", "SP SERVICES\nVotre partenaire de confiance"));
      setReceiptFooter(getSettingValue("receipt_footer", "Merci de votre visite !\nLes marchandises vendues ne sont ni reprises ni échangées."));
      setTaxRate(getSettingValue("tax_rate", "0"));
    }
  }, [user, getSettingValue]);

  const handleSave = async () => {
    if (!user?.shopId) return;
    setIsSaving(true);
    try {
      await Promise.all([
        ShopSettingService.upsert({
          shopId: user.shopId,
          key: "theme_color",
          value: themeColor,
          group: "display",
        }),
        ShopSettingService.upsert({
          shopId: user.shopId,
          key: "receipt_header",
          value: receiptHeader,
          group: "receipt",
        }),
        ShopSettingService.upsert({
          shopId: user.shopId,
          key: "receipt_footer",
          value: receiptFooter,
          group: "receipt",
        }),
        ShopSettingService.upsert({
          shopId: user.shopId,
          key: "tax_rate",
          value: taxRate,
          group: "tax",
        }),
      ]);

      // Update context local state
      updateSettingLocal("theme_color", themeColor);
      updateSettingLocal("receipt_header", receiptHeader);
      updateSettingLocal("receipt_footer", receiptFooter);
      updateSettingLocal("tax_rate", taxRate);

      showToast("Paramètres enregistrés et appliqués !", "success");
      await refreshSettings();
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de la sauvegarde des paramètres", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout
      title="Paramètres de la Boutique"
      subtitle="Personnalisez le thème visuel et les configurations des devis/tickets de caisse de votre Quincaillerie"
      rightElement={
        <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Enregistrer les modifications
        </Button>
      }
    >
      <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
        {/* Color / Theme Settings */}
        <Card className="p-6 flex flex-col gap-5 border border-zinc-150 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Palette className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">Personnalisation du Thème (Couleurs)</h3>
              <p className="text-xs text-zinc-400">Configurez la couleur d'accentuation principale pour toute l'application</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-xs font-black text-zinc-500 uppercase">Couleur Prédéfinie</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {PRESET_COLORS.map((preset) => {
                const isSelected = themeColor.toLowerCase() === preset.value.toLowerCase();
                return (
                  <button
                    key={preset.value}
                    onClick={() => setThemeColor(preset.value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all hover:scale-[1.03] active:scale-95 ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <span
                      className="h-6 w-6 rounded-full shadow-inner border border-black/10"
                      style={{ backgroundColor: preset.value }}
                    />
                    <span className="text-[10px] tracking-tight">{preset.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-1.5 max-w-xs mt-2">
              <label className="text-xs font-black text-zinc-500 uppercase">Couleur personnalisée (Hex)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColor || "#003b95"}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="h-10 w-10 rounded-xl cursor-pointer border-none bg-transparent"
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  placeholder="#003b95"
                  className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Receipt settings */}
        <Card className="p-6 flex flex-col gap-5 border border-zinc-150 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Receipt className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">Configuration des Documents (Factures & Bons)</h3>
              <p className="text-xs text-zinc-400">Définissez les en-têtes et pieds de page imprimés sur vos devis et factures</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">En-tête des documents</label>
              <textarea
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                placeholder="Ex: SP SERVICES - Division Quincaillerie&#10;Votre partenaire matériaux"
                rows={3}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Pied de page des documents</label>
              <textarea
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Ex: Merci de votre fidélité !&#10;Conditions de retour de matériaux..."
                rows={3}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary font-mono"
              />
            </div>
          </div>
        </Card>

        {/* Financial / Tax rates settings */}
        <Card className="p-6 flex flex-col gap-5 border border-zinc-150 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Percent className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">Paramètres de Facturation & Taxes</h3>
              <p className="text-xs text-zinc-400">Configurez le taux de taxe par défaut applicable pour les ventes</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 max-w-xs">
              <label className="text-xs font-black text-zinc-500 uppercase">Taux de taxe de la boutique (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end mt-2">
          <Button variant="primary" size="md" onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto px-8">
            {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Enregistrer les modifications
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
