"use client";

import Button from "@/components/ui/Button";
import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import AppLayout from "@/components/layouts/AppLayout";
import { TicketReceipt } from "@/components/ui/TicketReceipt";
import { useToast } from "@/contexts/ToastContext";
import ProductService, { Product } from "@/services/product.service";
import CategoryService, { Category } from "@/services/category.service";
import ShopService, { Shop } from "@/services/shop.service";
import CustomerService, { Customer } from "@/services/customer.service";
import SaleService from "@/services/sale.service";
import CashSessionService from "@/services/super/cashSession.service";
import { CashSession } from "@/types/super";
import { useAuth } from "@/hooks/useAuth";

/* ─────────────────────────────────────────────────────────
   ICÔNES INLINE  (lucide-react reste disponible si besoin)
───────────────────────────────────────────────────────── */
import {
  ShoppingCart, Search, Plus, Minus, CheckCircle2,
  Smartphone, Banknote, Wallet, User, X, LayoutGrid,
  List, Apple, Droplets, ShoppingBag, Package,
  ChevronUp, Scissors, RefreshCw, Trash2,
  Clock, Pause
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   STYLES GLOBAUX — injectés une seule fois côté client
───────────────────────────────────────────────────────── */
const POS_STYLES = `
/* ── Variables ── */
.pos-root {
  --pos-bg: #F0F4FA;
  --pos-surface: #FFFFFF;
  --pos-surface2: #E8EFF8;
  --pos-border: #D0DBF0;
  --pos-text: #0F1E3D;
  --pos-text2: #4A5A7A;
  --pos-text3: #8A9BBD;
  --pos-accent: #2563EB;
  --pos-primary: #1E3A8A;
  --pos-success: #2D7A4F;
  --pos-success-bg: #EAF5EE;
  --pos-success-border: #A5D6BA;
  --pos-warn: #C07A1A;
  --pos-warn-bg: #FDF5E6;
  --pos-warn-border: #E8C87A;
  --pos-danger: #C0392B;
  --pos-danger-bg: #FDECEA;
  --cart-bg: #0F1E3D;
  --cart-surface: #162545;
  --cart-surface2: #1E3060;
  --cart-border: #2A4480;
  --cart-text: #EEF2FF;
  --cart-text2: #7B93C8;
  font-family: 'IBM Plex Sans', system-ui, sans-serif;
}

/* ── Layout ── */
.pos-layout {
  display: grid;
  grid-template-columns: 200px 1fr 390px;
  height: calc(100vh - 64px);
  gap: 0;
  overflow: hidden;
  background: var(--pos-bg);
}

/* ── Sidebar catégories (desktop) ── */
.pos-sidebar {
  background: var(--pos-surface);
  border-right: 1px solid var(--pos-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.pos-sidebar-logo {
  padding: 14px 16px;
  border-bottom: 1px solid var(--pos-border);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--pos-text);
  display: flex;
  align-items: center;
  gap: 8px;
}
.pos-sidebar-logo svg { color: var(--pos-accent); }
.pos-sidebar-shop { font-size: 10px; color: var(--pos-text3); margin-top: 1px; font-weight: 400; text-transform: none; letter-spacing: 0; }
.pos-cats-list { flex: 1; overflow-y: auto; padding: 8px; }
.pos-cat-btn {
  width: 100%; padding: 9px 12px; border: none; background: transparent;
  color: var(--pos-text2); font-size: 11px; font-weight: 700; text-align: left;
  cursor: pointer; border-radius: 8px; display: flex; align-items: center; gap: 8px;
  transition: all .15s; letter-spacing: .04em; text-transform: uppercase;
}
.pos-cat-btn svg { flex-shrink: 0; opacity: .7; }
.pos-cat-btn:hover { background: var(--pos-surface2); color: var(--pos-text); }
.pos-cat-btn.active { background: var(--pos-primary); color: #fff; }
.pos-cat-btn.active svg { opacity: 1; }
.pos-cat-count { margin-left: auto; font-size: 10px; opacity: .55; }
.pos-session-bar { padding: 12px; border-top: 1px solid var(--pos-border); }
.pos-session-open {
  background: var(--pos-success-bg); border: 1px solid var(--pos-success-border);
  border-radius: 8px; padding: 8px 10px; font-size: 11px; color: var(--pos-success);
  display: flex; flex-direction: column; gap: 4px;
}
.pos-session-closed {
  background: var(--pos-warn-bg); border: 1px solid var(--pos-warn-border);
  border-radius: 8px; padding: 8px 10px; font-size: 11px; color: var(--pos-warn);
}
.pos-session-dot {
  width: 7px; height: 7px; border-radius: 50%; background: currentColor;
  display: inline-block; margin-right: 6px;
  animation: pos-pulse 1.5s infinite;
}
@keyframes pos-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

/* ── Catalogue ── */
.pos-catalog {
  display: flex; flex-direction: column; overflow: hidden; background: var(--pos-bg);
}
.pos-catalog-header {
  padding: 14px 16px; display: flex; gap: 10px;
  background: var(--pos-surface); border-bottom: 1px solid var(--pos-border);
}
.pos-search-wrap { flex: 1; position: relative; }
.pos-search-wrap svg {
  position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
  color: var(--pos-text3); pointer-events: none; width: 16px; height: 16px;
}
.pos-search {
  width: 100%; padding: 9px 12px 9px 34px; border: 1px solid var(--pos-border);
  border-radius: 10px; font-size: 13px; background: var(--pos-surface);
  color: var(--pos-text); outline: none; transition: border-color .15s;
  font-family: inherit;
}
.pos-search:focus { border-color: var(--pos-primary); }
.pos-view-toggle {
  display: flex; background: var(--pos-surface2); border-radius: 10px;
  padding: 3px; gap: 2px;
}
.pos-view-btn {
  width: 34px; height: 34px; border: none; background: transparent;
  border-radius: 7px; cursor: pointer; color: var(--pos-text3);
  display: flex; align-items: center; justify-content: center;
  transition: all .15s;
}
.pos-view-btn.active { background: var(--pos-surface); color: var(--pos-text); }
.pos-products-wrap { flex: 1; overflow-y: auto; padding: 14px; }
.pos-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}
.pos-product-list { display: flex; flex-direction: column; gap: 6px; }

/* Carte produit (grid) */
.pos-prod-card {
  background: var(--pos-surface); border: 1px solid var(--pos-border);
  border-radius: 12px; padding: 14px 12px; cursor: pointer;
  transition: all .15s; position: relative; overflow: hidden;
  display: flex; flex-direction: column; gap: 5px; user-select: none;
  text-align: left;
}
.pos-prod-card:hover {
  border-color: #B8B4AA; transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0,0,0,.06);
}
.pos-prod-card:active { transform: scale(.97); }
.pos-prod-card.no-stock { opacity: .4; cursor: not-allowed; }
.pos-prod-card.no-stock:hover { transform: none; box-shadow: none; }
.pos-prod-cat { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--pos-text3); }
.pos-prod-name { font-size: 12px; font-weight: 600; color: var(--pos-text); line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.pos-prod-price { font-size: 15px; font-weight: 700; color: var(--pos-accent); margin-top: auto; font-variant-numeric: tabular-nums; }
.pos-prod-price small { font-size: 9px; font-weight: 400; color: var(--pos-text3); }
.pos-prod-stock { font-size: 10px; color: var(--pos-text3); }
.pos-prod-stock.low { color: var(--pos-danger); }
.pos-in-cart-badge {
  position: absolute; top: -1px; right: -1px;
  background: var(--pos-accent); color: #fff;
  font-size: 10px; font-weight: 700;
  width: 22px; height: 22px;
  border-radius: 0 11px 0 11px;
  display: flex; align-items: center; justify-content: center;
}

/* Ligne produit (list) */
.pos-prod-row {
  background: var(--pos-surface); border: 1px solid var(--pos-border);
  border-radius: 10px; padding: 10px 14px; cursor: pointer;
  display: flex; align-items: center; gap: 12px;
  transition: all .15s; user-select: none;
}
.pos-prod-row:hover { border-color: #B8B4AA; background: var(--pos-surface2); }
.pos-prod-row:active { transform: scale(.99); }
.pos-prod-row.no-stock { opacity: .4; cursor: not-allowed; }
.pos-prod-row-info { flex: 1; min-width: 0; }
.pos-prod-row-name { font-size: 13px; font-weight: 600; color: var(--pos-text); }
.pos-prod-row-sub { font-size: 11px; color: var(--pos-text3); margin-top: 1px; }
.pos-prod-row-price { font-size: 14px; font-weight: 700; color: var(--pos-accent); white-space: nowrap; font-variant-numeric: tabular-nums; }
.pos-prod-row-stock { font-size: 11px; color: var(--pos-text3); min-width: 48px; text-align: right; }
.pos-prod-row-stock.low { color: var(--pos-danger); }
.pos-prod-row-qty-badge { font-size: 11px; font-weight: 700; color: var(--pos-accent); min-width: 22px; text-align: center; }
.pos-row-add-btn {
  width: 30px; height: 30px; border: 1px solid var(--pos-border);
  border-radius: 8px; background: transparent; cursor: pointer;
  color: var(--pos-text); display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all .15s;
}
.pos-row-add-btn:hover { background: var(--pos-primary); color: #fff; border-color: var(--pos-primary); }

/* ── Panneau Panier ── */
.pos-cart {
  background: var(--cart-bg); color: var(--cart-text);
  display: flex; flex-direction: column; overflow: hidden;
}
.pos-cart-head {
  padding: 14px 20px; border-bottom: 1px solid var(--cart-border);
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0;
}
.pos-cart-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: var(--cart-text2); display: flex; align-items: center; gap: 8px; }
.pos-cart-badge { background: var(--pos-accent); color: #fff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
.pos-cart-clear-btn { background: transparent; border: none; color: var(--cart-text2); font-size: 11px; cursor: pointer; letter-spacing: .05em; text-transform: uppercase; font-weight: 600; transition: color .15s; }
.pos-cart-clear-btn:hover { color: var(--pos-danger); }

/* Client */
.pos-cust-wrap { padding: 10px 20px; border-bottom: 1px solid var(--cart-border); flex-shrink: 0; }
.pos-cust-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--cart-text2); margin-bottom: 6px; }
.pos-cust-select {
  width: 100%; background: var(--cart-surface2); border: 1px solid var(--cart-border);
  color: var(--cart-text); border-radius: 8px; padding: 8px 10px;
  font-size: 12px; outline: none; cursor: pointer; font-family: inherit;
}
.pos-cust-selected {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; background: rgba(232,93,43,.1);
  border: 1px solid rgba(232,93,43,.3); border-radius: 8px;
}
.pos-cust-name { font-size: 12px; font-weight: 600; color: var(--pos-accent); display: flex; align-items: center; gap: 6px; }
.pos-cust-clear { background: transparent; border: none; color: var(--cart-text2); cursor: pointer; display: flex; align-items: center; }
.pos-cust-clear:hover { color: var(--pos-danger); }

/* Articles panier */
.pos-cart-items { flex: 1; overflow-y: auto; padding: 0 20px; }
.pos-cart-empty {
  height: 100%; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
  opacity: .3; padding: 40px 0;
}
.pos-cart-empty p { font-size: 10px; text-transform: uppercase; letter-spacing: .1em; font-weight: 700; }

/* Ligne article panier — style caisse supermarché */
.pos-ci {
  padding: 11px 0;
  border-bottom: 1px solid var(--cart-border);
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 3px 12px;
}
.pos-ci:last-child { border-bottom: none; }
.pos-ci-name { font-size: 13px; font-weight: 600; color: var(--cart-text); line-height: 1.3; grid-column: 1; grid-row: 1; }
.pos-ci-meta { font-size: 11px; color: var(--cart-text2); grid-column: 1; grid-row: 2; display: flex; align-items: center; gap: 6px; font-variant-numeric: tabular-nums; }
.pos-ci-controls { grid-column: 2; grid-row: 1 / 3; display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; gap: 6px; }
.pos-ci-total { font-size: 15px; font-weight: 700; color: var(--cart-text); white-space: nowrap; font-variant-numeric: tabular-nums; }
.pos-ci-qty-row { display: flex; align-items: center; gap: 4px; }
.pos-ci-btn {
  width: 26px; height: 26px; border: 1px solid var(--cart-border);
  background: var(--cart-surface2); color: var(--cart-text);
  border-radius: 6px; cursor: pointer; display: flex; align-items: center;
  justify-content: center; transition: all .15s; flex-shrink: 0;
}
.pos-ci-btn:hover { background: var(--cart-surface); border-color: #6B6960; }
.pos-ci-btn.del:hover { background: var(--pos-danger); border-color: var(--pos-danger); color: #fff; }
.pos-ci-qty {
  font-size: 12px; font-weight: 700; color: var(--cart-text);
  min-width: 26px; text-align: center;
  background: var(--cart-surface); border: 1px solid var(--cart-border);
  border-radius: 6px; padding: 2px 4px; font-variant-numeric: tabular-nums;
}

/* Totaux */
.pos-totals { padding: 14px 20px; border-top: 1px solid var(--cart-border); display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
.pos-tot-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--cart-text2); }
.pos-tot-val { font-variant-numeric: tabular-nums; font-weight: 600; }
.pos-discount-row { display: flex; align-items: center; gap: 8px; }
.pos-discount-row label { font-size: 11px; color: var(--cart-text2); font-weight: 600; text-transform: uppercase; letter-spacing: .06em; flex: 1; display: flex; align-items: center; gap: 5px; }
.pos-discount-input {
  background: var(--cart-surface2); border: 1px solid var(--cart-border);
  color: #EF9F27; font-size: 13px; font-weight: 700; border-radius: 6px;
  padding: 5px 8px; width: 110px; text-align: right; outline: none;
  transition: border-color .15s; font-variant-numeric: tabular-nums;
  font-family: 'IBM Plex Mono', monospace;
}
.pos-discount-input:focus { border-color: #EF9F27; }
.pos-discount-unit { font-size: 11px; color: var(--cart-text2); font-weight: 600; }
.pos-tot-main {
  display: flex; justify-content: space-between; align-items: baseline;
  padding-top: 10px; border-top: 1px solid var(--cart-border);
}
.pos-tot-main-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: var(--cart-text2); }
.pos-tot-main-val { font-size: 24px; font-weight: 700; color: var(--cart-text); font-variant-numeric: tabular-nums; }

/* Paiement */
.pos-payment { padding: 14px 20px; border-top: 1px solid var(--cart-border); display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
.pos-pay-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--cart-text2); }
.pos-pay-methods { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.pos-pay-btn {
  padding: 10px; border: 1px solid var(--cart-border);
  background: var(--cart-surface2); color: var(--cart-text2);
  border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .06em;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: all .15s; font-family: inherit;
}
.pos-pay-btn:hover { border-color: #6B6960; color: var(--cart-text); }
.pos-pay-btn.active { background: var(--pos-surface); color: var(--pos-primary); border-color: var(--pos-surface); }
.pos-cash-wrap { display: flex; flex-direction: column; gap: 6px; }
.pos-cash-input {
  background: var(--cart-surface2); border: 1px solid var(--cart-border);
  color: var(--cart-text); font-size: 15px; font-weight: 700;
  border-radius: 8px; padding: 10px 12px; width: 100%; outline: none;
  transition: border-color .15s; font-family: 'IBM Plex Mono', monospace;
}
.pos-cash-input:focus { border-color: #6B6960; }
.pos-cash-input::placeholder { color: var(--cart-text2); font-weight: 400; font-size: 13px; font-family: inherit; }
.pos-change-row {
  background: #0F2D5A; border: 1px solid #2A5298; border-radius: 8px;
  padding: 9px 12px; display: flex; justify-content: space-between; align-items: center;
}
.pos-change-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #7EB3FF; }
.pos-change-val { font-size: 16px; font-weight: 700; color: #7EB3FF; font-variant-numeric: tabular-nums; }
.pos-mobile-ops { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.pos-mobile-op {
  padding: 9px; border: 1px solid var(--cart-border);
  background: var(--cart-surface2); color: var(--cart-text2);
  border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 700;
  letter-spacing: .04em; transition: all .15s; text-align: center; font-family: inherit;
}
.pos-mobile-op:hover, .pos-mobile-op.active { background: var(--cart-surface); color: var(--cart-text); border-color: #6B6960; }

.pos-checkout-btn {
  width: 100%; padding: 15px; background: var(--pos-accent); color: #fff;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all .15s; font-family: inherit;
}
.pos-checkout-btn:hover:not(:disabled) { background: #1D4ED8; transform: translateY(-1px); }
.pos-checkout-btn:active:not(:disabled) { transform: scale(.98); }
.pos-checkout-btn:disabled { opacity: .35; cursor: not-allowed; }

/* Session banner */
.pos-session-banner {
  padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;
  border-radius: 10px; margin-bottom: 12px; font-size: 12px;
}
.pos-session-open-banner { background: var(--pos-success-bg); border: 1px solid var(--pos-success-border); color: var(--pos-success); }
.pos-session-closed-banner { background: var(--pos-warn-bg); border: 1px solid var(--pos-warn-border); color: var(--pos-warn); }
.pos-session-input {
  padding: 8px 10px; border-radius: 8px; border: 1px solid var(--pos-warn-border);
  background: var(--pos-surface); font-size: 13px; font-weight: 600;
  outline: none; width: 140px; font-family: inherit;
}
.pos-session-btn {
  padding: 8px 14px; background: var(--pos-primary); color: #fff; border: none;
  border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer;
  font-family: inherit; text-transform: uppercase; letter-spacing: .06em;
  transition: background .15s;
}
.pos-session-btn:hover { background: #3A3835; }
.pos-session-btn:disabled { opacity: .5; cursor: not-allowed; }
.pos-close-session-btn {
  padding: 6px 12px; background: rgba(192,57,43,.1);
  border: 1px solid rgba(192,57,43,.3); color: var(--pos-danger);
  border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer;
  font-family: inherit; text-transform: uppercase; letter-spacing: .06em;
  transition: all .15s;
}
.pos-close-session-btn:hover { background: rgba(192,57,43,.2); }

/* ── Mobile header fixe (search + cats) ── */
.pos-mobile-header { display: none; }
.pos-mobile-search-wrap { position: relative; }
.pos-mobile-search-wrap svg {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  color: var(--pos-text3); pointer-events: none; width: 17px; height: 17px;
}
.pos-mobile-search {
  width: 100%; padding: 11px 14px 11px 38px;
  border: 1.5px solid var(--pos-border); border-radius: 12px;
  font-size: 14px; background: var(--pos-surface);
  color: var(--pos-text); outline: none; transition: border-color .15s;
  font-family: inherit;
}
.pos-mobile-search:focus { border-color: var(--pos-accent); }
.pos-mobile-cats {
  display: flex; gap: 7px; overflow-x: auto; padding-bottom: 2px;
  scrollbar-width: none;
}
.pos-mobile-cats::-webkit-scrollbar { display: none; }
.pos-mob-cat {
  padding: 7px 14px; border: 1.5px solid var(--pos-border);
  background: var(--pos-surface); border-radius: 20px;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; color: var(--pos-text2); cursor: pointer;
  white-space: nowrap; transition: all .15s; flex-shrink: 0;
  font-family: inherit;
}
.pos-mob-cat.active {
  background: var(--pos-accent); color: #fff; border-color: var(--pos-accent);
}

/* ── Mobile ── */
@media (max-width: 1024px) {
  .pos-layout { grid-template-columns: 1fr; grid-template-rows: 1fr; }
  .pos-sidebar { display: none; }
  .pos-cart { display: none; }
}
@media (max-width: 768px) {
  .pos-catalog-header { display: none; }
  .pos-mobile-header {
    display: flex; flex-direction: column; gap: 10px;
    padding: 10px 12px 8px;
    background: var(--pos-surface);
    border-bottom: 1px solid var(--pos-border);
    position: sticky; top: 0; z-index: 10;
  }
  .pos-products-wrap { padding: 10px 10px 80px; }
  .pos-product-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
}

/* Scrollbar fine */
.pos-catalog *::-webkit-scrollbar,
.pos-cart *::-webkit-scrollbar { width: 3px; }
.pos-catalog *::-webkit-scrollbar-track,
.pos-cart *::-webkit-scrollbar-track { background: transparent; }
.pos-catalog *::-webkit-scrollbar-thumb,
.pos-cart *::-webkit-scrollbar-thumb { background: var(--pos-border); border-radius: 4px; }
`;

/* ─────────────────────────────────────────────────────────
   UTILITAIRES
───────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(n));

const CAT_ICONS: Record<string, React.ReactNode> = {
  default: <Package size={14} />,
};

interface CartItem {
  product: Product;
  quantity: number;
}

/* ─────────────────────────────────────────────────────────
   COMPOSANT PRINCIPAL
───────────────────────────────────────────────────────── */
export default function SuperCaissePage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const componentRef = useRef<HTMLDivElement>(null);
// États pour les paniers en attente
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingCarts, setPendingCarts] = useState<{ id: string; name: string; items: CartItem[]; timestamp: string; total: number }[]>(() => {
    try {
      const saved = localStorage.getItem("super_pending_carts");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  /* Données */
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  /* Session de caisse */
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [openingBalance, setOpeningBalance] = useState("");
  const [isOpeningSession, setIsOpeningSession] = useState(false);

  /* UI catalogue */
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  /* Panier */
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  /* Paiement */
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOBILE_MONEY">("CASH");
  const [mobileProvider, setMobileProvider] = useState<"ORANGE" | "MTN" | "WAVE">("WAVE");
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<string>("");

  /* Mobile drawer */
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  /* Inject styles */
  useEffect(() => {
    if (document.getElementById("pos-styles")) return;
    const s = document.createElement("style");
    s.id = "pos-styles";
    s.textContent = POS_STYLES;
    document.head.appendChild(s);
    return () => { document.getElementById("pos-styles")?.remove(); };
  }, []);

  /* ── Chargement données ── */
  const loadData = async () => {
    if (!user) return;
    if (!user.shopId) {
      showToast("Erreur: compte non associé à une boutique.", "error");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let prodRes;
      try {
        prodRes = await ProductService.getAll({ shopId: user.shopId, limit: 200 });
      } catch (err) {
        console.warn("Retrying ProductService.getAll without limit due to backend error:", err);
        prodRes = await ProductService.getAll({ shopId: user.shopId });
      }

      let catRes;
      try {
        catRes = await CategoryService.getAll({ limit: 200 });
      } catch (err) {
        console.warn("Retrying CategoryService.getAll without limit due to backend error:", err);
        catRes = await CategoryService.getAll();
      }

      const [shopRes, custRes] = await Promise.all([
        user.shopId
          ? ShopService.getById(user.shopId)
          : ShopService.getAll().then((r) => r.data?.[0] || r?.[0]),
        CustomerService.getAll(),
      ]);

      const toList = (r: any) =>
        r?.data && Array.isArray(r.data) ? r.data : Array.isArray(r) ? r : [];

      setProducts(toList(prodRes));
      setCategories(toList(catRes));
      setCustomers(toList(custRes));
      setCurrentShop(shopRes);

      if (user?.id) {
        try { setCashSession(await CashSessionService.getActive(user.id)); }
        catch { setCashSession(null); }
      }
    } catch {
      showToast("Erreur lors du chargement des données", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  /* ── Session ── */
  const handleOpenSession = async () => {
    if (!user?.id) return;
    const targetShopId = user.shopId || currentShop?.id;
    if (!targetShopId) { showToast("Aucun point de vente associé", "error"); return; }
    setIsOpeningSession(true);
    try {
      const session = await CashSessionService.open({
        shopId: targetShopId,
        userId: user.id,
        openingBalance: parseFloat(openingBalance) || 0,
        notes: `Session ouverte par ${user.name}`,
      });
      setCashSession(session);
      showToast(`Caisse ouverte — ${fmt(parseFloat(openingBalance) || 0)} XOF`, "success");
    } catch (e: any) {
      showToast(e?.response?.status === 409 ? "Session déjà active" : "Erreur ouverture", "error");
    } finally { setIsOpeningSession(false); }
  };

  const handleCloseSession = async () => {
    if (!cashSession) return;
    const s = prompt("Montant réel compté en caisse (XOF) :");
    if (!s) return;
    try {
      await CashSessionService.close(cashSession.id, {
        closingBalance: parseFloat(s) || 0,
        notes: `Session fermée par ${user?.name}`,
      });
      setCashSession(null);
      showToast(`Caisse fermée — ${fmt(parseFloat(s) || 0)} XOF déclarés`, "success");
    } catch { showToast("Erreur lors de la fermeture", "error"); }
  };

  /* ── Panier ── */
  const addToCart = (product: Product) => {
    if (product.stockQty <= 0) { showToast("Stock épuisé", "error"); return; }
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id);
      if (ex) {
        if (ex.quantity >= product.stockQty) { showToast("Limite de stock atteinte", "error"); return prev; }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const nq = item.quantity + delta;
        if (nq > item.product.stockQty) { showToast("Stock insuffisant", "error"); return item; }
        return { ...item, quantity: nq };
      }).filter((i) => i.quantity > 0)
    );
  };

  /* ── Calculs ── */
  const subtotal = cart.reduce((s, i) => s + i.product.sellingPrice * i.quantity, 0);
  const discAmt = Math.max(0, Math.min(subtotal, discountAmount));
  const total = subtotal - discAmt;
  const received = parseFloat(amountReceived) || 0;
  const change = Math.max(0, received - total);

  const inCart = (id: string) => cart.find((i) => i.product.id === id);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  /* ── Filtrage ── */
  const filteredProducts = products.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.barcode?.includes(q) || p.sku?.toLowerCase().includes(q);
    const matchC = !selectedCategory || p.categoryId === selectedCategory;
    return matchQ && matchC;
  });

  /* ── Print & Checkout ── */
  const handlePrint = useReactToPrint({ contentRef: componentRef, documentTitle: `Ticket_${lastSaleId}` });

  const handleCheckout = async () => {
    if (cart.length === 0) return showToast("Panier vide", "error");
    if (!user?.shopId) return showToast("Boutique non identifiée", "error");
    setIsProcessing(true);
    try {
      const res = await SaleService.create({
        shopId: user.shopId,
        userId: user.id,
        customerId: selectedCustomer?.id || undefined,
        cashSessionId: cashSession?.id || undefined,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPrice: i.product.sellingPrice,
          discount: 0,
        })),
        payments: [{
          method: paymentMethod,
          amount: total,
          reference: paymentMethod === "MOBILE_MONEY" ? `${mobileProvider}_${Date.now()}` : undefined,
        }],
        discountAmount: discAmt,
        notes: `Vente par ${user.name}`,
      } as any);
      setLastSaleId(res.id);
      showToast("Vente validée !", "success");
      setTimeout(() => {
        handlePrint();
        setCart([]);
        setAmountReceived("");
        setSelectedCustomer(null);
        setDiscountAmount(0);
        setMobileCartOpen(false);
        loadData();
      }, 300);
    } catch (e) {
      console.error(e);
      showToast("Erreur lors de la vente. Vérifiez les stocks.", "error");
    } finally { setIsProcessing(false); }
  };


  const handlePutOnHold = () => {
    if (cart.length === 0) { showToast("Le panier est vide !", "error"); return; }
    const name = prompt("Nom ou note pour ce panier :", `Client #${pendingCarts.length + 1}`);
    if (name === null) return;
    const nameVal = name.trim() || `Client #${pendingCarts.length + 1}`;
    const newPending = {
      id: Math.random().toString(36).slice(-6),
      name: nameVal,
      items: [...cart],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      total,
    };
    const updated = [newPending, ...pendingCarts];
    setPendingCarts(updated);
    localStorage.setItem("super_pending_carts", JSON.stringify(updated));
    setCart([]);
    showToast(`Panier de "${nameVal}" mis en attente.`, "success");
  };

  const handleRestoreCart = (item: { id: string; name: string; items: CartItem[]; total: number }) => {
    setCart(item.items);
    const updated = pendingCarts.filter((c) => c.id !== item.id);
    setPendingCarts(updated);
    localStorage.setItem("super_pending_carts", JSON.stringify(updated));
    setShowPendingModal(false);
    showToast(`Panier de "${item.name}" restauré !`, "success");
  };

  const handleDeletePendingCart = (id: string, name: string) => {
    const updated = pendingCarts.filter((c) => c.id !== id);
    setPendingCarts(updated);
    localStorage.setItem("super_pending_carts", JSON.stringify(updated));
    showToast(`Panier de "${name}" supprimé.`, "success");
  };
  /* ────────────────────────────────────────────────────────
     RENDU
  ──────────────────────────────────────────────────────── */
  return (
    <AppLayout title="Point de Vente" subtitle={currentShop?.name || "Caisse"}>
      <div className="pos-root">

        {/* ── Bannière session ── */}
        {!cashSession ? (
          <div className="pos-session-banner pos-session-closed-banner">
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
              <Wallet size={16} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 12 }}>Ouvrir la caisse</div>
                <div style={{ fontSize: 11, opacity: .75 }}>Déclarez votre fond initial avant de vendre</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number"
                placeholder="Fond initial (XOF)"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="pos-session-input"
              />
              <button
                className="pos-session-btn"
                onClick={handleOpenSession}
                disabled={isOpeningSession}
              >
                {isOpeningSession ? "…" : "Ouvrir"}
              </button>
            </div>
          </div>
        ) : (
          <div className="pos-session-banner pos-session-open-banner">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="pos-session-dot" />
              <span style={{ fontWeight: 700 }}>
                Caisse ouverte — Fond : {fmt(cashSession.openingBalance)} XOF
              </span>
            </div>
            <button className="pos-close-session-btn" onClick={handleCloseSession}>
              Fermer la caisse
            </button>
          </div>
        )}

        {/* ── Layout principal ── */}
        <div className="pos-layout">

          {/* ────── SIDEBAR CATÉGORIES (desktop) ────── */}
          <aside className="pos-sidebar">
            <div className="pos-sidebar-logo">
              <ShoppingBag size={18} />
              <div>
                GestShop
                <div className="pos-sidebar-shop">{currentShop?.name || "Boutique"}</div>
              </div>
            </div>

            <div className="pos-cats-list">
              {/* Bouton "Tous" */}
              <button
                className={`pos-cat-btn ${!selectedCategory ? "active" : ""}`}
                onClick={() => setSelectedCategory(null)}
              >
                <LayoutGrid size={14} />
                Tous
                <span className="pos-cat-count">{products.length}</span>
              </button>

              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    className={`pos-cat-btn ${selectedCategory === cat.id ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <Package size={14} />
                    {cat.name}
                    <span className="pos-cat-count">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="pos-session-bar">
              {cashSession ? (
                <div className="pos-session-open">
                  <span><span className="pos-session-dot" />Session active</span>
                  <span style={{ fontSize: 10, opacity: .7 }}>{fmt(cashSession.openingBalance)} XOF</span>
                </div>
              ) : (
                <div className="pos-session-closed">⚠ Caisse fermée</div>
              )}
            </div>
          </aside>

          {/* ────── CATALOGUE PRODUITS ────── */}
          <div className="pos-catalog">

            {/* ── Header mobile : search + catégories toujours visibles ── */}
            <div className="pos-mobile-header">
              <div className="pos-mobile-search-wrap">
                <Search />
                <input
                  className="pos-mobile-search"
                  type="text"
                  placeholder="Rechercher un produit…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="pos-mobile-cats">
                <button
                  className={`pos-mob-cat ${!selectedCategory ? "active" : ""}`}
                  onClick={() => setSelectedCategory(null)}
                >
                  Tous
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`pos-mob-cat ${selectedCategory === cat.id ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Header desktop */}
            <div className="pos-catalog-header">
              <div className="pos-search-wrap">
                <Search />
                <input
                  className="pos-search"
                  type="text"
                  placeholder="Nom, SKU, code-barre…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="pos-view-toggle">
                <button
                  className={`pos-view-btn ${viewMode === "grid" ? "active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Vue grille"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  className={`pos-view-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                  title="Vue liste"
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Produits */}
            <div className="pos-products-wrap">
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px", opacity: .5 }}>
                  <RefreshCw size={24} style={{ animation: "spin 1s linear infinite" }} />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", opacity: .4, fontSize: 13 }}>
                  Aucun produit trouvé
                </div>
              ) : viewMode === "grid" ? (
                /* ── VUE GRILLE ── */
                <div className="pos-product-grid">
                  {filteredProducts.map((p) => {
                    const ci = inCart(p.id);
                    const noStock = p.stockQty <= 0;
                    return (
                      <div
                        key={p.id}
                        className={`pos-prod-card ${noStock ? "no-stock" : ""}`}
                        onClick={() => !noStock && addToCart(p)}
                      >
                        {ci && <div className="pos-in-cart-badge">{ci.quantity}</div>}
                        <div className="pos-prod-cat">{p.category?.name || "—"}</div>
                        <div className="pos-prod-name">{p.name}</div>
                        <div className="pos-prod-price">
                          {fmt(p.sellingPrice)} <small>XOF</small>
                        </div>
                        <div className={`pos-prod-stock ${p.stockQty <= (p.minStockQty || 5) && p.stockQty > 0 ? "low" : ""}`}>
                          {noStock ? "Rupture de stock" : p.stockQty <= (p.minStockQty || 5) ? `⚠ ${p.stockQty} restants` : `${p.stockQty} en stock`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ── VUE LISTE ── */
                <div className="pos-product-list">
                  {filteredProducts.map((p) => {
                    const ci = inCart(p.id);
                    const noStock = p.stockQty <= 0;
                    return (
                      <div
                        key={p.id}
                        className={`pos-prod-row ${noStock ? "no-stock" : ""}`}
                        onClick={() => !noStock && addToCart(p)}
                      >
                        <div className="pos-prod-row-info">
                          <div className="pos-prod-row-name">{p.name}</div>
                          <div className="pos-prod-row-sub">{p.category?.name || "—"} · {p.sku || p.barcode || ""}</div>
                        </div>
                        {ci && <span className="pos-prod-row-qty-badge">{ci.quantity}×</span>}
                        <div className="pos-prod-row-price">{fmt(p.sellingPrice)} <small style={{ fontSize: 10, fontWeight: 400, color: "var(--pos-text3)" }}>XOF</small></div>
                        <div className={`pos-prod-row-stock ${p.stockQty <= (p.minStockQty || 5) && p.stockQty > 0 ? "low" : ""}`}>
                          {noStock ? "Rupture" : p.stockQty <= (p.minStockQty || 5) ? `⚠ ${p.stockQty}` : p.stockQty}
                        </div>
                        <button className="pos-row-add-btn" onClick={(e) => { e.stopPropagation(); if (!noStock) addToCart(p); }}>
                          <Plus size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ────── PANNEAU PANIER & PAIEMENT ────── */}
          <div
            className="pos-cart"
            style={{
              // Mobile: drawer en bas
              ...(typeof window !== "undefined" && window.innerWidth <= 1024
                ? {
                    display: "flex",
                    position: "fixed",
                    bottom: 0, left: 0, right: 0,
                    zIndex: 200,
                    maxHeight: "90dvh",
                    borderRadius: "20px 20px 0 0",
                    transform: mobileCartOpen ? "translateY(0)" : "translateY(100%)",
                    transition: "transform .3s cubic-bezier(.32,.72,0,1)",
                  }
                : {}),
            }}
          >
            {/* En-tête */}
            <div className="pos-cart-head">
              <div className="pos-cart-title">
                <ShoppingCart size={14} />
                Panier
                <span className="pos-cart-badge">{totalItems}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {pendingCarts.length > 0 && (
                  <button
                    onClick={() => setShowPendingModal(true)}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: "#7B93C8", background: "rgba(37,99,235,.12)", padding: "4px 8px", borderRadius: 8, border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: ".06em" }}
                  >
                    <Clock size={11} />
                    {pendingCarts.length} en attente
                  </button>
                )}
                {cart.length > 0 && (
                  <button
                    onClick={handlePutOnHold}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: "#7B93C8", background: "rgba(37,99,235,.12)", padding: "4px 8px", borderRadius: 8, border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: ".06em" }}
                  >
                    <Pause size={11} />
                    Attente
                  </button>
                )}
                <button className="pos-cart-clear-btn" onClick={() => setCart([])}>Vider</button>
              </div>
            </div>

            {/* Sélection client */}
            <div className="pos-cust-wrap">
              <div className="pos-cust-label">
                <User size={12} style={{ display: "inline", marginRight: 4, verticalAlign: -2 }} />
                Client
              </div>
              {selectedCustomer ? (
                <div className="pos-cust-selected">
                  <div className="pos-cust-name">
                    <User size={13} />
                    {selectedCustomer.name}
                  </div>
                  <button className="pos-cust-clear" onClick={() => setSelectedCustomer(null)}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <select
                  className="pos-cust-select"
                  onChange={(e) => setSelectedCustomer(customers.find((c) => c.id === e.target.value) || null)}
                  value=""
                >
                  <option value="">— Client de passage —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.phone ? ` (${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Articles */}
            <div className="pos-cart-items">
              {cart.length === 0 ? (
                <div className="pos-cart-empty">
                  <ShoppingCart size={36} />
                  <p>Panier vide</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="pos-ci">
                    <div className="pos-ci-name">{item.product.name}</div>
                    <div className="pos-ci-meta">
                      <span>{fmt(item.product.sellingPrice)} XOF</span>
                      <span>× {item.quantity}</span>
                    </div>
                    <div className="pos-ci-controls">
                      <div className="pos-ci-total">{fmt(item.product.sellingPrice * item.quantity)}</div>
                      <div className="pos-ci-qty-row">
                        <button
                          className="pos-ci-btn del"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus size={11} />
                        </button>
                        <span className="pos-ci-qty">{item.quantity}</span>
                        <button
                          className="pos-ci-btn"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Totaux */}
            <div className="pos-totals">
              <div className="pos-tot-row">
                <span>Sous-total</span>
                <span className="pos-tot-val">{fmt(subtotal)} XOF</span>
              </div>
              <div className="pos-tot-row pos-discount-row">
                <label>
                  <Scissors size={12} />
                  Remise
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    className="pos-discount-input"
                    type="number"
                    min={0}
                    max={subtotal}
                    placeholder="0"
                    value={discountAmount || ""}
                    onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                  <span className="pos-discount-unit">XOF</span>
                </div>
              </div>
              <div className="pos-tot-main">
                <span className="pos-tot-main-label">Total</span>
                <span className="pos-tot-main-val">{fmt(total)} XOF</span>
              </div>
            </div>
            {/* Paiement */}
            <div className="pos-payment">
              <div className="pos-pay-label">Mode de paiement</div>
              <div className="pos-pay-methods">
                <button
                  className={`pos-pay-btn ${paymentMethod === "CASH" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("CASH")}
                >
                  <Banknote size={16} />Espèces
                </button>
                <button
                  className={`pos-pay-btn ${paymentMethod === "MOBILE_MONEY" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("MOBILE_MONEY")}
                >
                  <Smartphone size={16} />Mobile
                </button>
              </div>
              {paymentMethod === "CASH" ? (
                <div className="pos-cash-wrap">
                  <input
                    className="pos-cash-input"
                    type="number"
                    placeholder="Montant reçu…"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                  />
                  {received > 0 && cart.length > 0 && (
                    <div className="pos-change-row">
                      <span className="pos-change-label">Monnaie à rendre</span>
                      <span className="pos-change-val">{fmt(change)} XOF</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pos-mobile-ops">
                  {(["WAVE", "ORANGE", "MTN"] as const).map((op) => (
                    <button
                      key={op}
                      className={`pos-mobile-op ${mobileProvider === op ? "active" : ""}`}
                      onClick={() => setMobileProvider(op)}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              )}

              <button
                className="pos-checkout-btn"
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing}
              >
                <CheckCircle2 size={18} />
                {isProcessing ? "Traitement…" : `Valider · ${fmt(total)} XOF`}
              </button>
            </div>
          </div>
        </div>

        {/* ────── BOUTON PANIER MOBILE (FAB) ────── */}
        <div
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            padding: "10px 16px",
            background: "var(--pos-surface)",
            borderTop: "1px solid var(--pos-border)",
            display: "flex", alignItems: "center", gap: 12,
            zIndex: 99,
          }}
          className="lg:hidden" // Tailwind : caché sur desktop
        >
          <span style={{ fontWeight: 700, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
            {fmt(total)} XOF
          </span>
          <button
            onClick={() => setMobileCartOpen((v) => !v)}
            style={{
              flex: 1, padding: "13px", background: "var(--pos-primary)",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 13, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: ".06em", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: "inherit",
            }}
          >
            <ShoppingCart size={18} />
            Panier
            <span style={{
              background: "var(--pos-accent)", color: "#fff", fontSize: 11,
              fontWeight: 700, padding: "2px 8px", borderRadius: 12,
            }}>
              {totalItems}
            </span>
            <ChevronUp size={16} style={{ marginLeft: 4, transform: mobileCartOpen ? "rotate(180deg)" : "none", transition: "transform .3s" }} />
          </button>
        </div>

        {/* Overlay mobile quand panier ouvert */}
        {mobileCartOpen && (
          <div
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
              zIndex: 199, backdropFilter: "blur(2px)",
            }}
            onClick={() => setMobileCartOpen(false)}
          />
        )}

        {/* Ticket caché pour impression */}
        <div style={{ display: "none" }}>
          <TicketReceipt
            ref={componentRef}
            shop={currentShop}
            user={user}
            items={cart}
            total={total}
            paymentMethod={paymentMethod}
            amountReceived={parseInt(amountReceived) || total}
            change={change}
            saleId={lastSaleId}
          />
        </div>
      </div>
      {/* Modal des Paniers en attente */}
      {showPendingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2.5">
                <Clock className="h-5 w-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">Paniers en attente</h3>
                  <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{pendingCarts.length} paniers suspendus</p>
                </div>
              </div>
              <button onClick={() => setShowPendingModal(false)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
            
            <div className="p-4 max-h-[360px] overflow-y-auto flex flex-col gap-2.5">
              {pendingCarts.map((item) => (
                <div key={item.id} className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-150/40 dark:border-zinc-800 flex justify-between items-center group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-zinc-800 dark:text-zinc-200 truncate">{item.name}</span>
                      <span className="text-[9px] font-bold text-zinc-400 bg-zinc-200/50 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{item.timestamp}</span>
                    </div>
                    <p className="text-[9px] font-bold text-zinc-400 mt-1">
                      {item.items.reduce((acc: number, it: CartItem) => acc + it.quantity, 0)} articles • {fmt(item.total)} XOF
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestoreCart(item)}
                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      Récupérer
                    </button>
                    <button
                      onClick={() => handleDeletePendingCart(item.id, item.name)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-xl transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {pendingCarts.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center opacity-30 text-center">
                  <Clock className="h-10 w-10 text-zinc-400 mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest">Aucun panier suspendu</p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-150 dark:border-zinc-800 flex justify-end">
              <Button onClick={() => setShowPendingModal(false)} variant="outline" size="sm" className="text-[10px] font-black tracking-widest uppercase">
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}