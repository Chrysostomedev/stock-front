const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

export interface PrintReceiptData {
  shop: { name?: string; address?: string; phone?: string } | null;
  user: { name?: string } | null;
  items: { product: { name: string; sellingPrice: number }; quantity: number }[];
  subtotal: number;
  discountAmount: number;
  total: number;
  paymentMethod: "CASH" | "MOBILE_MONEY" | string;
  mobileProvider?: string;
  amountReceived: number;
  change: number;
  saleId: string;
  customerName?: string;
}

export function printReceipt(data: PrintReceiptData): void {
  const {
    shop, user, items, subtotal, discountAmount, total,
    paymentMethod, mobileProvider, amountReceived, change,
    saleId, customerName,
  } = data;

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const payLabel =
    paymentMethod === "CASH" ? "ESPÈCES" :
    paymentMethod === "MOBILE_MONEY" ? `MOBILE MONEY${mobileProvider ? ` (${mobileProvider})` : ""}` :
    paymentMethod;

  const itemsHtml = items.map(item => {
    const lineTotal = item.product.sellingPrice * item.quantity;
    return `
      <div class="item">
        <div class="item-row">
          <span class="item-name">${item.product.name.toUpperCase()}</span>
          <span class="item-qty">${item.quantity}</span>
          <span class="item-total">${fmt(lineTotal)}</span>
        </div>
        <div class="item-price">@ ${fmt(item.product.sellingPrice)} FCFA</div>
      </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Ticket</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: 80mm auto; margin: 2mm; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    width: 76mm;
    margin: 0 auto;
    padding: 3mm 2mm;
    color: #000;
    background: #fff;
    line-height: 1.45;
  }
  .center { text-align: center; }
  .shop-name { font-size: 17px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
  .shop-sub { font-size: 9px; margin-top: 2px; }
  .sep-dashed { border-top: 1px dashed #000; margin: 5px 0; }
  .sep-double { border-top: 2px solid #000; margin: 6px 0; }
  .info-row { display: flex; justify-content: space-between; margin: 1px 0; font-size: 10px; }
  .info-label { color: #444; }
  .info-val { font-weight: bold; text-align: right; max-width: 55%; word-break: break-all; }
  .col-header {
    display: flex; font-size: 9px; font-weight: bold;
    text-transform: uppercase; padding: 3px 0;
    border-top: 1px solid #000; border-bottom: 1px solid #000;
    margin: 2px 0;
  }
  .col-art { flex: 1; }
  .col-qty { width: 28px; text-align: center; }
  .col-tot { width: 58px; text-align: right; }
  .item { margin: 3px 0; }
  .item-row { display: flex; align-items: flex-start; }
  .item-name { flex: 1; font-weight: bold; font-size: 10px; text-transform: uppercase; word-break: break-word; padding-right: 4px; }
  .item-qty { width: 28px; text-align: center; font-size: 10px; }
  .item-total { width: 58px; text-align: right; font-weight: bold; font-size: 10px; }
  .item-price { font-size: 8px; color: #666; padding-left: 4px; }
  .tot-row { display: flex; justify-content: space-between; font-size: 10px; padding: 1px 0; }
  .tot-val { font-weight: bold; }
  .discount-val { color: #c00; font-weight: bold; }
  .grand-total {
    display: flex; justify-content: space-between;
    font-size: 16px; font-weight: 900;
    padding: 5px 2px;
    border-top: 2px solid #000; border-bottom: 2px solid #000;
    margin: 5px 0;
  }
  .pay-block { margin: 4px 0; }
  .pay-row { display: flex; justify-content: space-between; font-size: 10px; padding: 2px 0; }
  .pay-badge {
    font-weight: bold; text-transform: uppercase;
    background: #000; color: #fff;
    padding: 1px 5px; font-size: 9px; display: inline-block;
  }
  .change-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; padding: 3px 0; }
  .footer { font-size: 9px; text-align: center; color: #333; }
  .brand { font-size: 11px; font-weight: 900; letter-spacing: 2px; margin-top: 4px; }
  @media print {
    body { width: 80mm; padding: 0; }
  }
</style>
</head>
<body>
  <div class="center" style="padding-bottom:6px;">
    <div class="shop-name">${shop?.name || "SP SERVICES"}</div>
    <div class="shop-sub">${shop?.address || "Côte d'Ivoire"}</div>
    <div class="shop-sub">Tél: ${shop?.phone || "+225 -- -- -- --"}</div>
  </div>

  <div class="sep-double"></div>

  <div class="info-row"><span class="info-label">Date :</span><span class="info-val">${dateStr} ${timeStr}</span></div>
  <div class="info-row"><span class="info-label">Caissier :</span><span class="info-val">${(user?.name || "ANONYME").toUpperCase()}</span></div>
  ${customerName ? `<div class="info-row"><span class="info-label">Client :</span><span class="info-val">${customerName.toUpperCase()}</span></div>` : ""}
  <div class="info-row"><span class="info-label">Ticket N° :</span><span class="info-val" style="font-size:8px;">${saleId || "PROVISOIRE"}</span></div>

  <div class="sep-dashed"></div>

  <div class="col-header">
    <span class="col-art">DÉSIGNATION</span>
    <span class="col-qty">QTÉ</span>
    <span class="col-tot">TOTAL</span>
  </div>

  ${itemsHtml}

  <div class="sep-dashed"></div>

  <div class="tot-row"><span>Sous-total</span><span class="tot-val">${fmt(subtotal)} FCFA</span></div>
  ${discountAmount > 0 ? `<div class="tot-row"><span>Remise</span><span class="discount-val">- ${fmt(discountAmount)} FCFA</span></div>` : ""}

  <div class="grand-total">
    <span>TOTAL</span>
    <span>${fmt(total)} FCFA</span>
  </div>

  <div class="pay-block">
    <div class="pay-row">
      <span>Mode de paiement</span>
      <span class="pay-badge">${payLabel}</span>
    </div>
    ${paymentMethod === "CASH" ? `
    <div class="pay-row"><span>Montant reçu</span><span class="tot-val">${fmt(amountReceived)} FCFA</span></div>
    <div class="change-row"><span>Monnaie rendue</span><span>${fmt(change)} FCFA</span></div>
    ` : ""}
  </div>

  <div class="sep-double"></div>

  <div class="footer" style="padding:4px 0 6px;">
    <div style="font-weight:bold;margin-bottom:2px;">Merci de votre visite !</div>
    <div>Les marchandises vendues ne sont</div>
    <div>ni reprises ni échangées.</div>
    <div class="sep-dashed" style="margin:5px 0;"></div>
    <div class="brand">&#9733; ${(shop?.name || "SP SERVICES").toUpperCase()} &#9733;</div>
  </div>
</body>
</html>`;

  const win = window.open("", "receipt_print", "width=340,height=720,scrollbars=no,toolbar=no,menubar=no,status=no");
  if (!win) {
    alert("Veuillez autoriser les popups pour imprimer le ticket de caisse.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    setTimeout(() => {
      win.print();
      win.onafterprint = () => { try { win.close(); } catch {} };
      setTimeout(() => { try { win.close(); } catch {} }, 3000);
    }, 150);
  };
  // Fallback si onload ne se déclenche pas (certains navigateurs)
  setTimeout(() => {
    try {
      if (!win.closed) {
        win.print();
        win.onafterprint = () => { try { win.close(); } catch {} };
      }
    } catch {}
  }, 900);
}
