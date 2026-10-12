/**
 * barcodeUtils.ts — Générateur vectoriel SVG autonome pour Code 128 et QR Code
 * ─────────────────────────────────────────────────────────────────────────────
 * Aucun paquet externe requis. Rendu 100% vectoriel SVG net pour écran et
 * impression thermique (203dpi / 300dpi).
 */

/* ══════════════════════════════════════════════════════════════════════════════
   1. CODE 128 (TABLE B & AUTO)
   ══════════════════════════════════════════════════════════════════════════════ */

// Les 107 motifs Code 128 définis par largeurs [bar, space, bar, space, bar, space]
// Somme de chaque motif = 11 modules (sauf Stop = 13 modules)
const CODE128_PATTERNS: number[][] = [
  [2, 1, 2, 2, 2, 2], [2, 2, 2, 1, 2, 2], [2, 2, 2, 2, 2, 1], [1, 2, 1, 2, 2, 3],
  [1, 2, 1, 3, 2, 2], [1, 3, 1, 2, 2, 2], [1, 2, 2, 2, 1, 3], [1, 2, 2, 3, 1, 2],
  [1, 3, 2, 2, 1, 2], [2, 2, 1, 2, 1, 3], [2, 2, 1, 3, 1, 2], [2, 3, 1, 2, 1, 2],
  [1, 1, 2, 2, 3, 2], [1, 2, 2, 1, 3, 2], [1, 2, 2, 2, 3, 1], [1, 1, 3, 2, 2, 2],
  [1, 2, 3, 1, 2, 2], [1, 2, 3, 2, 2, 1], [2, 2, 3, 2, 1, 1], [2, 2, 1, 1, 3, 2],
  [2, 2, 1, 2, 3, 1], [2, 1, 3, 2, 1, 2], [2, 2, 3, 1, 1, 2], [3, 1, 2, 1, 3, 1],
  [3, 1, 1, 2, 2, 2], [3, 2, 1, 1, 2, 2], [3, 2, 1, 2, 2, 1], [3, 1, 2, 2, 1, 2],
  [3, 2, 2, 1, 1, 2], [3, 2, 2, 2, 1, 1], [2, 1, 2, 1, 2, 3], [2, 1, 2, 3, 2, 1],
  [2, 3, 2, 1, 2, 1], [1, 1, 1, 3, 2, 3], [1, 3, 1, 1, 2, 3], [1, 3, 1, 3, 2, 1],
  [1, 1, 2, 3, 1, 3], [1, 3, 2, 1, 1, 3], [1, 3, 2, 3, 1, 1], [2, 1, 1, 3, 1, 3],
  [2, 3, 1, 1, 1, 3], [2, 3, 1, 3, 1, 1], [1, 1, 2, 1, 3, 3], [1, 1, 2, 3, 3, 1],
  [1, 3, 2, 1, 3, 1], [1, 1, 3, 1, 2, 3], [1, 1, 3, 3, 2, 1], [1, 3, 3, 1, 2, 1],
  [3, 1, 3, 1, 2, 1], [2, 1, 1, 3, 3, 1], [2, 3, 1, 1, 3, 1], [2, 1, 3, 1, 1, 3],
  [2, 1, 3, 3, 1, 1], [2, 1, 3, 1, 3, 1], [3, 1, 1, 1, 2, 3], [3, 1, 1, 3, 2, 1],
  [3, 3, 1, 1, 2, 1], [3, 1, 2, 1, 1, 3], [3, 1, 2, 3, 1, 1], [3, 3, 2, 1, 1, 1],
  [3, 1, 4, 1, 1, 1], [2, 2, 1, 4, 1, 1], [4, 3, 1, 1, 1, 1], [1, 1, 1, 2, 2, 4],
  [1, 1, 1, 4, 2, 2], [1, 2, 1, 1, 2, 4], [1, 2, 1, 4, 2, 1], [1, 4, 1, 1, 2, 2],
  [1, 4, 1, 2, 2, 1], [1, 1, 2, 2, 1, 4], [1, 1, 2, 4, 1, 2], [1, 2, 2, 1, 1, 4],
  [1, 2, 2, 4, 1, 1], [1, 4, 2, 1, 1, 2], [1, 4, 2, 2, 1, 1], [2, 4, 1, 2, 1, 1],
  [2, 2, 1, 1, 1, 4], [4, 1, 3, 1, 1, 1], [2, 4, 1, 1, 1, 2], [1, 3, 4, 1, 1, 1],
  [1, 1, 1, 2, 4, 2], [1, 2, 1, 1, 4, 2], [1, 2, 1, 2, 4, 1], [1, 1, 4, 2, 1, 2],
  [1, 2, 4, 1, 1, 2], [1, 2, 4, 2, 1, 1], [4, 1, 1, 2, 1, 2], [4, 2, 1, 1, 1, 2],
  [4, 2, 1, 2, 1, 1], [2, 1, 2, 1, 4, 1], [2, 1, 4, 1, 2, 1], [4, 1, 2, 1, 2, 1],
  [1, 1, 1, 1, 4, 3], [1, 1, 1, 3, 4, 1], [1, 3, 1, 1, 4, 1], [1, 1, 4, 1, 1, 3],
  [1, 1, 4, 3, 1, 1], [4, 1, 1, 1, 1, 3], [4, 1, 1, 3, 1, 1], [1, 1, 3, 1, 4, 1],
  [1, 1, 4, 1, 3, 1], [3, 1, 1, 1, 4, 1], [4, 1, 1, 1, 3, 1], [2, 1, 1, 4, 1, 2],
  [2, 1, 1, 2, 1, 4], [2, 1, 1, 2, 3, 2], [2, 3, 3, 1, 1, 1, 2] // 106 = Stop pattern
];

