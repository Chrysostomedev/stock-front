"use client";

/**
 * useNetwork.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook de détection de la connectivité réseau.
 *
 * Fonctionnement :
 *  - Sur mobile (Capacitor) : utilise @capacitor/network pour une détection
 *    native précise (WiFi, 4G, etc.)
 *  - Sur web/Electron : utilise les événements navigator.onLine du navigateur
 *
 * Expose :
 *  - isOnline      : boolean — true si connecté
 *  - connectionType: string  — "wifi" | "cellular" | "none" | "unknown"
 *  - triggerSync   : () => Promise<void> — déclenche manuellement la sync
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback, useRef } from "react";

// Détecte si on tourne dans Capacitor (mobile natif)
const isCapacitor =
  typeof window !== "undefined" && !!(window as any).Capacitor;

export interface NetworkState {
  isOnline: boolean;
  connectionType: "wifi" | "cellular" | "none" | "unknown";
  triggerSync: () => Promise<void>;
}

export function useNetwork(): NetworkState {
  // État initial : on suppose qu'on est en ligne au démarrage
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [connectionType, setConnectionType] = useState<
    "wifi" | "cellular" | "none" | "unknown"
  >("unknown");

  // Ref pour éviter de déclencher plusieurs syncs simultanées
  const isSyncing = useRef<boolean>(false);

  // ─────────────────────────────────────────────
  // Déclenche la synchronisation côté backend
  // Appelle POST /sync-queue/process sur le serveur Railway
  // ─────────────────────────────────────────────
  const triggerSync = useCallback(async (): Promise<void> => {
    if (isSyncing.current) return; // Évite les appels en double
    isSyncing.current = true;

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null;

      if (!token) {
        console.warn("[useNetwork] Pas de token — sync ignorée");
        return;
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://back-spservice-production.up.railway.app/api/v1";

      const response = await fetch(`${apiUrl}/sync-queue/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log(
          `[useNetwork] ✅ Sync déclenchée : ${result?.data?.succeeded ?? 0} items synchronisés`
        );
      } else {
        console.warn(
          `[useNetwork] ⚠️ Sync retournée avec statut ${response.status}`
        );
      }
    } catch (error) {
      // Erreur réseau — normal si on vient de se reconnecter et le serveur
      // n'est pas encore joignable
      console.warn("[useNetwork] Sync échouée (réseau instable) :", error);
    } finally {
      isSyncing.current = false;
    }
  }, []);

  // ─────────────────────────────────────────────
  // Callback appelé quand le statut réseau change
  // ─────────────────────────────────────────────
  const handleNetworkChange = useCallback(
    (online: boolean, type: "wifi" | "cellular" | "none" | "unknown") => {
      const wasOffline = !isOnline;

      setIsOnline(online);
      setConnectionType(type);

      // Si on vient de se reconnecter → déclencher la sync automatiquement
      if (online && wasOffline) {
        console.log("[useNetwork] 🔄 Reconnexion détectée — déclenchement sync");
        triggerSync();
      }

      if (!online) {
        console.log("[useNetwork] 📴 Connexion perdue — mode offline activé");
      }
    },
    [isOnline, triggerSync]
  );

  useEffect(() => {
    // ── Capacitor (Android / iOS) ──────────────────────────
    if (isCapacitor) {
      let listenerHandle: any = null;

      const setupCapacitorNetwork = async () => {
        try {
          // Import dynamique pour éviter les erreurs sur web/Electron
          const { Network } = await import("@capacitor/network");

          // Lire l'état initial
          const status = await Network.getStatus();
          setIsOnline(status.connected);
          setConnectionType(
            (status.connectionType as any) ?? "unknown"
          );

          // Écouter les changements
          listenerHandle = await Network.addListener(
            "networkStatusChange",
            (status) => {
              handleNetworkChange(
                status.connected,
                (status.connectionType as any) ?? "unknown"
              );
            }
          );
        } catch (err) {
          console.warn(
            "[useNetwork] Capacitor Network plugin non disponible :",
            err
          );
          // Fallback sur navigator.onLine si le plugin échoue
          setupBrowserNetwork();
        }
      };

      setupCapacitorNetwork();

      // Nettoyage : retirer le listener Capacitor au démontage
      return () => {
        listenerHandle?.remove?.();
      };
    }

    // ── Web / Electron : navigator.onLine ─────────────────
    const setupBrowserNetwork = () => {
      // État initial
      setIsOnline(navigator.onLine);
      setConnectionType(navigator.onLine ? "unknown" : "none");

      const handleOnline = () => handleNetworkChange(true, "unknown");
      const handleOffline = () => handleNetworkChange(false, "none");

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    };

    // Appel direct pour web/Electron (pas Capacitor)
    if (!isCapacitor) {
      const cleanup = setupBrowserNetwork();
      return cleanup;
    }
  }, [handleNetworkChange]);

  return { isOnline, connectionType, triggerSync };
}
