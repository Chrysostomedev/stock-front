import React from "react";

interface TicketReceiptProps {
  shop: any;
  user: any;
  items: any[];
  total: number;
  paymentMethod: string;
  amountReceived?: number;
  change?: number;
  saleId?: string;
}

/**
 * Composant TicketReceipt
 * Designé pour l'impression sur imprimantes thermiques (POS)
 */
export const TicketReceipt = React.forwardRef<HTMLDivElement, TicketReceiptProps>(
  ({ shop, user, items, total, paymentMethod, amountReceived, change, saleId }, ref) => {
    const today = new Date().toLocaleString("fr-FR");

    return (
      <div ref={ref} className="p-8 bg-white text-black font-mono text-[12px] w-[80mm] mx-auto">
        {/* Header Boutique */}
        <div className="text-center flex flex-col gap-1 mb-6">
          <h1 className="text-lg font-black uppercase tracking-tighter">{shop?.name || "SP SERVICES"}</h1>
          <p className="text-[10px] font-bold">{shop?.address || "Côte d'Ivoire"}</p>
          <p className="text-[10px]">Tél: {shop?.phone || "+225 -- -- -- --"}</p>
          <div className="border-b border-dashed border-black my-2" />
        </div>

        {/* Info Vente */}
        <div className="flex flex-col gap-1 mb-4 text-[10px]">
          <div className="flex justify-between">
            <span>Ticket:</span>
            <span className="font-bold">{saleId || "PROVISOIRE"}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{today}</span>
          </div>
          <div className="flex justify-between">
            <span>Caissier:</span>
            <span className="uppercase">{user?.name || "ANONYME"}</span>
          </div>
          <div className="border-b border-dashed border-black my-2" />
        </div>

        {/* Articles */}
        <table className="w-full mb-4 text-[10px]">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-1">ART.</th>
              <th className="text-center py-1">QTÉ</th>
              <th className="text-right py-1">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-zinc-100">
                <td className="py-2 pr-2">
                  <div className="flex flex-col">
                    <span className="font-bold uppercase leading-tight">{item.product.name}</span>
                    <span className="text-[8px] opacity-70">@ {item.product.sellingPrice}</span>
                  </div>
                </td>
                <td className="text-center py-2">{item.quantity}</td>
                <td className="text-right py-2 font-bold">
                  {(item.product.sellingPrice * item.quantity).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="flex flex-col gap-1.5 border-t border-black pt-4">
          <div className="flex justify-between text-sm font-black">
            <span>TOTAL À PAYER:</span>
            <span>{total.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between text-[10px] opacity-80 mt-1">
            <span>MODE DE PAIEMENT:</span>
            <span className="font-bold">{paymentMethod}</span>
          </div>
          {paymentMethod === "CASH" && (
            <>
              <div className="flex justify-between text-[10px]">
                <span>MONTANT REÇU:</span>
                <span>{amountReceived?.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold">
                <span>MONNAIE RENDUE:</span>
                <span>{change?.toLocaleString()} FCFA</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-4 border-t border-dashed border-black flex flex-col gap-2">
          <p className="text-[9px] font-bold italic uppercase tracking-widest">Merci de votre visite !</p>
          <p className="text-[8px]">Les marchandises vendues ne sont ni reprises ni échangées.</p>
          <div className="mt-2 text-[10px] font-black">
             *** SP SERVICES STOCK ***
          </div>
        </div>
      </div>
    );
  }
);

TicketReceipt.displayName = "TicketReceipt";
