"use client";

import { useState } from "react";
import { Delete, Wifi, WifiOff, Lock } from "lucide-react";
import { useAuth } from "@/app/context/useContext";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function PinScreen() {
  const { user, unlockWithPin, logout } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  const handleKey = async (key: string) => {
    if (loading) return;

    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      setError("");
      return;
    }

    if (pin.length >= 4) return;

    const next = pin + key;
    setPin(next);
    setError("");

    if (next.length === 4) {
      await submit(next);
    }
  };

  const submit = async (value: string) => {
    setLoading(true);
    try {
      await unlockWithPin(value);
      // Succès → le contexte met needsPinUnlock à false, l'overlay disparaît
    } catch {
      setError("PIN incorrect. Réessayez.");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm">
      <div className="w-full max-w-xs mx-4 flex flex-col items-center gap-6">

        {/* En-tête */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-white font-black text-xl tracking-tight">
              Session expirée
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              {user?.name ? `Bonjour, ${user.name}` : "Entrez votre PIN pour continuer"}
            </p>
          </div>

          {/* Badge réseau */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
            isOnline
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-amber-500/10 text-amber-400"
          }`}>
            {isOnline
              ? <><Wifi className="w-3 h-3" /> En ligne</>
              : <><WifiOff className="w-3 h-3" /> Hors ligne — validation locale</>
            }
          </div>
        </div>

        {/* Indicateurs PIN */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                pin.length > i
                  ? "bg-primary scale-110"
                  : "bg-zinc-700"
              }`}
            />
          ))}
        </div>

        {/* Message d'erreur */}
        {error && (
          <p className="text-rose-400 text-sm font-bold -mt-2 animate-shake">
            {error}
          </p>
        )}

        {/* Clavier numérique */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {DIGITS.map((digit, idx) => {
            if (digit === "") {
              return <div key={idx} />;
            }
            return (
              <button
                key={idx}
                onClick={() => handleKey(digit)}
                disabled={loading}
                className={`
                  h-16 rounded-2xl font-black text-xl transition-all duration-100 select-none
                  ${digit === "⌫"
                    ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:scale-95"
                    : "bg-zinc-800 text-white hover:bg-zinc-700 active:scale-95 active:bg-primary/20"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {loading && digit !== "⌫" ? (
                  <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : digit === "⌫" ? (
                  <Delete className="w-5 h-5 mx-auto" />
                ) : (
                  digit
                )}
              </button>
            );
          })}
        </div>

        {/* Lien déconnexion */}
        <button
          onClick={logout}
          className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors underline underline-offset-2"
        >
          Se déconnecter et revenir à la page de connexion
        </button>
      </div>
    </div>
  );
}
