"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
    FileText,
    Search,
    Plus,
    Calendar,
    User,
    MoreVertical,
    Download,
    Printer,
    CheckCircle,
    Trash2,
} from "lucide-react";

interface Document {
    id: string;
    type: "Devis" | "Facture";
    customer: string;
    date: string;
    amount: number;
    status: "Brouillon" | "Envoyé" | "Payé" | "Expiré";
}

const mockDocs: Document[] = [
    { id: "DV-2026-001", type: "Devis", customer: "Entreprise BTP SARL", date: "10 Mai 2026", amount: 450000, status: "Envoyé" },
    { id: "FC-2026-045", type: "Facture", customer: "M. Bakayoko", date: "08 Mai 2026", amount: 85000, status: "Payé" },
    { id: "DV-2026-002", type: "Devis", customer: "Chantier Riviera", date: "07 Mai 2026", amount: 1250000, status: "Brouillon" },
];

export default function QuincDevisPage() {
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"Devis" | "Facture">("Devis");

    const columns: { header: string; accessor: keyof Document | ((item: Document) => React.ReactNode); className?: string }[] = [
        {
            header: "N° Document",
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
                <Badge variant={d.type === "Devis" ? "secondary" : "primary"}>{d.type}</Badge>
            ),
        },
        {
            header: "Client",
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
                <span className="text-xs font-bold text-zinc-500">{d.date}</span>
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
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-all">
                        <Printer className="h-4 w-4" />
                    </button>
                    <button className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-zinc-400 hover:text-red-600 transition-all">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
            className: "text-right",
        },
    ];

    return (
        <AppLayout
            title="Devis & Factures"
            subtitle="Gestion des documents commerciaux"
            rightElement={
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setModalType("Devis"); setIsModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau Devis
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => { setModalType("Facture"); setIsModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle Facture
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
                                placeholder="Rechercher par n° ou client..."
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

                    <DataTable columns={columns} data={mockDocs} />
                </Card>
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={`Créer un(e) ${modalType}`}
            >
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black text-zinc-500 uppercase">Client</label>
                        <input 
                            type="text" 
                            placeholder="Ex: M. Bakayoko ou Entreprise SARL"
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-black text-zinc-500 uppercase">Date</label>
                            <input 
                                type="date" 
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-black text-zinc-500 uppercase">Validité (jours)</label>
                            <input 
                                type="number" 
                                defaultValue={30}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-700">
                        <label className="text-xs font-black text-zinc-500 uppercase mb-2">Articles</label>
                        <Button variant="outline" size="sm" className="w-fit border-dashed">
                            <Plus className="h-3 w-3 mr-2" /> Ajouter un article
                        </Button>
                    </div>
                    <Button variant="primary" className="mt-4" onClick={() => setIsModalOpen(false)}>
                        Générer le document
                    </Button>
                </div>
            </Modal>
        </AppLayout>
    );
}
