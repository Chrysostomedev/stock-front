"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";
import CategoryService, { Category } from "@/services/category.service";
import UnitService, { Unit } from "@/services/unit.service";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  FolderTree, 
  Tag, 
  Layers, 
  ChevronRight,
  Search,
  Filter
} from "lucide-react";
import Badge from "@/components/ui/Badge";

/**
 * Page de gestion des Catégories et Sous-catégories
 * Crucial pour l'organisation des produits en mode Supérette/Quincaillerie
 */
export default function AdminCategoriesPage() {
  const { showToast } = useToast();
  
  // États pour les données
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // États pour les modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // États pour le formulaire
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "", // Si vide, c'est une catégorie racine
    colorHex: "#3b82f6"
  });
  const [unitFormData, setUnitFormData] = useState({
    name: "",
    abbreviation: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chargement initial des catégories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await CategoryService.getAll();
      console.log("les catégories",response.data);
      // Le backend NestJS renvoie un objet paginé { data: [...], total: ... }
      const list = response?.data && Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
      setCategories(list);
    } catch (error) {
      console.error("Erreur lors du chargement des catégories:", error);
      showToast("Impossible de charger les catégories", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    setLoadingUnits(true);
    try {
      const response = await UnitService.getAll();
      const list = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
      setUnits(list);
    } catch (error) {
      console.error("Erreur chargement unités:", error);
    } finally {
      setLoadingUnits(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchUnits();
  }, []);

  // Soumission de l'unité
  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitFormData.name || !unitFormData.abbreviation) {
      showToast("Le nom et l'abréviation sont obligatoires", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      await UnitService.create(unitFormData);
      showToast("Unité créée avec succès", "success");
      setIsUnitModalOpen(false);
      setUnitFormData({ name: "", abbreviation: "" });
      fetchUnits();
    } catch (error) {
      console.error("Erreur création unité:", error);
      showToast("Impossible de créer l'unité", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gestion de l'ouverture de la modale (Ajout ou Édition)
  const handleOpenModal = (category: Category | null = null) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
        parentId: category.parentId || "",
        colorHex: category.colorHex || "#3b82f6"
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        name: "",
        description: "",
        parentId: "",
        colorHex: "#3b82f6"
      });
    }
    setIsModalOpen(true);
  };

  // Soumission du formulaire (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast("Le nom est obligatoire", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Nettoyage des données : parentId ne peut pas être une chaîne vide pour un UUID
      const cleanedData = {
        ...formData,
        parentId: formData.parentId === "" ? undefined : formData.parentId
      };

      if (selectedCategory) {
        // Mise à jour
        await CategoryService.update(selectedCategory.id, cleanedData);
        showToast("Catégorie mise à jour avec succès", "success");
      } else {
        // Création
        await CategoryService.create(cleanedData);
        showToast("Catégorie créée avec succès", "success");
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      showToast("Une erreur est survenue lors de l'enregistrement", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Suppression d'une catégorie
  const handleDelete = async () => {
    if (!selectedCategory) return;
    
    try {
      await CategoryService.delete(selectedCategory.id);
      showToast("Catégorie supprimée avec succès", "success");
      setIsConfirmOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      showToast("Erreur lors de la suppression (vérifiez si elle contient des produits)", "error");
    }
  };

  // Définition des colonnes pour le DataTable
  const columns: { header: string; accessor: keyof Category | ((item: Category) => React.ReactNode); className?: string }[] = [
    {
      header: "Catégorie",
      accessor: (item: Category) => (
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black"
            style={{ backgroundColor: item.colorHex || "#3b82f6" }}
          >
            {item.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-black text-zinc-900 dark:text-zinc-50">{item.name}</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
              {item.parentId ? "Sous-catégorie" : "Catégorie Racine"}
            </span>
          </div>
        </div>
      )
    },
    {
      header: "Parent",
      accessor: (item: Category) => (
        <div className="flex items-center gap-1.5">
          {item.parent ? (
            <>
              <Tag className="h-3 w-3 text-primary" />
              <span className="text-zinc-600 dark:text-zinc-400 font-bold">{item.parent.name}</span>
            </>
          ) : (
            <span className="text-zinc-300 dark:text-zinc-600">—</span>
          )}
        </div>
      )
    },
    {
      header: "Description",
      accessor: (item: Category) => item.description || "—",
      className: "max-w-xs truncate text-zinc-500"
    },
    {
      header: "Actions",
      accessor: (item: Category) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleOpenModal(item); }}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedCategory(item); setIsConfirmOpen(true); }}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  // Filtrage pour la recherche
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout 
      title="Gestion des Catégories" 
      subtitle="Organisez vos rayons et produits (Supérette & Quincaillerie)"
    >
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
        
        {/* Barre d'actions et filtres */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
              <Search className="h-4 w-4" />
            </span>
            <input 
              type="text" 
              placeholder="Rechercher une catégorie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all shadow-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => handleOpenModal()} variant="primary" className="h-12 px-6">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Catégorie
            </Button>
          </div>
        </div>

        {/* Layout Grid : Tableau des catégories (gauche) / Unités (droite) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-none shadow-xl h-full">
              <DataTable 
                columns={columns} 
                data={filteredCategories} 
                isLoading={loading}
              />
            </Card>
          </div>
<<<<<<< HEAD
=======

>>>>>>> 708c712647dbef968b1e01a9fb4ead77c04e6e70
          <div className="lg:col-span-1">
            <Card className="p-5 border-none shadow-xl h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-md text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Unités de mesure
                </h3>
                <Button onClick={() => setIsUnitModalOpen(true)} variant="outline" size="sm" className="h-9">
                  <Plus className="h-3 w-3 mr-1" /> Ajouter
                </Button>
              </div>

              {loadingUnits ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : units.length > 0 ? (
                <div className="flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
                  {units.map((u) => (
                    <div key={u.id} className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl flex justify-between items-center border border-zinc-100 dark:border-zinc-700/50 hover:border-primary/30 transition-all group">
                      <span className="font-bold text-sm text-zinc-700 dark:text-zinc-200">{u.name}</span>
                      <Badge variant="secondary" className="group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {u.abbreviation}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <Tag className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-2" />
                  <span className="text-sm font-bold text-zinc-500">Aucune unité</span>
                  <span className="text-xs text-zinc-400 mt-1">Créez votre première unité de mesure</span>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Statistiques rapides / Aide contextuelle */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-primary/5 rounded-3xl border border-primary/10 flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-primary">{categories.length}</span>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Catégories</span>
            </div>
          </div>
          
          <div className="p-4 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <FolderTree className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-emerald-600">
                {categories.filter(c => !c.parentId).length}
              </span>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Racines (Rayons)</span>
            </div>
          </div>

          <div className="p-4 bg-amber-500/5 rounded-3xl border border-amber-500/10 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
              <ChevronRight className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-amber-600">
                {categories.filter(c => c.parentId).length}
              </span>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sous-catégories</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modale d'ajout/édition Unité */}
      <Modal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        title="Ajouter une nouvelle unité"
      >
        <form onSubmit={handleUnitSubmit} className="flex flex-col gap-5 p-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              Nom de l'unité <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              placeholder="Ex: Kilogramme, Litre, Pièce..."
              value={unitFormData.name}
              onChange={(e) => setUnitFormData({...unitFormData, name: e.target.value})}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              Abréviation <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              placeholder="Ex: kg, L, pcs..."
              value={unitFormData.abbreviation}
              onChange={(e) => setUnitFormData({...unitFormData, abbreviation: e.target.value})}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <Button 
            variant="primary" 
            className="mt-2" 
            disabled={isSubmitting || !unitFormData.name || !unitFormData.abbreviation}
          >
            {isSubmitting ? "Création..." : "Créer l'unité"}
          </Button>
        </form>
      </Modal>

      {/* Modale d'ajout/édition Catégorie */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCategory ? "Modifier la catégorie" : "Ajouter une catégorie"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              Nom de la catégorie <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              placeholder="Ex: Alimentaire, Laitiers, Savons..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              Catégorie Parente (Optionnel)
            </label>
            <select 
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all appearance-none"
            >
              <option value="">Aucune (Catégorie Racine)</option>
              {categories
                .filter(c => !c.parentId && c.id !== selectedCategory?.id)
                .map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))
              }
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              Description
            </label>
            <textarea 
              rows={3}
              placeholder="Brève description de la catégorie..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              Couleur d'identification
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="color"
                value={formData.colorHex}
                onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                className="w-12 h-12 rounded-xl border-none p-1 cursor-pointer bg-transparent"
              />
              <span className="text-xs font-bold text-zinc-600 uppercase">{formData.colorHex}</span>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              className="flex-1"
              loading={isSubmitting}
            >
              {selectedCategory ? "Mettre à jour" : "Créer la catégorie"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modale de confirmation de suppression */}
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer la catégorie ?"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedCategory?.name}" ? Cette action est irréversible.`}
      />
    </AppLayout>
  );
}