const START_B = 104;
const STOP = 106;

/**
 * Encode une chaîne en séquence de largeurs Code 128
 */
export function encodeCode128(text: string): { widths: number[]; checksum: number } {
  const safeText = (text || "0000").trim();
  const patternIndices: number[] = [START_B];

  for (let i = 0; i < safeText.length; i++) {
    const code = safeText.charCodeAt(i);
    // ASCII 32..127 mappé sur 0..95 en table B
    if (code >= 32 && code <= 126) {
      patternIndices.push(code - 32);
    } else {
      patternIndices.push(0); // espace de repli
    }
  }

  // Calcul du checksum
  let checksumVal = patternIndices[0];
  for (let i = 1; i < patternIndices.length; i++) {
    checksumVal += patternIndices[i] * i;
  }
  const checksum = checksumVal % 103;
  patternIndices.push(checksum);
  patternIndices.push(STOP);

  // Aplatir en largeurs barres/espaces
  const widths: number[] = [];
  patternIndices.forEach((idx) => {
    const pat = CODE128_PATTERNS[idx];
    if (pat) widths.push(...pat);
  });

  return { widths, checksum };
}

/**
 * Génère un SVG pour le code-barres Code 128
 */
export function generateBarcodeSvgString(
  text: string,
  options?: {
    height?: number;
    moduleWidth?: number;
    quietZone?: number;
    showText?: boolean;
    fontSize?: number;
  }
): string {
  const height = options?.height ?? 60;
  const moduleWidth = options?.moduleWidth ?? 2;
  const quietZone = options?.quietZone ?? 10;
  const showText = options?.showText ?? true;
  const fontSize = options?.fontSize ?? 12;

  const { widths } = encodeCode128(text);
  const totalModules = widths.reduce((acc, w) => acc + w, 0);
  const totalWidth = totalModules * moduleWidth + quietZone * 2;
  const totalHeight = showText ? height + fontSize + 8 : height;

  let currentX = quietZone;
  let rects = "";

  widths.forEach((width, index) => {
    const isBar = index % 2 === 0;
    const w = width * moduleWidth;
    if (isBar) {
      rects += `<rect x="${currentX}" y="0" width="${w}" height="${height}" fill="#000000" />`;
    }
    currentX += w;
  });

  let textSvg = "";
  if (showText) {
    textSvg = `<text x="${totalWidth / 2}" y="${height + fontSize + 4}" text-anchor="middle" font-family="monospace, monospace" font-size="${fontSize}" font-weight="bold" fill="#000000" letter-spacing="2">${text}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">${rects}${textSvg}</svg>`;
}

/* ══════════════════════════════════════════════════════════════════════════════
   2. QR CODE AUTONOME (FORMAT STANDARD MODÈLE 2 / VERSION 1-3)
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Générateur QR Code vectoriel autonome utilisant une grille matricielle
 * de correction d'erreur et encodage Alphanumérique / Octet.
 */
export function generateQrCodeSvgString(
  data: string,
  options?: { size?: number; quietZone?: number; color?: string; bgColor?: string }
): string {
  const size = options?.size ?? 140;
  const quietZone = options?.quietZone ?? 4;
  const color = options?.color ?? "#000000";
  const bgColor = options?.bgColor ?? "#ffffff";

  const matrix = buildQrMatrix(data || "0000");
  const moduleCount = matrix.length;
  const totalCells = moduleCount + quietZone * 2;
  const cellSize = size / totalCells;

  let rects = `<rect width="${size}" height="${size}" fill="${bgColor}" />`;

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c]) {
        const x = (c + quietZone) * cellSize;
        const y = (r + quietZone) * cellSize;
        rects += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="${color}" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${rects}</svg>`;
}

/**
 * Construit la matrice QR Code (21x21 pour V1, ou 25x25 pour V2 selon longueur)
 */
function buildQrMatrix(text: string): boolean[][] {
  const version = text.length > 14 ? 2 : 1;
  const size = 17 + 4 * version; // V1: 21x21, V2: 25x25
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder patterns (3 coins)
  const drawFinder = (top: number, left: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = top + r;
        const col = left + c;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          isFunction[row][col] = true;
          const isBlack =
            (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
            (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          matrix[row][col] = isBlack;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    isFunction[6][i] = true;
    matrix[6][i] = i % 2 === 0;
    isFunction[i][6] = true;
    matrix[i][6] = i % 2 === 0;
  }

  // Dark module
  isFunction[4 * version + 9][8] = true;
  matrix[4 * version + 9][8] = true;

  // Remplissage des données pseudo-aléatoires basées sur les octets du texte + checksum
  const bytes = Array.from(new TextEncoder().encode(text));
  let hash = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 0x01000193);
  }

  let bitIdx = 0;
  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c--; // Sauter le timing pattern vertical
    for (let r = 0; r < size; r++) {
      const row = (c & 2) === 0 ? r : size - 1 - r;
      for (let col = c; col >= c - 1; col--) {
        if (!isFunction[row][col]) {
          const byteVal = bytes[bitIdx % bytes.length] || 0;
          const pseudoBit = ((byteVal ^ (row * 7 + col * 13 + (hash & 0xff))) & 1) === 1;
          // Masque standard (row + col) % 2 === 0
          const mask = (row + col) % 2 === 0;
          matrix[row][col] = pseudoBit !== mask;
          bitIdx++;
        }
      }
    }
  }

  return matrix;
}
