"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import QuincProductService from "@/services/quinc/product.service";
import QuincCategoryService from "@/services/quinc/category.service";
import QuincCustomerService from "@/services/quinc/customer.service";
import QuincCashSessionService from "@/services/quinc/cashSession.service";
import QuincSaleService from "@/services/quinc/sale.service";
import { Product, Category, Customer, CashSession } from "@/types/quinc";
import {
  ShoppingCart, Search, Plus, Minus, Trash2,
  Clock, Pause, X, LayoutGrid, List,
  Package, Banknote, Smartphone, CheckCircle2,
  Wallet, Scissors, User, ChevronUp, Wrench,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   STYLES POS (identiques au super, palette quincaillerie)
───────────────────────────────────────────────────────── */
const POS_STYLES = `
.qpos-root {
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
  --cart-bg: #0C1A30;
  --cart-surface: #0F2244;
  --cart-surface2: #162D59;
  --cart-border: #1E3F7A;
  --cart-text: #EFF6FF;
  --cart-text2: #93C5FD;
  font-family: 'IBM Plex Sans', system-ui, sans-serif;
}
.qpos-layout {
  display: grid;
  grid-template-columns: 200px 1fr 390px;
  height: calc(100vh - 64px);
  gap: 0;
  overflow: hidden;
  background: var(--pos-bg);
}
.qpos-sidebar {
  background: var(--pos-surface);
  border-right: 1px solid var(--pos-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.qpos-sidebar-logo {
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
.qpos-sidebar-logo svg { color: var(--pos-accent); }
.qpos-sidebar-shop { font-size: 10px; color: var(--pos-text3); margin-top: 1px; font-weight: 400; text-transform: none; letter-spacing: 0; }
.qpos-cats-list { flex: 1; overflow-y: auto; padding: 8px; }
.qpos-cat-btn {
  width: 100%; padding: 9px 12px; border: none; background: transparent;
  color: var(--pos-text2); font-size: 11px; font-weight: 700; text-align: left;
  cursor: pointer; border-radius: 8px; display: flex; align-items: center; gap: 8px;
  transition: all .15s; letter-spacing: .04em; text-transform: uppercase;
}
.qpos-cat-btn:hover { background: var(--pos-surface2); color: var(--pos-text); }
.qpos-cat-btn.active { background: var(--pos-accent); color: #fff; }
.qpos-cat-count { margin-left: auto; font-size: 10px; opacity: .55; }
.qpos-session-bar { padding: 12px; border-top: 1px solid var(--pos-border); }
.qpos-session-open {
  background: var(--pos-success-bg); border: 1px solid var(--pos-success-border);
  border-radius: 8px; padding: 8px 10px; font-size: 11px; color: var(--pos-success);
  display: flex; flex-direction: column; gap: 4px;
}
.qpos-session-closed {
  background: var(--pos-warn-bg); border: 1px solid var(--pos-warn-border);
  border-radius: 8px; padding: 8px 10px; font-size: 11px; color: var(--pos-warn);
}
.qpos-session-dot {
  width: 7px; height: 7px; border-radius: 50%; background: currentColor;
  display: inline-block; margin-right: 6px;
  animation: qpos-pulse 1.5s infinite;
}
@keyframes qpos-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
.qpos-catalog {
  display: flex; flex-direction: column; overflow: hidden; background: var(--pos-bg);
}
.qpos-catalog-header {
  padding: 14px 16px; display: flex; gap: 10px;
  background: var(--pos-surface); border-bottom: 1px solid var(--pos-border);
}
.qpos-search-wrap { flex: 1; position: relative; }
.qpos-search-wrap svg {
  position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
  color: var(--pos-text3); pointer-events: none; width: 16px; height: 16px;
}
.qpos-search {
  width: 100%; padding: 9px 12px 9px 34px; border: 1px solid var(--pos-border);
  border-radius: 10px; font-size: 13px; background: var(--pos-surface);
  color: var(--pos-text); outline: none; transition: border-color .15s;
  font-family: inherit;
}
.qpos-search:focus { border-color: var(--pos-accent); }
.qpos-view-toggle {
  display: flex; background: var(--pos-surface2); border-radius: 10px;
  padding: 3px; gap: 2px;
}
.qpos-view-btn {
  width: 34px; height: 34px; border: none; background: transparent;
  border-radius: 7px; cursor: pointer; color: var(--pos-text3);
  display: flex; align-items: center; justify-content: center;
  transition: all .15s;
}
.qpos-view-btn.active { background: var(--pos-surface); color: var(--pos-text); }
.qpos-products-wrap { flex: 1; overflow-y: auto; padding: 14px; }
.qpos-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}
.qpos-product-list { display: flex; flex-direction: column; gap: 6px; }
.qpos-prod-card {
  background: var(--pos-surface); border: 1px solid var(--pos-border);
  border-radius: 12px; padding: 14px 12px; cursor: pointer;
  transition: all .15s; position: relative; overflow: hidden;
  display: flex; flex-direction: column; gap: 5px; user-select: none;
  text-align: left;
}
.qpos-prod-card:hover { border-color: #2563EB; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,.06); }
.qpos-prod-card:active { transform: scale(.97); }
.qpos-prod-card.no-stock { opacity: .4; cursor: not-allowed; }
.qpos-prod-card.no-stock:hover { transform: none; box-shadow: none; }
.qpos-prod-unit { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--pos-accent); }
.qpos-prod-name { font-size: 12px; font-weight: 600; color: var(--pos-text); line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.qpos-prod-price { font-size: 15px; font-weight: 700; color: var(--pos-accent); margin-top: auto; font-variant-numeric: tabular-nums; }
.qpos-prod-price small { font-size: 9px; font-weight: 400; color: var(--pos-text3); }
.qpos-prod-stock { font-size: 10px; color: var(--pos-text3); }
.qpos-prod-stock.low { color: var(--pos-danger); }
.qpos-in-cart-badge {
  position: absolute; top: -1px; right: -1px;
  background: var(--pos-accent); color: #fff;
  font-size: 10px; font-weight: 700;
  width: 22px; height: 22px;
  border-radius: 0 11px 0 11px;
  display: flex; align-items: center; justify-content: center;
}
.qpos-prod-row {
  background: var(--pos-surface); border: 1px solid var(--pos-border);
  border-radius: 10px; padding: 10px 14px; cursor: pointer;
  display: flex; align-items: center; gap: 12px;
  transition: all .15s; user-select: none;
}
.qpos-prod-row:hover { border-color: #2563EB; background: var(--pos-surface2); }
.qpos-prod-row.no-stock { opacity: .4; cursor: not-allowed; }
.qpos-prod-row-info { flex: 1; min-width: 0; }
.qpos-prod-row-name { font-size: 13px; font-weight: 600; color: var(--pos-text); }
.qpos-prod-row-sub { font-size: 11px; color: var(--pos-text3); margin-top: 1px; }
.qpos-prod-row-price { font-size: 14px; font-weight: 700; color: var(--pos-accent); white-space: nowrap; font-variant-numeric: tabular-nums; }
.qpos-prod-row-stock { font-size: 11px; color: var(--pos-text3); min-width: 48px; text-align: right; }
.qpos-prod-row-stock.low { color: var(--pos-danger); }
.qpos-prod-row-qty-badge { font-size: 11px; font-weight: 700; color: var(--pos-accent); min-width: 22px; text-align: center; }
.qpos-row-add-btn {
  width: 30px; height: 30px; border: 1px solid var(--pos-border);
  border-radius: 8px; background: transparent; cursor: pointer;
  color: var(--pos-text); display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all .15s;
}
.qpos-row-add-btn:hover { background: var(--pos-accent); color: #fff; border-color: var(--pos-accent); }
.qpos-cart {
  background: var(--cart-bg); color: var(--cart-text);
  display: flex; flex-direction: column; overflow: hidden;
}
.qpos-cart-head {
  padding: 14px 20px; border-bottom: 1px solid var(--cart-border);
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0;
}
.qpos-cart-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: var(--cart-text2); display: flex; align-items: center; gap: 8px; }
.qpos-cart-badge { background: var(--pos-accent); color: #fff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
.qpos-cart-actions { display: flex; align-items: center; gap: 8px; }
.qpos-cart-clear-btn { background: transparent; border: none; color: var(--cart-text2); font-size: 11px; cursor: pointer; letter-spacing: .05em; text-transform: uppercase; font-weight: 600; transition: color .15s; }
.qpos-cart-clear-btn:hover { color: var(--pos-danger); }
.qpos-cust-wrap { padding: 10px 20px; border-bottom: 1px solid var(--cart-border); flex-shrink: 0; }
.qpos-cust-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--cart-text2); margin-bottom: 6px; }
.qpos-cust-select {
  width: 100%; background: var(--cart-surface2); border: 1px solid var(--cart-border);
  color: var(--cart-text); border-radius: 8px; padding: 8px 10px;
  font-size: 12px; outline: none; cursor: pointer; font-family: inherit;
}
.qpos-cust-selected {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; background: rgba(37,99,235,.1);
  border: 1px solid rgba(37,99,235,.3); border-radius: 8px;
}
.qpos-cust-name { font-size: 12px; font-weight: 600; color: var(--pos-accent); display: flex; align-items: center; gap: 6px; }
.qpos-cust-clear { background: transparent; border: none; color: var(--cart-text2); cursor: pointer; display: flex; align-items: center; }
.qpos-cust-clear:hover { color: var(--pos-danger); }
.qpos-cart-items { flex: 1; overflow-y: auto; padding: 0 20px; }
.qpos-cart-empty {
  height: 100%; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
  opacity: .3; padding: 40px 0;
}
.qpos-cart-empty p { font-size: 10px; text-transform: uppercase; letter-spacing: .1em; font-weight: 700; }
.qpos-ci {
  padding: 11px 0;
  border-bottom: 1px solid var(--cart-border);
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto auto;
  gap: 3px 12px;
}
.qpos-ci:last-child { border-bottom: none; }
.qpos-ci-name { font-size: 13px; font-weight: 600; color: var(--cart-text); line-height: 1.3; grid-column: 1; grid-row: 1; }
.qpos-ci-meta { font-size: 11px; color: var(--cart-text2); grid-column: 1; grid-row: 2; display: flex; align-items: center; gap: 6px; font-variant-numeric: tabular-nums; }
.qpos-ci-custom-price { grid-column: 1; grid-row: 3; display: flex; align-items: center; gap: 6px; }
.qpos-ci-custom-price-input {
  background: var(--cart-surface2); border: 1px solid var(--cart-border);
  color: #93C5FD; font-size: 12px; font-weight: 700; border-radius: 5px;
  padding: 3px 6px; width: 90px; outline: none; font-family: 'IBM Plex Mono', monospace;
  font-variant-numeric: tabular-nums;
}
.qpos-ci-custom-price-input:focus { border-color: #2563EB; }
.qpos-ci-custom-price-label { font-size: 10px; color: var(--cart-text2); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
.qpos-ci-controls { grid-column: 2; grid-row: 1 / 4; display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; gap: 6px; }
.qpos-ci-total { font-size: 15px; font-weight: 700; color: var(--cart-text); white-space: nowrap; font-variant-numeric: tabular-nums; }
.qpos-ci-qty-row { display: flex; align-items: center; gap: 4px; }
.qpos-ci-btn {
  width: 26px; height: 26px; border: 1px solid var(--cart-border);
  background: var(--cart-surface2); color: var(--cart-text);
  border-radius: 6px; cursor: pointer; display: flex; align-items: center;
  justify-content: center; transition: all .15s; flex-shrink: 0;
}
.qpos-ci-btn:hover { background: var(--cart-surface); border-color: #1E40AF; }
.qpos-ci-btn.del:hover { background: var(--pos-danger); border-color: var(--pos-danger); color: #fff; }
.qpos-ci-qty {
  font-size: 12px; font-weight: 700; color: var(--cart-text);
  min-width: 26px; text-align: center;
  background: var(--cart-surface); border: 1px solid var(--cart-border);
  border-radius: 6px; padding: 2px 4px; font-variant-numeric: tabular-nums;
}
.qpos-totals { padding: 14px 20px; border-top: 1px solid var(--cart-border); display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
.qpos-tot-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--cart-text2); }
.qpos-tot-val { font-variant-numeric: tabular-nums; font-weight: 600; }
.qpos-discount-row { display: flex; align-items: center; gap: 8px; }
.qpos-discount-row label { font-size: 11px; color: var(--cart-text2); font-weight: 600; text-transform: uppercase; letter-spacing: .06em; flex: 1; display: flex; align-items: center; gap: 5px; }
.qpos-discount-input {
  background: var(--cart-surface2); border: 1px solid var(--cart-border);
  color: #93C5FD; font-size: 13px; font-weight: 700; border-radius: 6px;
  padding: 5px 8px; width: 110px; text-align: right; outline: none;
  transition: border-color .15s; font-variant-numeric: tabular-nums;
  font-family: 'IBM Plex Mono', monospace;
}
.qpos-discount-input:focus { border-color: #2563EB; }
.qpos-discount-unit { font-size: 11px; color: var(--cart-text2); font-weight: 600; }
.qpos-tot-main {
  display: flex; justify-content: space-between; align-items: baseline;
  padding-top: 10px; border-top: 1px solid var(--cart-border);
}
.qpos-tot-main-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: var(--cart-text2); }
.qpos-tot-main-val { font-size: 24px; font-weight: 700; color: var(--cart-text); font-variant-numeric: tabular-nums; }
.qpos-payment { padding: 14px 20px; border-top: 1px solid var(--cart-border); display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
.qpos-pay-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--cart-text2); }
.qpos-pay-methods { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.qpos-pay-btn {
  padding: 10px; border: 1px solid var(--cart-border);
  background: var(--cart-surface2); color: var(--cart-text2);
  border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .06em;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: all .15s; font-family: inherit;
}
.qpos-pay-btn:hover { border-color: #1E40AF; color: var(--cart-text); }
.qpos-pay-btn.active { background: var(--pos-surface); color: var(--pos-primary); border-color: var(--pos-surface); }
.qpos-cash-wrap { display: flex; flex-direction: column; gap: 6px; }
.qpos-cash-input {
  background: var(--cart-surface2); border: 1px solid var(--cart-border);
  color: var(--cart-text); font-size: 15px; font-weight: 700;
  border-radius: 8px; padding: 10px 12px; width: 100%; outline: none;
  transition: border-color .15s; font-family: 'IBM Plex Mono', monospace;
}
.qpos-cash-input:focus { border-color: #1E40AF; }
.qpos-cash-input::placeholder { color: var(--cart-text2); font-weight: 400; font-size: 13px; font-family: inherit; }
.qpos-change-row {
  background: #07111F; border: 1px solid #1E3F7A; border-radius: 8px;
  padding: 9px 12px; display: flex; justify-content: space-between; align-items: center;
}
.qpos-change-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #93C5FD; }
.qpos-change-val { font-size: 16px; font-weight: 700; color: #93C5FD; font-variant-numeric: tabular-nums; }
.qpos-mobile-ops { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.qpos-mobile-op {
  padding: 9px; border: 1px solid var(--cart-border);
  background: var(--cart-surface2); color: var(--cart-text2);
  border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 700;
  letter-spacing: .04em; transition: all .15s; text-align: center; font-family: inherit;
}
.qpos-mobile-op:hover, .qpos-mobile-op.active { background: var(--cart-surface); color: var(--cart-text); border-color: #1E40AF; }
.qpos-checkout-btn {
  width: 100%; padding: 15px; background: var(--pos-accent); color: #fff;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all .15s; font-family: inherit;
}
.qpos-checkout-btn:hover:not(:disabled) { background: #1D4ED8; transform: translateY(-1px); }
.qpos-checkout-btn:disabled { opacity: .35; cursor: not-allowed; }
.qpos-session-banner {
  padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;
  border-radius: 10px; margin-bottom: 12px; font-size: 12px;
}
.qpos-session-open-banner { background: var(--pos-success-bg); border: 1px solid var(--pos-success-border); color: var(--pos-success); }
.qpos-session-closed-banner { background: var(--pos-warn-bg); border: 1px solid var(--pos-warn-border); color: var(--pos-warn); }
.qpos-session-input {
  padding: 8px 10px; border-radius: 8px; border: 1px solid var(--pos-warn-border);
  background: var(--pos-surface); font-size: 13px; font-weight: 600;
  outline: none; width: 140px; font-family: inherit;
}
.qpos-session-btn {
  padding: 8px 14px; background: var(--pos-accent); color: #fff; border: none;
  border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer;
  font-family: inherit; text-transform: uppercase; letter-spacing: .06em;
  transition: background .15s;
}
.qpos-session-btn:hover { background: #B45309; }
.qpos-session-btn:disabled { opacity: .5; cursor: not-allowed; }
.qpos-close-session-btn {
  padding: 6px 12px; background: rgba(192,57,43,.1);
  border: 1px solid rgba(192,57,43,.3); color: var(--pos-danger);
  border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer;
  font-family: inherit; text-transform: uppercase; letter-spacing: .06em;
  transition: all .15s;
}
.qpos-close-session-btn:hover { background: rgba(192,57,43,.2); }
.qpos-mobile-header { display: none; }
.qpos-mobile-search-wrap { position: relative; }
.qpos-mobile-search-wrap svg {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  color: var(--pos-text3); pointer-events: none; width: 17px; height: 17px;
}
.qpos-mobile-search {
  width: 100%; padding: 11px 14px 11px 38px;
  border: 1.5px solid var(--pos-border); border-radius: 12px;
  font-size: 14px; background: var(--pos-surface);
  color: var(--pos-text); outline: none; transition: border-color .15s;
  font-family: inherit;
}
.qpos-mobile-search:focus { border-color: var(--pos-accent); }
.qpos-mobile-cats {
  display: flex; gap: 7px; overflow-x: auto; padding-bottom: 2px;
  scrollbar-width: none;
}
.qpos-mobile-cats::-webkit-scrollbar { display: none; }
.qpos-mob-cat {
  padding: 7px 14px; border: 1.5px solid var(--pos-border);
  background: var(--pos-surface); border-radius: 20px;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; color: var(--pos-text2); cursor: pointer;
  white-space: nowrap; transition: all .15s; flex-shrink: 0;
  font-family: inherit;
}
.qpos-mob-cat.active { background: var(--pos-accent); color: #fff; border-color: var(--pos-accent); }
@media (max-width: 1024px) {
  .qpos-layout { grid-template-columns: 1fr; grid-template-rows: 1fr; }
  .qpos-sidebar { display: none; }
  .qpos-cart { display: none; }
}
@media (max-width: 768px) {
  .qpos-catalog-header { display: none; }
  .qpos-mobile-header {
    display: flex; flex-direction: column; gap: 10px;
    padding: 10px 12px 8px;
    background: var(--pos-surface);
    border-bottom: 1px solid var(--pos-border);
    position: sticky; top: 0; z-index: 10;
  }
  .qpos-products-wrap { padding: 10px 10px 80px; }
  .qpos-product-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
}
.qpos-catalog *::-webkit-scrollbar,
.qpos-cart *::-webkit-scrollbar { width: 3px; }
.qpos-catalog *::-webkit-scrollbar-thumb,
.qpos-cart *::-webkit-scrollbar-thumb { background: var(--pos-border); border-radius: 4px; }
`;

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

interface CartItem {
  product: Product;
  qty: number;
  customPrice?: number;
}

export default function QuincaillerieCaissePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  /* Données */
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  /* Session */
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [openingBalance, setOpeningBalance] = useState("");
  const [isOpeningSession, setIsOpeningSession] = useState(false);

  /* UI catalogue */
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  /* Panier */
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  /* Paiement */
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOBILE_MONEY">("CASH");
  const [mobileProvider, setMobileProvider] = useState<"ORANGE" | "MTN" | "WAVE">("WAVE");
  const [amountReceived, setAmountReceived] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  /* Paniers en attente */
  const [pendingCarts, setPendingCarts] = useState<{ id: string; name: string; items: CartItem[]; timestamp: string; total: number }[]>(() => {
    try {
      const saved = localStorage.getItem("quinc_pending_carts");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showPendingModal, setShowPendingModal] = useState(false);

  /* Mobile */
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  /* Inject styles */
  useEffect(() => {
    if (document.getElementById("qpos-styles")) return;
    const s = document.createElement("style");
    s.id = "qpos-styles";
    s.textContent = POS_STYLES;
    document.head.appendChild(s);
    return () => { document.getElementById("qpos-styles")?.remove(); };
  }, []);


  /* Chargement données */
  const loadData = async () => {
    if (!user?.shopId) {
      showToast("Erreur: votre compte n'est associé à aucune boutique.", "error");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [sessionRes, productsRes, catsRes, custsRes] = await Promise.all([
        QuincCashSessionService.getActive(user.shopId, user.id),
        QuincProductService.getAll(user.shopId),
        QuincCategoryService.getAll(user.shopId),
        QuincCustomerService.getAll(user.shopId),
      ]);
      setActiveSession(sessionRes);
      const filtered = Array.isArray(productsRes)
        ? productsRes.filter((p) => p.shopId === user.shopId)
        : [];
      setProducts(filtered);
      setCategories(Array.isArray(catsRes) ? catsRes : []);
      setCustomers(Array.isArray(custsRes) ? custsRes : []);
    } catch {
      showToast("Erreur lors du chargement des données.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.shopId && user?.id) {
      loadData().catch(() => {});
    }
  }, [user?.shopId, user?.id]);

  /* Session */
  const handleOpenSession = async () => {
    if (!user?.shopId || !user?.id) return;
    setIsOpeningSession(true);
    try {
      const newSession = await QuincCashSessionService.open({
        shopId: user.shopId,
        userId: user.id,
        openingBalance: parseFloat(openingBalance) || 0,
        notes: `Session ouverte par ${user.name || user.email}`,
      });
      setActiveSession(newSession);
      showToast(`Caisse ouverte — ${fmt(parseFloat(openingBalance) || 0)} FCFA`, "success");
    } catch (error: any) {
      if (error.response?.status === 409) {
        try {
          const s = await QuincCashSessionService.getActive(user.shopId, user.id);
          if (s) { setActiveSession(s); return; }
        } catch { /* ignore */ }
      }
      showToast(error.response?.data?.message || "Impossible d'ouvrir la caisse.", "error");
    } finally {
      setIsOpeningSession(false);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    const s = prompt("Montant réel compté en caisse (FCFA) :");
    if (s === null) return;
    try {
      await QuincCashSessionService.close(activeSession.id, {
        closingBalance: parseFloat(s) || 0,
        notes: `Session fermée par ${user?.name}`,
      });
      setActiveSession(null);
      showToast(`Caisse fermée — ${fmt(parseFloat(s) || 0)} FCFA déclarés`, "success");
    } catch {
      showToast("Erreur lors de la fermeture.", "error");
    }
  };

  /* Panier */
  const addToCart = (product: Product) => {
    if (product.stockQuantity < 1) { showToast("Rupture de stock !", "error"); return; }
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id);
      if (ex) {
        if (ex.qty >= product.stockQuantity) { showToast("Stock maximum atteint", "error"); return prev; }
        return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== id) return item;
        const nq = item.qty + delta;
        if (nq > item.product.stockQuantity) { showToast("Stock insuffisant", "error"); return item; }
        return { ...item, qty: nq };
      }).filter((i) => i.qty > 0)
    );
  };

  const updateCustomPrice = (id: string, price: string) => {
    const val = parseFloat(price);
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === id
          ? { ...item, customPrice: isNaN(val) || val <= 0 ? undefined : val }
          : item
      )
    );
  };

  /* Calculs */
  const subtotal = cart.reduce(
    (s, i) => s + (i.customPrice ?? i.product.sellingPrice) * i.qty,
    0
  );
  const discAmt = Math.max(0, Math.min(subtotal, discountAmount));
  const total = subtotal - discAmt;
  const received = parseFloat(amountReceived) || 0;
  const change = Math.max(0, received - total);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const inCart = (id: string) => cart.find((i) => i.product.id === id);

  /* Filtrage produits */
  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q);
    const matchC = !selectedCategory || p.categoryId === selectedCategory;
    return matchQ && matchC;
  });

  /* Checkout */
  const handleCheckout = async () => {
    if (cart.length === 0) return showToast("Panier vide", "error");
    if (!user?.shopId) return showToast("Boutique non identifiée", "error");
    setIsProcessing(true);
    try {
      await QuincSaleService.create({
        shopId: user.shopId,
        userId: user.id,
        cashSessionId: activeSession?.id,
        customerId: selectedCustomer?.id || undefined,
        totalAmount: total,
        discountAmount: discAmt,
        finalAmount: total,
        paidAmount: paymentMethod === "CASH" ? (received || total) : total,
        status: "COMPLETED" as const,
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.qty,
          unitPrice: item.customPrice ?? item.product.sellingPrice,
          totalPrice: (item.customPrice ?? item.product.sellingPrice) * item.qty,
        })),
        payments: [{
          method: paymentMethod,
          amount: total,
          reference: paymentMethod === "MOBILE_MONEY" ? `${mobileProvider}_${Date.now()}` : undefined,
        }],
      } as any);

      showToast(`Vente enregistrée : ${fmt(total)} FCFA !`, "success");

      // Mise à jour stock locale
      setProducts((prev) =>
        prev.map((p) => {
          const ci = cart.find((c) => c.product.id === p.id);
          return ci ? { ...p, stockQuantity: p.stockQuantity - ci.qty } : p;
        })
      );

      setCart([]);
      setAmountReceived("");
      setSelectedCustomer(null);
      setDiscountAmount(0);
      setMobileCartOpen(false);
    } catch {
      showToast("Erreur lors de la validation de la vente", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  /* Paniers en attente */
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
    localStorage.setItem("quinc_pending_carts", JSON.stringify(updated));
    setCart([]);
    showToast(`Panier de "${nameVal}" mis en attente.`, "success");
  };

  const handleRestoreCart = (pending: typeof pendingCarts[0]) => {
    setCart(pending.items);
    const updated = pendingCarts.filter((c) => c.id !== pending.id);
    setPendingCarts(updated);
    localStorage.setItem("quinc_pending_carts", JSON.stringify(updated));
    setShowPendingModal(false);
    showToast(`Panier de "${pending.name}" restauré !`, "success");
  };

  const handleDeletePendingCart = (id: string, name: string) => {
    const updated = pendingCarts.filter((c) => c.id !== id);
    setPendingCarts(updated);
    localStorage.setItem("quinc_pending_carts", JSON.stringify(updated));
    showToast(`Panier de "${name}" supprimé.`, "success");
  };

  if (loading) {
    return (
      <AppLayout title="Caisse Quincaillerie" subtitle="Chargement..." backUrl="/quinc">
        <div className="flex items-center justify-center p-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Caisse Quincaillerie" subtitle="Vente de matériaux et gros œuvre" backUrl="/quinc">
      <div className="qpos-root">

        {/* ── Bannière session ── */}
        {!activeSession ? (
          <div className="qpos-session-banner qpos-session-closed-banner">
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
                placeholder="Fond initial (FCFA)"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="qpos-session-input"
              />
              <button className="qpos-session-btn" onClick={handleOpenSession} disabled={isOpeningSession}>
                {isOpeningSession ? "…" : "Ouvrir"}
              </button>
            </div>
          </div>
        ) : (
          <div className="qpos-session-banner qpos-session-open-banner">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="qpos-session-dot" />
              <span style={{ fontWeight: 700 }}>
                Caisse ouverte — Fond : {fmt(activeSession.openingBalance)} FCFA
              </span>
            </div>
            <button className="qpos-close-session-btn" onClick={handleCloseSession}>
              Fermer la caisse
            </button>
          </div>
        )}

        {/* ── Layout principal ── */}
        <div className="qpos-layout">

          {/* ── SIDEBAR CATÉGORIES ── */}
          <aside className="qpos-sidebar">
            <div className="qpos-sidebar-logo">
              <Wrench size={18} />
              <div>
                Quincaillerie
                <div className="qpos-sidebar-shop">{user?.shopId ? "Matériaux & Outils" : "—"}</div>
              </div>
            </div>
            <div className="qpos-cats-list">
              <button
                className={`qpos-cat-btn ${!selectedCategory ? "active" : ""}`}
                onClick={() => setSelectedCategory(null)}
              >
                <Package size={14} />
                Tous
                <span className="qpos-cat-count">{products.length}</span>
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    className={`qpos-cat-btn ${selectedCategory === cat.id ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <Package size={14} />
                    {cat.name}
                    <span className="qpos-cat-count">{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="qpos-session-bar">
              {activeSession ? (
                <div className="qpos-session-open">
                  <span><span className="qpos-session-dot" />Session active</span>
                  <span style={{ fontSize: 10, opacity: .7 }}>{fmt(activeSession.openingBalance)} FCFA</span>
                </div>
              ) : (
                <div className="qpos-session-closed">⚠ Caisse fermée</div>
              )}
            </div>
          </aside>

          {/* ── CATALOGUE ── */}
          <div className="qpos-catalog">

            {/* Header mobile */}
            <div className="qpos-mobile-header">
              <div className="qpos-mobile-search-wrap">
                <Search />
                <input
                  className="qpos-mobile-search"
                  type="text"
                  placeholder="Rechercher un matériau…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="qpos-mobile-cats">
                <button
                  className={`qpos-mob-cat ${!selectedCategory ? "active" : ""}`}
                  onClick={() => setSelectedCategory(null)}
                >Tous</button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`qpos-mob-cat ${selectedCategory === cat.id ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >{cat.name}</button>
                ))}
              </div>
            </div>

            {/* Header desktop */}
            <div className="qpos-catalog-header">
              <div className="qpos-search-wrap">
                <Search />
                <input
                  className="qpos-search"
                  type="text"
                  placeholder="Nom, SKU du matériau…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="qpos-view-toggle">
                <button
                  className={`qpos-view-btn ${viewMode === "grid" ? "active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Vue grille"
                ><LayoutGrid size={16} /></button>
                <button
                  className={`qpos-view-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                  title="Vue liste"
                ><List size={16} /></button>
              </div>
            </div>

            {/* Produits */}
            <div className="qpos-products-wrap">
              {filteredProducts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", opacity: .4, fontSize: 13 }}>
                  Aucun matériau trouvé
                </div>
              ) : viewMode === "grid" ? (
                <div className="qpos-product-grid">
                  {filteredProducts.map((p) => {
                    const ci = inCart(p.id);
                    const noStock = p.stockQuantity <= 0;
                    return (
                      <div
                        key={p.id}
                        className={`qpos-prod-card ${noStock ? "no-stock" : ""}`}
                        onClick={() => !noStock && addToCart(p)}
                      >
                        {ci && <div className="qpos-in-cart-badge">{ci.qty}</div>}
                        <div className="qpos-prod-unit">{p.unit}</div>
                        <div className="qpos-prod-name">{p.name}</div>
                        <div className="qpos-prod-price">{fmt(p.sellingPrice)} <small>FCFA</small></div>
                        <div className={`qpos-prod-stock ${p.stockQuantity <= (p.minStockAlert || 5) && p.stockQuantity > 0 ? "low" : ""}`}>
                          {noStock ? "Rupture" : p.stockQuantity <= (p.minStockAlert || 5) ? `⚠ ${p.stockQuantity} restants` : `${p.stockQuantity} en stock`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="qpos-product-list">
                  {filteredProducts.map((p) => {
                    const ci = inCart(p.id);
                    const noStock = p.stockQuantity <= 0;
                    return (
                      <div
                        key={p.id}
                        className={`qpos-prod-row ${noStock ? "no-stock" : ""}`}
                        onClick={() => !noStock && addToCart(p)}
                      >
                        <div className="qpos-prod-row-info">
                          <div className="qpos-prod-row-name">{p.name}</div>
                          <div className="qpos-prod-row-sub">{p.unit} · {p.category?.name || "—"}{p.sku ? ` · ${p.sku}` : ""}</div>
                        </div>
                        {ci && <span className="qpos-prod-row-qty-badge">{ci.qty}×</span>}
                        <div className="qpos-prod-row-price">{fmt(p.sellingPrice)} <small style={{ fontSize: 10, fontWeight: 400 }}>FCFA</small></div>
                        <div className={`qpos-prod-row-stock ${p.stockQuantity <= (p.minStockAlert || 5) && p.stockQuantity > 0 ? "low" : ""}`}>
                          {noStock ? "Rupture" : p.stockQuantity <= (p.minStockAlert || 5) ? `⚠ ${p.stockQuantity}` : p.stockQuantity}
                        </div>
                        <button className="qpos-row-add-btn" onClick={(e) => { e.stopPropagation(); if (!noStock) addToCart(p); }}>
                          <Plus size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── PANNEAU PANIER & PAIEMENT ── */}
          <div
            className="qpos-cart"
            style={
              typeof window !== "undefined" && window.innerWidth <= 1024
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
                : {}
            }
          >
            {/* En-tête */}
            <div className="qpos-cart-head">
              <div className="qpos-cart-title">
                <ShoppingCart size={14} />
                Panier
                <span className="qpos-cart-badge">{totalItems}</span>
              </div>
              <div className="qpos-cart-actions">
                {pendingCarts.length > 0 && (
                  <button
                    onClick={() => setShowPendingModal(true)}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: "#FCD34D", background: "rgba(217,119,6,.15)", padding: "4px 8px", borderRadius: 8, border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: ".06em" }}
                  >
                    <Clock size={11} />
                    {pendingCarts.length} en attente
                  </button>
                )}
                {cart.length > 0 && (
                  <button
                    onClick={handlePutOnHold}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: "#93C5FD", background: "rgba(59,130,246,.12)", padding: "4px 8px", borderRadius: 8, border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: ".06em" }}
                  >
                    <Pause size={11} />
                    Attente
                  </button>
                )}
                <button className="qpos-cart-clear-btn" onClick={() => setCart([])}>Vider</button>
              </div>
            </div>

            {/* Sélection client */}
            <div className="qpos-cust-wrap">
              <div className="qpos-cust-label">
                <User size={12} style={{ display: "inline", marginRight: 4, verticalAlign: -2 }} />
                Client
              </div>
              {selectedCustomer ? (
                <div className="qpos-cust-selected">
                  <div className="qpos-cust-name">
                    <User size={13} />
                    {selectedCustomer.firstName} {selectedCustomer.lastName || ""}
                  </div>
                  <button className="qpos-cust-clear" onClick={() => setSelectedCustomer(null)}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <select
                  className="qpos-cust-select"
                  onChange={(e) => setSelectedCustomer(customers.find((c) => c.id === e.target.value) || null)}
                  value=""
                >
                  <option value="">— Client de passage —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName || ""}{c.phone ? ` (${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Articles */}
            <div className="qpos-cart-items">
              {cart.length === 0 ? (
                <div className="qpos-cart-empty">
                  <ShoppingCart size={36} />
                  <p>Panier vide</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="qpos-ci">
                    <div className="qpos-ci-name">{item.product.name}</div>
                    <div className="qpos-ci-meta">
                      <span>{fmt(item.customPrice ?? item.product.sellingPrice)} FCFA</span>
                      <span>× {item.qty}</span>
                      <span style={{ fontSize: 9, opacity: .6 }}>{item.product.unit}</span>
                    </div>
                    <div className="qpos-ci-custom-price">
                      <span className="qpos-ci-custom-price-label">Prix :</span>
                      <input
                        className="qpos-ci-custom-price-input"
                        type="number"
                        placeholder={String(item.product.sellingPrice)}
                        value={item.customPrice ?? ""}
                        onChange={(e) => updateCustomPrice(item.product.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="qpos-ci-controls">
                      <div className="qpos-ci-total">
                        {fmt((item.customPrice ?? item.product.sellingPrice) * item.qty)}
                      </div>
                      <div className="qpos-ci-qty-row">
                        <button className="qpos-ci-btn del" onClick={() => updateQuantity(item.product.id, -1)}>
                          <Minus size={11} />
                        </button>
                        <span className="qpos-ci-qty">{item.qty}</span>
                        <button className="qpos-ci-btn" onClick={() => updateQuantity(item.product.id, 1)}>
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totaux */}
            <div className="qpos-totals">
              <div className="qpos-tot-row">
                <span>Sous-total</span>
                <span className="qpos-tot-val">{fmt(subtotal)} FCFA</span>
              </div>
              <div className="qpos-tot-row qpos-discount-row">
                <label>
                  <Scissors size={12} />
                  Remise
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    className="qpos-discount-input"
                    type="number"
                    min={0}
                    max={subtotal}
                    placeholder="0"
                    value={discountAmount || ""}
                    onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                  <span className="qpos-discount-unit">FCFA</span>
                </div>
              </div>
              <div className="qpos-tot-main">
                <span className="qpos-tot-main-label">Total</span>
                <span className="qpos-tot-main-val">{fmt(total)} FCFA</span>
              </div>
            </div>

            {/* Paiement */}
            <div className="qpos-payment">
              <div className="qpos-pay-label">Mode de paiement</div>
              <div className="qpos-pay-methods">
                <button
                  className={`qpos-pay-btn ${paymentMethod === "CASH" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("CASH")}
                >
                  <Banknote size={16} />Espèces
                </button>
                <button
                  className={`qpos-pay-btn ${paymentMethod === "MOBILE_MONEY" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("MOBILE_MONEY")}
                >
                  <Smartphone size={16} />Mobile
                </button>
              </div>

              {paymentMethod === "CASH" ? (
                <div className="qpos-cash-wrap">
                  <input
                    className="qpos-cash-input"
                    type="number"
                    placeholder="Montant reçu…"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                  />
                  {received > 0 && cart.length > 0 && (
                    <div className="qpos-change-row">
                      <span className="qpos-change-label">Monnaie à rendre</span>
                      <span className="qpos-change-val">{fmt(change)} FCFA</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="qpos-mobile-ops">
                  {(["WAVE", "ORANGE", "MTN"] as const).map((op) => (
                    <button
                      key={op}
                      className={`qpos-mobile-op ${mobileProvider === op ? "active" : ""}`}
                      onClick={() => setMobileProvider(op)}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              )}

              <button
                className="qpos-checkout-btn"
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing || !activeSession}
              >
                <CheckCircle2 size={18} />
                {isProcessing ? "Traitement…" : `Valider · ${fmt(total)} FCFA`}
              </button>
              {!activeSession && (
                <p style={{ fontSize: 10, color: "#D97706", textAlign: "center", margin: 0 }}>
                  Ouvrez la caisse avant de valider
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── FAB Panier Mobile ── */}
        <div
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            padding: "10px 16px",
            background: "var(--pos-surface)",
            borderTop: "1px solid var(--pos-border)",
            display: "flex", alignItems: "center", gap: 12,
            zIndex: 99,
          }}
          className="lg:hidden"
        >
          <span style={{ fontWeight: 700, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
            {fmt(total)} FCFA
          </span>
          <button
            onClick={() => setMobileCartOpen((v) => !v)}
            style={{
              flex: 1, padding: "13px", background: "#D97706",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 13, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: ".06em", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: "inherit",
            }}
          >
            <ShoppingCart size={18} />
            Panier
            <span style={{ background: "#92400E", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12 }}>
              {totalItems}
            </span>
            <ChevronUp size={16} style={{ marginLeft: 4, transform: mobileCartOpen ? "rotate(180deg)" : "none", transition: "transform .3s" }} />
          </button>
        </div>

        {/* Overlay mobile */}
        {mobileCartOpen && (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 199, backdropFilter: "blur(2px)" }}
            onClick={() => setMobileCartOpen(false)}
          />
        )}

        {/* ── Modal Paniers en attente ── */}
        {showPendingModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">Paniers en attente</h3>
                    <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{pendingCarts.length} paniers suspendus</p>
                  </div>
                </div>
                <button onClick={() => setShowPendingModal(false)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
                  <X className="h-4 w-4 text-zinc-400" />
                </button>
              </div>
              <div className="p-4 max-h-90 overflow-y-auto flex flex-col gap-2.5">
                {pendingCarts.map((item) => (
                  <div key={item.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-zinc-800 dark:text-zinc-200 truncate">{item.name}</span>
                        <span className="text-[9px] font-bold text-zinc-400 bg-zinc-200/50 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{item.timestamp}</span>
                      </div>
                      <p className="text-[9px] font-bold text-zinc-400 mt-1">
                        {item.items.reduce((acc, it) => acc + it.qty, 0)} articles · {fmt(item.total)} FCFA
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestoreCart(item)}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
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
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <button onClick={() => setShowPendingModal(false)} className="px-4 py-2 text-[10px] font-black uppercase tracking-wider border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
