"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import QuincProductService from "@/services/quinc/product.service";
import { Product } from "@/types/quinc";
import {
  FileText,
  Search,
  Plus,
  Calendar,
  User,
  Printer,
  Trash2,
  Package,
  ArrowRight,
  TrendingUp
} from "lucide-react";

interface DocumentItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Document {
  id: string;
  type: "Client" | "Fournisseur";
  customer: string;
  date: string;
  amount: number;
  status: "Brouillon" | "Envoyé" | "Payé" | "Expiré";
  delay: number;
  items: DocumentItem[];
}

// const initialDocs: Document[] = [
//   { 
//     id: "BC-2026-001", 
//     type: "Client", 
//     customer: "Entreprise BTP SARL", 
//     date: "2026-05-10", 
//     amount: 450000, 
//     status: "Envoyé", 
//     delay: 30,
//     items: [{ productId: "p1", name: "Ciment CPJ45", quantity: 90, price: 5000 }]
//   },
//   { 
//     id: "BC-2026-002", 
//     type: "Fournisseur", 
//     customer: "SOTACI CI", 
//     date: "2026-05-08", 
//     amount: 85000, 
//     status: "Payé", 
//     delay: 15,
//     items: [{ productId: "p2", name: "Fer à béton 8mm", quantity: 17, price: 5000 }]
//   },
//   { 
//     id: "BC-2026-003", 
//     type: "Client", 
//     customer: "Chantier Riviera", 
//     date: "2026-05-07", 
//     amount: 1250000, 
//     status: "Brouillon", 
//     delay: 45,
//     items: [{ productId: "p3", name: "Briques creuses", quantity: 2500, price: 500 }]
//   },
// ];

