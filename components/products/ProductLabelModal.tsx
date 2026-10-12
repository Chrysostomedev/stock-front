"use client";

import React, { useState, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Product } from "@/services/product.service";
import {
  generateBarcodeSvgString,
  generateQrCodeSvgString,
} from "@/lib/barcodeUtils";
import { Printer, QrCode, Barcode, Copy, Check, Sparkles } from "lucide-react";

interface ProductLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Partial<Product> | null;
  shopName?: string;
}

export default function ProductLabelModal({
  isOpen,
  onClose,
  product,
  shopName,
}: ProductLabelModalProps) {
  const [symbology, setSymbology] = useState<"CODE128" | "QR">("CODE128");
  const [copies, setCopies] = useState<number>(1);
  const [labelSize, setLabelSize] = useState<"50x30" | "60x40" | "80mm">("50x30");
  const [copied, setCopied] = useState(false);

  const barcodeValue = product?.barcode || "";
  const productName = product?.name || "Article sans nom";
  const price = product?.sellingPrice ?? 0;
  const sku = product?.sku || "";

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(n);

  // SVG généré
  const svgContent = useMemo(() => {
    if (!barcodeValue) return "";
    if (symbology === "QR") {
      return generateQrCodeSvgString(barcodeValue, { size: 120, quietZone: 3 });
    }
    return generateBarcodeSvgString(barcodeValue, {
      height: 52,
      moduleWidth: 2,
      showText: true,
      fontSize: 11,
    });
  }, [barcodeValue, symbology]);

  // Copier le code
  const handleCopyCode = () => {
    if (!barcodeValue) return;
    navigator.clipboard.writeText(barcodeValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Impression optimisée pour imprimante thermique / standard
  const handlePrint = () => {
    if (!barcodeValue) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.border = "none";
    iframe.style.opacity = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const isQr = symbology === "QR";
    const labelSvg = isQr
      ? generateQrCodeSvgString(barcodeValue, { size: 90, quietZone: 2 })
      : generateBarcodeSvgString(barcodeValue, {
          height: 38,
          moduleWidth: 1.5,
          showText: true,
          fontSize: 9,
        });

    // Générer N étiquettes
    let labelsHtml = "";
    for (let i = 0; i < copies; i++) {
      labelsHtml += `
        <div class="label-item">
          ${shopName ? `<div class="shop-name">${shopName}</div>` : ""}
          <div class="product-name">${productName}</div>
          <div class="barcode-container">${labelSvg}</div>
          <div class="footer-row">
            <span class="price">${fmtCurrency(price)}</span>
            ${sku ? `<span class="sku">${sku}</span>` : ""}
          </div>
        </div>
      `;
    }

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Étiquette - ${productName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page {
      size: ${labelSize === "50x30" ? "50mm 30mm" : labelSize === "60x40" ? "60mm 40mm" : "80mm auto"};
      margin: 1mm;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #fff;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .labels-grid {
      display: flex;
      flex-direction: column;
      gap: 2mm;
    }
    .label-item {
      width: ${labelSize === "50x30" ? "48mm" : labelSize === "60x40" ? "58mm" : "76mm"};
      min-height: ${labelSize === "50x30" ? "28mm" : labelSize === "60x40" ? "38mm" : "auto"};
      padding: 1.5mm;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      page-break-after: always;
      overflow: hidden;
    }
    .shop-name {
      font-size: 7px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #333;
      margin-bottom: 1px;
    }
    .product-name {
      font-size: 9px;
      font-weight: 900;
      line-height: 1.1;
      max-height: 20px;
      overflow: hidden;
      margin-bottom: 2px;
      color: #000;
    }
    .barcode-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 1px 0;
    }
    .barcode-container svg {
      max-width: 100%;
      height: auto;
    }
    .footer-row {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 0 1mm;
      margin-top: 1px;
    }
    .price {
      font-size: 11px;
      font-weight: 900;
      color: #000;
    }
    .sku {
      font-size: 7px;
      font-weight: 700;
      color: #444;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="labels-grid">
    ${labelsHtml}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
        setTimeout(function() {
          window.parent.document.body.removeChild(window.frameElement);
        }, 500);
      }, 100);
    };
  </script>
</body>
</html>`;

    doc.open();
    doc.write(html);
    doc.close();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Impression d'Étiquette Code-Barres"
      size="md"
    >
      <div className="flex flex-col gap-5 p-1 sm:p-2">
        {/* En-tête / Choix du type de code */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSymbology("CODE128")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                symbology === "CODE128"
                  ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Barcode className="h-4 w-4" />
              <span>Code 128 (1D)</span>
            </button>
            <button
              type="button"
              onClick={() => setSymbology("QR")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                symbology === "QR"
                  ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <QrCode className="h-4 w-4" />
              <span>QR Code (2D)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors"
            title="Copier la valeur du code"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-500">Copié</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copier code</span>
              </>
            )}
          </button>
        </div>

        {/* Prévisualisation Réelle de l'Étiquette (Aspect Autocollant Thermique) */}
        <div className="flex flex-col items-center justify-center p-6 bg-zinc-100 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
          <div className="w-full max-w-[280px] bg-white text-zinc-950 p-4 rounded-xl shadow-lg border border-zinc-200 flex flex-col items-center justify-between gap-2.5 transition-transform hover:scale-[1.01]">
            {/* Nom boutique */}
            {shopName && (
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 truncate max-w-full">
                {shopName}
              </span>
            )}

            {/* Nom Produit */}
            <h4 className="text-sm font-black text-center text-zinc-900 leading-tight line-clamp-2">
              {productName}
            </h4>

            {/* Barcode / QR Code SVG */}
            <div
              className="my-1 flex items-center justify-center max-w-full overflow-hidden"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />

            {/* Ligne inférieure : Prix & SKU */}
            <div className="w-full flex items-baseline justify-between pt-1 border-t border-zinc-150">
              <span className="text-base font-black text-zinc-950 tracking-tight">
                {fmtCurrency(price)}
              </span>
              {sku && (
                <span className="text-[10px] font-mono font-bold text-zinc-500">
                  {sku}
                </span>
              )}
            </div>
          </div>

          <span className="text-[11px] font-bold text-muted-foreground mt-3 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Format prêt pour rouleau thermique autocollant
          </span>
        </div>

        {/* Réglages d'impression */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              Format d&apos;étiquette
            </label>
            <select
              value={labelSize}
              onChange={(e) => setLabelSize(e.target.value as any)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-primary"
            >
              <option value="50x30">Standard 50mm × 30mm</option>
              <option value="60x40">Grand 60mm × 40mm</option>
              <option value="80mm">Rouleau continu 80mm</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              Nombre d&apos;exemplaires
            </label>
            <div className="flex items-center gap-1">
              {[1, 5, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCopies(n)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    copies === n
                      ? "bg-primary text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-foreground hover:bg-zinc-200"
                  }`}
                >
                  {n}
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="100"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-2 py-1.5 text-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="font-black px-4 shadow-md shadow-primary/20"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            <span>Imprimer {copies > 1 ? `(${copies} étiquettes)` : "l'étiquette"}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
