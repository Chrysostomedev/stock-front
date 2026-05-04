"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layouts/Sidebar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Users, UserPlus, Trash, Shield, ToggleLeft, ToggleRight } from "lucide-react";

interface Manager {
  id: number;
  name: string;
  phone: string;
  active: boolean;
}

export default function RolesPage() {
  const [managers, setManagers] = useState<Manager[]>([
    { id: 1, name: "Awa Koné", phone: "07 01 02 03 04", active: true },
    { id: 2, name: "Koffi N'Guessan", phone: "05 05 06 07 08", active: false },
    { id: 3, name: "Sita Traoré", phone: "01 10 11 12 13", active: true },
  ]);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const handleAddManager = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;
    const m: Manager = {
      id: Date.now(),
      name: newName,
      phone: newPhone,
      active: true,
    };
    setManagers([...managers, m]);
    setNewName("");
    setNewPhone("");
  };

  const toggleActive = (id: number) => {
    setManagers(
      managers.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  };

  const removeManager = (id: number) => {
    setManagers(managers.filter((m) => m.id !== id));
  };

  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-zinc-50 dark:bg-zinc-950 select-none">
      <Sidebar />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
            Gestion des Rôles
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Créez, activez ou désactivez l'accès des Managers
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List of managers */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500" />
              Liste des Managers
            </h3>
            <div className="flex flex-col gap-3">
              {managers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 rounded-xl"
                >
                  <div>
                    <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-50 leading-tight">
                      {m.name}
                    </h4>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold block mt-0.5">
                      Tel: {m.phone}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        m.active
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                      }`}
                    >
                      {m.active ? "Actif" : "Inactif"}
                    </span>

                    {/* Toggle activation button */}
                    <button
                      onClick={() => toggleActive(m.id)}
                      className={`flex items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                        m.active
                          ? "border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800/60 text-emerald-600"
                          : "border-red-200 hover:bg-red-50 dark:border-red-800/60 text-red-600"
                      }`}
                      title={m.active ? "Désactiver" : "Activer"}
                    >
                      {m.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>

                    {/* Delete manager */}
                    <button
                      onClick={() => removeManager(m.id)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add new manager form */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <Card className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl flex flex-col gap-4">
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-500" />
                Ajouter un Manager
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 leading-normal">
                Donnez l'accès à un nouveau collaborateur (Manager).
              </p>

              <form onSubmit={handleAddManager} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Nom complet du Manager
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Assita Koné"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Téléphone (PIN d'accès)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 0700000000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full mt-2 font-black text-sm tracking-tight"
                >
                  Ajouter l'accès Manager
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
