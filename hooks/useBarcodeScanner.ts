"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseBarcodeSccannerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  /** Délai max en ms entre deux caractères pour détecter un scanner USB (défaut: 50ms) */
  usbInterCharDelay?: number;
  /** Longueur minimale pour valider un code-barres (défaut: 3) */
  minLength?: number;
}

/**
 * Détecte les scans USB/Bluetooth (émulation clavier) en observant
 * des frappes rapides suivies de Enter. Fonctionne sur desktop et mobile.
 * Invisible — pas de composant UI.
 */
export function useBarcodeScanner({
  onScan,
  enabled = true,
  usbInterCharDelay = 50,
  minLength = 3,
}: UseBarcodeSccannerOptions) {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const tag = (e.target as HTMLElement)?.tagName;
      const now = Date.now();
      const delta = now - lastKeyTimeRef.current;

      // Reset le buffer si trop long entre deux touches (saisie manuelle)
      if (delta > usbInterCharDelay && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      if (e.key === "Enter") {
        const code = bufferRef.current.trim();
        bufferRef.current = "";
        lastKeyTimeRef.current = 0;

        if (code.length >= minLength && (delta <= usbInterCharDelay || tag !== "INPUT")) {
          e.preventDefault();
          onScan(code);
        }
        return;
      }

      // Accumuler seulement les caractères imprimables
      if (e.key.length === 1) {
        if (delta > usbInterCharDelay && tag === "INPUT" && bufferRef.current.length === 0) {
          lastKeyTimeRef.current = now;
          return;
        }
        bufferRef.current += e.key;
        lastKeyTimeRef.current = now;
      }
    },
    [enabled, onScan, usbInterCharDelay, minLength]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
