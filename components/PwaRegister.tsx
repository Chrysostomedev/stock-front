"use client";

import { useEffect } from "react";

/**
 * Enregistre le Service Worker au montage.
 * Doit être rendu côté client uniquement (pas de SSR).
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[SW] Enregistré — scope:", reg.scope);

        // Vérifier si une mise à jour est disponible
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("[SW] Nouvelle version disponible — rechargez la page");
            }
          });
        });
      })
      .catch((err) => console.warn("[SW] Erreur d'enregistrement:", err));
  }, []);

  return null;
}
