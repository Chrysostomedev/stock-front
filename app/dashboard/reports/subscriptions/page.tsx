"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import { useDashboardShop } from "@/contexts/DashboardShopContext";
import ReportSubscriptionsService from "@/services/reportSubscriptions.service";
import { ReportSubscription, ReportType } from "@/types/reports";
import {
  Bell, Plus, Trash2, Send, RefreshCw, Check, X,
} from "lucide-react";

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  DAILY: "Rapport Journalier",
  WEEKLY: "Rapport Hebdomadaire",
  MONTHLY: "Rapport Mensuel",
  LOW_STOCK: "Alerte Stock Bas",
};

const REPORT_TYPE_COLORS: Record<ReportType, string> = {
  DAILY: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  WEEKLY: "bg-primary/10 text-primary",
  MONTHLY: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  LOW_STOCK: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

export default function SubscriptionsPage() {
  const { shopId } = useDashboardShop();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [subs, setSubs] = useState<ReportSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ email: string; reportType: ReportType }>({
    email: user?.email ?? "",
    reportType: "DAILY",
  });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      setSubs(await ReportSubscriptionsService.getByShop(shopId));
    } catch {
      showToast("Impossible de charger les abonnements", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [shopId]);
  useEffect(() => { if (user?.email) setForm((f) => ({ ...f, email: user.email! })); }, [user?.email]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId || !form.email) return;
    setSubmitting(true);
    try {
      const sub = await ReportSubscriptionsService.create({ shopId, email: form.email, reportType: form.reportType });
      setSubs((s) => [...s, sub]);
      setShowForm(false);
      showToast("Abonnement créé avec succès", "success");
    } catch {
      showToast("Impossible de créer l'abonnement", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (sub: ReportSubscription) => {
    try {
      const updated = await ReportSubscriptionsService.update(sub.id, { isActive: !sub.isActive });
      setSubs((s) => s.map((x) => (x.id === sub.id ? updated : x)));
    } catch {
      showToast("Impossible de modifier l'abonnement", "error");
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await ReportSubscriptionsService.delete(id);
      setSubs((s) => s.filter((x) => x.id !== id));
      showToast("Abonnement supprimé", "success");
    } catch {
      showToast("Impossible de supprimer l'abonnement", "error");
    } finally {
      setDeleting(null);
    }
  };

  const handleSendNow = async (id: string) => {
    setSending(id);
    try {
      const r = await ReportSubscriptionsService.sendNow(id);
      showToast(r.message ?? "Rapport envoyé", "success");
    } catch {
      showToast("Impossible d'envoyer le rapport", "error");
    } finally {
      setSending(null);
    }
  };

  return (
    <AppLayout
      title="Abonnements Email"
      subtitle="Rapports automatiques par email"
      backUrl="/dashboard"
      rightElement={
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:text-primary transition-all">
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-black hover:opacity-90 transition-all">
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 max-w-3xl mx-auto pb-12 px-2 sm:px-0">

        {/* ── Formulaire ── */}
        {showForm && (
          <div className="bg-white dark:bg-zinc-900 border border-primary/30 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Bell className="h-4 w-4" /> Nouvel Abonnement
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all">
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Adresse Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="exemple@email.com"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-100 outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Type de Rapport</label>
                <select
                  value={form.reportType}
                  onChange={(e) => setForm((f) => ({ ...f, reportType: e.target.value as ReportType }))}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-100 outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  {(["DAILY", "WEEKLY", "MONTHLY", "LOW_STOCK"] as ReportType[]).map((t) => (
                    <option key={t} value={t}>{REPORT_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-black text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-5 py-2 bg-primary text-white rounded-xl text-xs font-black hover:opacity-90 disabled:opacity-50 transition-all">
                  {submitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Créer
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Liste des abonnements ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Bell className="h-4 w-4" /> Abonnements Actifs
            </h3>
          </div>
          {loading ? (
            <div className="py-12 text-center text-zinc-400 text-xs font-bold">Chargement…</div>
          ) : subs.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <Bell className="h-8 w-8 text-zinc-200 dark:text-zinc-700" />
              <p className="text-sm font-black text-zinc-400">Aucun abonnement configuré</p>
              <p className="text-[11px] font-bold text-zinc-300 dark:text-zinc-600">Cliquez sur « Ajouter » pour commencer</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {subs.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${REPORT_TYPE_COLORS[sub.reportType]}`}>
                          {REPORT_TYPE_LABELS[sub.reportType]}
                        </span>
                        <span className={`inline-flex h-1.5 w-1.5 rounded-full ${sub.isActive ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />
                      </div>
                      <p className="text-xs font-black text-zinc-800 dark:text-zinc-100">{sub.email}</p>
                      {sub.lastSentAt && (
                        <p className="text-[10px] font-bold text-zinc-400 mt-0.5">
                          Dernier envoi : {new Date(sub.lastSentAt).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggle(sub)}
                      title={sub.isActive ? "Désactiver" : "Activer"}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${sub.isActive ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/20 text-zinc-400"}`}
                    >
                      {sub.isActive ? "Actif" : "Inactif"}
                    </button>
                    <button
                      onClick={() => handleSendNow(sub.id)}
                      disabled={sending === sub.id}
                      title="Envoyer maintenant"
                      className="p-2 hover:bg-primary/10 hover:text-primary rounded-xl transition-all text-zinc-400 disabled:opacity-50"
                    >
                      {sending === sub.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      disabled={deleting === sub.id}
                      title="Supprimer"
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 rounded-xl transition-all text-zinc-400 disabled:opacity-50"
                    >
                      {deleting === sub.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-700/60 rounded-2xl">
          <p className="text-[11px] font-bold text-zinc-500 leading-relaxed">
            Les rapports journaliers sont envoyés chaque soir à 20h. Les rapports hebdomadaires le lundi matin. Les rapports mensuels le 1er de chaque mois. Les alertes stock bas sont envoyées en temps réel.
          </p>
        </div>

      </div>
    </AppLayout>
  );
}