export default function QuincDevisPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [docs, setDocs] = useState<Document[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Creation States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"Client" | "Fournisseur">("Client");

  // Form States
  const [partnerName, setPartnerName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [delay, setDelay] = useState(30);
  const [selectedItems, setSelectedItems] = useState<DocumentItem[]>([]);

  // Item form states
  const [tempProductId, setTempProductId] = useState("");
  const [tempQty, setTempQty] = useState(1);
  const [tempPrice, setTempPrice] = useState(0);

  // View Details States
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<Document | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      if (!user?.shopId) return;
      try {
        setLoading(true);
        const prods = await QuincProductService.getAll(user.shopId);
        setProducts(prods);
      } catch (error) {
        showToast("Erreur lors du chargement des produits", "error");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [user]);

  // Handle selected product change to prefill price
  useEffect(() => {
    if (!tempProductId) {
      setTempPrice(0);
      return;
    }
    const prod = products.find(p => p.id === tempProductId);
    if (prod) {
      setTempPrice(modalType === "Client" ? prod.sellingPrice : prod.buyingPrice || 0);
    }
  }, [tempProductId, modalType, products]);

  const handleAddItem = () => {
    if (!tempProductId || tempQty <= 0 || tempPrice < 0) {
      showToast("Veuillez saisir un article valide", "error");
      return;
    }
    const prod = products.find(p => p.id === tempProductId);
    if (!prod) return;

    // Check if product is already added
    const existingIdx = selectedItems.findIndex(i => i.productId === tempProductId);
    if (existingIdx > -1) {
      const updated = [...selectedItems];
      updated[existingIdx].quantity += tempQty;
      setSelectedItems(updated);
    } else {
      setSelectedItems([...selectedItems, {
        productId: tempProductId,
        name: prod.name,
        quantity: tempQty,
        price: tempPrice
      }]);
    }

    // Reset inputs
    setTempProductId("");
    setTempQty(1);
    setTempPrice(0);
    showToast("Article ajouté au bon", "success");
  };

  const handleRemoveItem = (idx: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== idx));
  };

  const handleCreateDocument = () => {
    if (!partnerName) {
      showToast("Veuillez saisir le nom du partenaire", "error");
      return;
    }
    if (selectedItems.length === 0) {
      showToast("Veuillez ajouter au moins un article", "error");
      return;
    }

    const totalAmount = selectedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const newDocId = `BC-${new Date().getFullYear()}-${String(docs.length + 1).padStart(3, "0")}`;

    const newDoc: Document = {
      id: newDocId,
      type: modalType,
      customer: partnerName,
      date,
      amount: totalAmount,
      status: "Brouillon",
      delay,
      items: selectedItems
    };

    setDocs([newDoc, ...docs]);
    setIsModalOpen(false);

    // Reset form
    setPartnerName("");
    setDelay(30);
    setSelectedItems([]);
    setTempProductId("");
    setTempQty(1);
    setTempPrice(0);

    showToast(`Bon de commande ${newDocId} généré avec succès !`, "success");
  };

  const handleDeleteDoc = (id: string) => {
    setDocs(docs.filter(d => d.id !== id));
    showToast("Bon de commande supprimé", "success");
  };

  const filteredDocs = docs.filter(d => {
    const sLower = search.toLowerCase();
    return d.id.toLowerCase().includes(sLower) || d.customer.toLowerCase().includes(sLower);
  });

  const columns = [
    {
      header: "N° Bon",
      accessor: (d: Document) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-zinc-400" />
          <span className="font-black text-foreground">{d.id}</span>
        </div>
      ),
    },
    {
      header: "Type",
      accessor: (d: Document) => (
        <Badge variant={d.type === "Client" ? "primary" : "secondary"}>
          {d.type === "Client" ? "Bon Client" : "Bon Fournisseur"}
        </Badge>
      ),
    },
    {
      header: "Partenaire / Client",
      accessor: (d: Document) => (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-zinc-400" />
          <span className="text-xs font-bold">{d.customer}</span>
        </div>
      ),
    },
    {
      header: "Date",
      accessor: (d: Document) => (
        <span className="text-xs font-bold text-zinc-500">{new Date(d.date).toLocaleDateString()}</span>
      ),
    },
    {
      header: "Montant (FCFA)",
      accessor: (d: Document) => (
        <span className="text-foreground font-black">{d.amount.toLocaleString()}</span>
      ),
    },
    {
      header: "Statut",
      accessor: (d: Document) => {
        const variants: any = {
          Payé: "success",
          Envoyé: "primary",
          Brouillon: "outline",
          Expiré: "danger",
        };
        return <Badge variant={variants[d.status]}>{d.status}</Badge>;
      },
    },
    {
      header: "Actions",
      accessor: (d: Document) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => { setViewDoc(d); setIsViewOpen(true); }}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"
            title="Détails"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteDoc(d.id)}
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

  return (
    <AppLayout
      title="Bons de Commande"
      subtitle="Gestion des bons de commande clients massifs et fournisseurs"
      rightElement={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setModalType("Client"); setIsModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Bon Client
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setModalType("Fournisseur"); setIsModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Bon Fournisseur
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Card className="p-6 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher par n° ou partenaire..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Mois en cours
              </Button>
            </div>
          </div>

          <DataTable columns={columns} data={filteredDocs} />
        </Card>
      </div>

      {/* Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Créer un bon de commande - ${modalType === "Client" ? "Client" : "Fournisseur"}`}
      >
        <div className="flex flex-col gap-4 max-h-[85vh] overflow-y-auto pr-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              {modalType === "Client" ? "Client / Partenaire" : "Fournisseur"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder={modalType === "Client" ? "Ex: Entreprise BTP SARL" : "Ex: SOTACI"}
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Délai (jours)</label>
              <input
                type="number"
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Add Item Section */}
          <div className="border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-4 mt-2">
            <h4 className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase mb-3">Ajouter un Article</h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="flex flex-col gap-1.5 md:col-span-6">
                <label className="text-[9px] font-bold text-zinc-400 uppercase">Produit / Matériau</label>
                <select
                  value={tempProductId}
                  onChange={(e) => setTempProductId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all appearance-none"
                >
                  <option value="">Sélectionner produit...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-3">
                <label className="text-[9px] font-bold text-zinc-400 uppercase">Qté</label>
                <input
                  type="number"
                  value={tempQty}
                  onChange={(e) => setTempQty(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-3">
                <label className="text-[9px] font-bold text-zinc-400 uppercase">Prix Unitaire (FCFA)</label>
                <input
                  type="number"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
            <Button variant="secondary" size="sm" className="mt-3 w-full border-dashed" onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-1.5" /> Ajouter l'article au bon
            </Button>
          </div>

          {/* Selected Items Table */}
          {selectedItems.length > 0 && (
            <div className="border rounded-xl overflow-hidden mt-3">
              <table className="w-full text-left text-xs font-bold">
                <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-400 uppercase text-[9px]">
                  <tr>
                    <th className="p-3">Désignation</th>
                    <th className="p-3">Quantité</th>
                    <th className="p-3">P.U (FCFA)</th>
                    <th className="p-3">Total (FCFA)</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item, idx) => (
                    <tr key={idx} className="border-t border-zinc-150 dark:border-zinc-800">
                      <td className="p-3">{item.name}</td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3">{item.price.toLocaleString()}</td>
                      <td className="p-3">{(item.quantity * item.price).toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Total display */}
          <div className="flex items-center justify-between border-t pt-4 mt-2">
            <span className="text-xs font-black text-zinc-500 uppercase">Montant Total du Bon :</span>
            <span className="text-base font-black text-primary">
              {selectedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()} FCFA
            </span>
          </div>

          <Button variant="primary" className="mt-4 w-full animate-pulse-glow" onClick={handleCreateDocument}>
            Générer le bon de commande
          </Button>
        </div>
      </Modal>

      {/* Details / Print View Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Bon de Commande">
        {viewDoc && (
          <div className="flex flex-col gap-4 text-xs font-bold">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase">Numéro de Bon :</span>
                <p className="text-sm font-black text-foreground">{viewDoc.id}</p>
              </div>
              <div>
                <Badge variant={viewDoc.type === "Client" ? "primary" : "secondary"}>
                  {viewDoc.type === "Client" ? "Bon Client" : "Bon Fournisseur"}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase">Partenaire :</span>
                <p className="text-sm font-black text-foreground">{viewDoc.customer}</p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase">Date d'édition :</span>
                <p className="text-foreground">{new Date(viewDoc.date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="border rounded-xl overflow-hidden mt-2">
              <table className="w-full text-left text-xs font-bold">
                <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-400 uppercase text-[9px]">
                  <tr>
                    <th className="p-3">Désignation</th>
                    <th className="p-3">Quantité</th>
                    <th className="p-3">P.U (FCFA)</th>
                    <th className="p-3">Total (FCFA)</th>
                  </tr>
                </thead>
                <tbody>
                  {viewDoc.items?.map((item, idx) => (
                    <tr key={idx} className="border-t border-zinc-150 dark:border-zinc-800">
                      <td className="p-3">{item.name}</td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3">{item.price.toLocaleString()}</td>
                      <td className="p-3">{(item.quantity * item.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center border-t pt-4 mt-2">
              <span className="text-zinc-500 uppercase">Montant Final :</span>
              <span className="text-lg font-black text-primary">{viewDoc.amount.toLocaleString()} FCFA</span>
            </div>

            <Button variant="secondary" className="w-full mt-4" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Imprimer le Document
            </Button>
          </div>
        )}
      </Modal>

      {/* Feuille de style globale d'impression */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          /* Masquage de l'interface entière excepté la section d'impression */
          body * {
            visibility: hidden !important;
          }
          /* Rendre uniquement visible la section d'impression */
          #print-section, #print-section * {
            visibility: visible !important;
          }
          #print-section {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background-color: white !important;
            color: #111827 !important;
            padding: 24px !important;
          }
          /* ensure background colors are printed exactly */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          /* Empêcher les sauts de page */
          tr {
            page-break-inside: avoid !important;
          }
        }
      `}} />

      {/* SECTION D'IMPRESSION HAUTE FIDÉLITÉ (STYLE REFERENCE INVOICE) */}
      {viewDoc && (
        <div id="print-section" className="hidden print:block bg-white text-zinc-900 font-sans p-8 select-none">
          {/* Ligne bleue d'en-tête */}
          <div className="h-2 bg-[#00a3e0] w-full mb-6"></div>

          {/* En-tête : Marque & Infos Bon */}
          <div className="flex justify-between items-stretch mb-8">
            {/* Logo et Nom à gauche */}
            <div className="bg-[#003b95] text-white pl-6 pr-12 py-5 rounded-br-[40px] flex items-center gap-4 min-w-[280px]">
              <div className="p-2 bg-white/10 rounded-xl">
                <Package className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight leading-none text-white">SP SERVICES</h1>
                <p className="text-[9px] text-[#00a3e0] font-bold uppercase tracking-widest mt-1">Gestion de Stock Pro</p>
              </div>
            </div>

            {/* Numéro et date à droite */}
            <div className="bg-[#003b95] text-white px-8 py-5 rounded-bl-[40px] text-right flex flex-col justify-center">
              <span className="text-[9px] uppercase tracking-widest text-zinc-300 font-black">
                {viewDoc.type === "Client" ? "BON DE COMMANDE CLIENT" : "BON DE COMMANDE FOURNISSEUR"}
              </span>
              <h2 className="text-sm font-black font-mono mt-1 text-[#00a3e0]">N° {viewDoc.id.toUpperCase()}</h2>
              <p className="text-[9px] text-zinc-200 font-bold mt-1">Date: {new Date(viewDoc.date).toLocaleDateString("fr-FR")}</p>
            </div>
          </div>

          {/* Informations de paiement & Facturation */}
          <div className="grid grid-cols-2 gap-8 mb-8 text-xs font-bold font-sans">
            {/* Bloc de Paiement (Gauche) */}
            <div className="border border-[#003b95]/20 p-5 rounded-2xl bg-zinc-50/50">
              <h3 className="font-black text-[#003b95] uppercase tracking-wider mb-3 text-[10px]">Payment information:</h3>
              <div className="grid grid-cols-3 gap-y-1.5 font-bold text-zinc-500">
                <span className="col-span-1">Account:</span>
                <span className="col-span-2 font-mono text-zinc-800">4568789465132156</span>
                <span className="col-span-1">A/C Name:</span>
                <span className="col-span-2 text-zinc-800">SP SERVICES STOCK</span>
                <span className="col-span-1">Bank Detail:</span>
                <span className="col-span-2 text-zinc-800">ECOBANK CÔTE D'IVOIRE</span>
              </div>
            </div>

            {/* Bloc Partenaire (Droite) */}
            <div className="p-1">
              <h3 className="font-black text-[#003b95] uppercase tracking-wider mb-3 text-[10px]">
                {viewDoc.type === "Client" ? "Client / Destinataire:" : "Fournisseur Partenaire:"}
              </h3>
              <div className="grid grid-cols-3 gap-y-1.5 font-bold text-zinc-500">
                <span className="col-span-1">Nom / Cie:</span>
                <span className="col-span-2 text-zinc-850 font-black">{viewDoc.customer}</span>
                <span className="col-span-1">Téléphone:</span>
                <span className="col-span-2 font-mono text-zinc-800">Non renseigné</span>
                <span className="col-span-1">Adresse:</span>
                <span className="col-span-2 text-zinc-800">Abidjan, Côte d'Ivoire</span>
              </div>
            </div>
          </div>

          {/* Tableau des Articles Commandés */}
          <div className="border border-zinc-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
            <table className="w-full text-left text-xs font-bold">
              <thead>
                <tr className="bg-[#003b95] text-white text-[9px] uppercase tracking-wider border-b border-zinc-200">
                  <th className="p-3.5 text-center w-12 bg-[#003b95]">N°</th>
                  <th className="p-3.5 pl-6">Désignation des Articles</th>
                  <th className="p-3.5 text-right w-36">Prix Unitaire</th>
                  <th className="p-3.5 text-center w-24">Quantité</th>
                  <th className="p-3.5 text-right w-40">Montant Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {viewDoc.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50">
                    <td className="p-3.5 text-center bg-[#003b95] text-white font-mono text-[10px]">{String(idx + 1).padStart(2, "0")}</td>
                    <td className="p-3.5 pl-6 text-zinc-800 text-[11px] font-black">{item.name}</td>
                    <td className="p-3.5 text-right font-mono text-zinc-650">{new Intl.NumberFormat("fr-FR").format(item.price)} FCFA</td>
                    <td className="p-3.5 text-center font-mono text-zinc-650">{item.quantity}</td>
                    <td className="p-3.5 text-right font-mono text-zinc-900 font-black">{new Intl.NumberFormat("fr-FR").format(item.quantity * item.price)} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Zone inférieure : CGV et Totaux */}
          <div className="grid grid-cols-12 gap-8 mb-12 text-xs">
            {/* Conditions Générales (Gauche) */}
            <div className="col-span-7 pr-4">
              <h4 className="font-black text-[#003b95] uppercase tracking-wider mb-2 text-[10px]">TERMS & CONDITIONS:</h4>
              <p className="text-[10px] text-zinc-400 leading-relaxed font-normal font-sans">
                Les marchandises livrées restent la propriété exclusive de SP SERVICES jusqu'au paiement intégral de la commande. Toute divergence ou contestation de quantité/qualité doit être notifiée par écrit sous un délai de 48 heures suivant la réception effective dans nos locaux.
              </p>
            </div>

            {/* Totaux (Droite) */}
            <div className="col-span-5 flex flex-col gap-2 text-right font-bold text-zinc-500">
              <div className="flex justify-between">
                <span>Sous-total:</span>
                <span className="font-mono text-zinc-700">{new Intl.NumberFormat("fr-FR").format(viewDoc.amount)} FCFA</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span>Taxes (0%):</span>
                <span className="font-mono text-zinc-700">0 FCFA</span>
              </div>
              <div className="flex justify-between text-sm font-black text-[#003b95] pt-1">
                <span>Montant Net à Payer:</span>
                <span className="font-mono text-[#00a3e0] text-base">{new Intl.NumberFormat("fr-FR").format(viewDoc.amount)} FCFA</span>
              </div>
            </div>
          </div>

          {/* Pied de page décoratif */}
          <div className="relative mt-auto pt-8 border-t border-zinc-150 flex flex-col items-center">
            <p className="text-[9px] font-black text-[#003b95] uppercase tracking-widest">SP SERVICES - SYSTÈME D'APPROVISIONNEMENT ET DE STOCK</p>
            <p className="text-[9px] text-[#00a3e0] font-bold mt-1">Visit us at www.spservices.ci</p>

            {/* Bande bleue de pied de page */}
            <div className="h-1.5 bg-[#00a3e0] w-full mt-4 rounded-full"></div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
