"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";
import {
  Plus,
  Search,
  Box,
  Tag,
  AlertTriangle,
  Edit2,
  Trash2,
  Filter,
  Download,
  Barcode,
  Layers,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  sku: string; // Barcode
}

const mockProducts: Product[] = [
  { id: 1, name: "Riz Maman 5kg", category: "Alimentation", price: 3500, stock: 15, unit: "Sac", sku: "7613036" },
  { id: 2, name: "Huile Dinor 1.5L", category: "Alimentation", price: 1750, stock: 24, unit: "Bouteille", sku: "6181100" },
  { id: 3, name: "Sachet d'Eau Kirene", category: "Boissons", price: 100, stock: 120, unit: "Sachet", sku: "1234567" },
  { id: 4, name: "Lait Bonnet Rouge", category: "Produits laitiers", price: 650, stock: 45, unit: "Boîte", sku: "8901234" },
  { id: 5, name: "Spaghetti Maman", category: "Alimentation", price: 400, stock: 8, unit: "Paquet", sku: "5678901" },
];

export default function SuperProduitsPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const categories = ["Toutes", "Alimentation", "Boissons", "Produits laitiers", "Hygiène", "Boucherie"];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search);
    const matchesCategory = selectedCategory === "Toutes" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const columns = [
    {
      header: "Code-barres / SKU",
      accessor: (p: Product) => (
        <div className="flex items-center gap-2">
          <Barcode className="h-4 w-4 text-zinc-400" />
          <span className="font-mono text-[11px]">{p.sku}</span>
        </div>
      ),
    },
    {
      header: "Produit",
      accessor: (p: Product) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground">{p.name}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">{p.category}</span>
        </div>
      ),
    },
    {
      header: "Prix (FCFA)",
      accessor: (p: Product) => (
        <span className="text-primary font-black">{p.price.toLocaleString()}</span>
      ),
    },
    {
      header: "Stock",
      accessor: (p: Product) => (
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${p.stock < 10 ? "text-red-600" : "text-foreground"}`}>
            {p.stock} {p.unit}s
          </span>
          {p.stock < 10 && (
            <Badge variant="danger" className="animate-pulse">
              Critique
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (p: Product) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setProductToEdit(p); setIsModalOpen(true); }}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button 
            onClick={() => { setProductToEdit(p); setIsConfirmOpen(true); }}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-zinc-400 hover:text-red-600 transition-all"
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
      title="Catalogue Produits"
      subtitle="Gestion centralisée des stocks du supermarché"
      rightElement={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setProductToEdit(null); setIsModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Produit
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Produits</p>
              <h4 className="text-2xl font-black text-foreground">{products.length}</h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-600 rounded-2xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Stock Critique</p>
              <h4 className="text-2xl font-black text-foreground">
                {products.filter((p) => p.stock < 10).length}
              </h4>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <Tag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Catégories</p>
              <h4 className="text-2xl font-black text-foreground">{categories.length - 1}</h4>
            </div>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card className="p-6 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou code-barres..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                    selectedCategory === cat
                      ? "bg-primary text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <DataTable columns={columns} data={filteredProducts} />
        </Card>
      </div>

      {/* Product Form Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={productToEdit ? "Modifier Produit" : "Nouveau Produit"}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-zinc-500 uppercase">Nom du produit</label>
            <input 
              type="text" 
              defaultValue={productToEdit?.name}
              placeholder="Ex: Riz Maman 5kg"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Code-barres / SKU</label>
              <input 
                type="text" 
                defaultValue={productToEdit?.sku}
                placeholder="Ex: 7613036"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Catégorie</label>
              <select 
                defaultValue={productToEdit?.category}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              >
                {categories.filter(c => c !== "Toutes").map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Prix (FCFA)</label>
              <input 
                type="number" 
                defaultValue={productToEdit?.price}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-zinc-500 uppercase">Unité</label>
              <input 
                type="text" 
                defaultValue={productToEdit?.unit}
                placeholder="Ex: Sac, Bouteille..."
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
          <Button variant="primary" className="mt-2" onClick={() => setIsModalOpen(false)}>
            {productToEdit ? "Mettre à jour" : "Ajouter au catalogue"}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setProducts(products.filter(p => p.id !== productToEdit?.id));
          showToast("Produit supprimé", "success");
        }}
        title="Supprimer le produit"
        message={`Êtes-vous sûr de vouloir supprimer "${productToEdit?.name}" ? Cette action est irréversible.`}
      />
    </AppLayout>
  );
}
