"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  X,
  RefreshCw,
  Flashlight,
  Volume2,
  VolumeX,
  Layers,
  CheckCircle2,
  AlertCircle,
  SwitchCamera,
  Keyboard,
} from "lucide-react";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  subtitle?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = "Scanner de Code-Barres",
  subtitle = "Visez le code-barres avec votre caméra",
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<any>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>("");

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isContinuous, setIsContinuous] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isSuccessFlash, setIsSuccessFlash] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>("");

  // Bip sonore synthétisé sans dépendance externe
  const playBeep = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio context might be restricted before interaction
    }
  }, [soundEnabled]);

  // Déclencher le scan avec anti-rebond intelligent
  const triggerScan = useCallback(
    (code: string) => {
      const trimmed = code.trim();
      if (!trimmed || trimmed.length < 3) return;

      const now = Date.now();
      const isSameCode = trimmed === lastScannedCodeRef.current;
      // 1.8s si même code (évite de biper 10 fois le même article par seconde)
      // 0.8s si code différent (permet d'enchaîner rapidement deux articles différents)
      const cooldown = isSameCode ? 1800 : 800;

      if (now - lastScanTimeRef.current < cooldown) {
        return;
      }

      lastScanTimeRef.current = now;
      lastScannedCodeRef.current = trimmed;
      setLastScanned(trimmed);
      setIsSuccessFlash(true);
      setTimeout(() => setIsSuccessFlash(false), 500);

      playBeep();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(80);
        } catch {}
      }

      onScan(trimmed);

      if (!isContinuous) {
        onClose();
      }
    },
    [isContinuous, onClose, onScan, playBeep]
  );

  // Démarrer la caméra et le scanner ZXing
  const startScanner = useCallback(async () => {
    if (!videoRef.current || typeof window === "undefined") return;

    // Arrêter l'ancien flux si existant
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch {}
      controlsRef.current = null;
    }

    try {
      setCameraError(null);
      const { BrowserMultiFormatReader, BrowserCodeReader } = await import("@zxing/browser");

      // Lister les caméras
      const videoDevices = await BrowserCodeReader.listVideoInputDevices();
      setDevices(videoDevices);

      // Sélectionner par défaut la caméra arrière (environment) si disponible
      let targetDeviceId = selectedDeviceId;
      if (!targetDeviceId && videoDevices.length > 0) {
        const backCamera = videoDevices.find((d) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("arrière") ||
          d.label.toLowerCase().includes("environment")
        );
        targetDeviceId = backCamera ? backCamera.deviceId : videoDevices[videoDevices.length - 1].deviceId;
        setSelectedDeviceId(targetDeviceId);
      }

      const reader = new BrowserMultiFormatReader();

      let controls;
      if (targetDeviceId) {
        controls = await reader.decodeFromVideoDevice(
          targetDeviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              triggerScan(result.getText());
            }
          }
        );
      } else {
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current,
          (result, error) => {
            if (result) {
              triggerScan(result.getText());
            }
          }
        );
      }

      controlsRef.current = controls;
      setHasCameraPermission(true);

      // Vérifier support de la torche
      try {
        const stream = videoRef.current.srcObject as MediaStream;
        const track = stream?.getVideoTracks()[0];
        const capabilities = track?.getCapabilities ? track.getCapabilities() : {};
        setHasTorch(Boolean((capabilities as any)?.torch));
      } catch {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.error("Camera scan error:", err);
      setHasCameraPermission(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Accès refusé. Veuillez autoriser l'accès à la caméra.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("Aucune caméra trouvée sur cet appareil.");
      } else {
        setCameraError("Impossible d'activer la caméra : " + (err.message || "Erreur inconnue"));
      }
    }
  }, [selectedDeviceId, triggerScan]);

  // Basculer la torche (Flash)
  const toggleTorch = async () => {
    if (!videoRef.current) return;
    try {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream?.getVideoTracks()[0];
      if (track) {
        const nextState = !torchEnabled;
        await track.applyConstraints({
          advanced: [{ torch: nextState } as any],
        });
        setTorchEnabled(nextState);
      }
    } catch (err) {
      console.warn("Torch toggle not supported:", err);
    }
  };

  // Basculer de caméra
  const switchCamera = () => {
    if (devices.length <= 1) return;
    const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    setSelectedDeviceId(devices[nextIndex].deviceId);
  };

  // Lifecycle : lancer la caméra à l'ouverture, arrêter à la fermeture
  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      if (controlsRef.current) {
        try {
          controlsRef.current.stop();
        } catch {}
        controlsRef.current = null;
      }
      setTorchEnabled(false);
      setLastScanned(null);
    }

    return () => {
      if (controlsRef.current) {
        try {
          controlsRef.current.stop();
        } catch {}
        controlsRef.current = null;
      }
    };
  }, [isOpen, selectedDeviceId, startScanner]);

  // Envoi manuel de code
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      triggerScan(manualCode);
      setManualCode("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-zinc-100">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Camera className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide uppercase">{title}</h3>
              <p className="text-[11px] text-zinc-400 font-medium">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ZONE VIDÉO ET VISEUR */}
        <div className="relative w-full aspect-4/3 sm:aspect-square bg-black overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Flash visuel lors d'un scan réussi */}
          {isSuccessFlash && (
            <div className="absolute inset-0 bg-emerald-500/30 z-20 pointer-events-none transition-opacity duration-300" />
          )}

          {/* VISEUR DE CADRAGE */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 p-8">
            <div
              className={`relative w-64 h-48 sm:w-72 sm:h-52 rounded-2xl border-2 transition-all duration-300 ${
                isSuccessFlash
                  ? "border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.8)] scale-105"
                  : "border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              }`}
            >
              {/* Coins renforcés */}
              <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

              {/* Ligne laser animée */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-scanner-laser" />

              {/* Texte de centrage */}
              <div className="absolute bottom-2 inset-x-0 text-center">
                <span className="bg-black/60 backdrop-blur-sm text-[10px] uppercase tracking-wider font-bold text-zinc-300 px-2.5 py-0.5 rounded-full border border-white/10">
                  Alignez le code ici
                </span>
              </div>
            </div>
          </div>

          {/* MESSAGE D'ERREUR OU DE PERMISSION */}
          {cameraError && (
            <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-30">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
              <p className="text-sm font-semibold text-rose-400 mb-2">{cameraError}</p>
              <button
                onClick={startScanner}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Réessayer
              </button>
            </div>
          )}

          {/* DERNIER CODE SCANNÉ (PILL NOTIFICATION FLOTTANTE) */}
          {lastScanned && (
            <div className="absolute top-4 inset-x-4 flex justify-center z-20 pointer-events-none animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 bg-emerald-950/90 border border-emerald-500/50 backdrop-blur-md px-3.5 py-1.5 rounded-full text-emerald-200 shadow-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs font-bold tracking-wider">{lastScanned}</span>
              </div>
            </div>
          )}

          {/* BARRE D'OUTILS SUR LA VIDÉO (TORCHE, CHANGEMENT CAMÉRA) */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${
                  torchEnabled
                    ? "bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                    : "bg-black/60 text-zinc-300 border-white/10 hover:bg-black/80"
                }`}
                title={torchEnabled ? "Éteindre le flash" : "Allumer le flash"}
              >
                <Flashlight className="w-4 h-4" />
              </button>
            )}

            {devices.length > 1 && (
              <button
                type="button"
                onClick={switchCamera}
                className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-zinc-300 transition-colors"
                title="Changer de caméra"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-zinc-300 transition-colors"
              title={soundEnabled ? "Couper le bip" : "Activer le bip"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
            </button>
          </div>
        </div>

        {/* OPTIONS & SAISIE MANUELLE DE SECOURS */}
        <div className="p-4 bg-zinc-900/80 border-t border-zinc-800 space-y-3">
          
          {/* Mode de scan : continu ou unitaire */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-zinc-300">Scan continu</span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline">(scanner plusieurs articles à la suite)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsContinuous((v) => !v)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                isContinuous ? "bg-emerald-500" : "bg-zinc-700"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  isContinuous ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Saisie manuelle de secours */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ou saisir le code à la main…"
                className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
            >
              Valider
            </button>
          </form>

        </div>

      </div>

      {/* Animation CSS du laser de visée */}
      <style jsx>{`
        @keyframes laserMove {
          0% {
            top: 5%;
          }
          50% {
            top: 95%;
          }
          100% {
            top: 5%;
          }
        }
        .animate-scanner-laser {
          position: absolute;
          animation: laserMove 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
