export const POS_STYLES = `
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
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  overflow: hidden;
}
.qpos-layout {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--pos-bg);
  display: flex;
  flex-direction: column;
}
.qpos-sidebar { display: none; }
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
.qpos-products-wrap { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 14px 88px; }
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
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 200;
  max-height: 90dvh;
  border-radius: 20px 20px 0 0;
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
.qpos-cart-items { flex: 1; min-height: 0; overflow-y: auto; padding: 0 20px; }
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
.qpos-catalog-header { display: none; }
.qpos-mobile-header {
  display: flex; flex-direction: column; gap: 10px;
  padding: 10px 12px 8px;
  background: var(--pos-surface);
  border-bottom: 1px solid var(--pos-border);
  position: sticky; top: 0; z-index: 10;
}
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

/* ── Mobile ── */
@media (max-width: 767px) {
  .qpos-product-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
}

/* ── Tablette (768-1023px) : drawer centré ── */
@media (min-width: 768px) and (max-width: 1023px) {
  .qpos-product-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
  .qpos-cart {
    left: calc(50% - 240px);
    right: auto;
    width: 480px;
    height: 90dvh;
    max-height: 90dvh;
  }
}

/* ── Desktop (1024px+) : split-screen catalogue | panier ── */
@media (min-width: 1024px) {
  .qpos-layout {
    flex-direction: row;
  }
  .qpos-catalog {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .qpos-catalog-header {
    display: flex;
  }
  .qpos-mobile-header {
    display: none;
  }
  .qpos-products-wrap {
    padding-bottom: 14px;
  }
  .qpos-product-grid {
    grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
  }
  .qpos-cart {
    position: static !important;
    transform: none !important;
    transition: none !important;
    width: 360px !important;
    flex-shrink: 0;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
    border-left: 1px solid var(--cart-border);
    left: auto !important;
    right: auto !important;
    bottom: auto !important;
  }
  .qpos-cart-fab {
    display: none !important;
  }
}
.qpos-catalog *::-webkit-scrollbar,
.qpos-cart *::-webkit-scrollbar { width: 3px; }
.qpos-catalog *::-webkit-scrollbar-thumb,
.qpos-cart *::-webkit-scrollbar-thumb { background: var(--pos-border); border-radius: 4px; }

/* ══ LAYOUT DESKTOP PRO toggle ══ */
.pos-mobile-view { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
.pos-desktop-view { display: none; }
@media (min-width: 1024px) {
  .pos-mobile-view { display: none; }
  .pos-desktop-view {
    display: grid;
    grid-template-columns: 1fr 260px;
    grid-template-rows: auto auto auto 1fr auto;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    background: #E8EFF8;
  }
}

/* ══ LAYOUT DESKTOP PRO (pdt-*) ══ */
.pdt-topbar { display: flex; align-items: center; justify-content: space-between; padding: 7px 16px; background: #1E3A8A; color: #fff; gap: 16px; grid-column: 1 / -1; grid-row: 1; }
.pdt-topbar-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.pdt-topbar-field { display: flex; align-items: center; gap: 7px; }
.pdt-topbar-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; opacity: .7; }
.pdt-cust-select { background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25); color: #fff; border-radius: 6px; padding: 4px 8px; font-size: 12px; outline: none; cursor: pointer; font-family: inherit; }
.pdt-cust-pill { display: flex; align-items: center; gap: 5px; background: rgba(255,255,255,.2); border-radius: 6px; padding: 4px 8px; font-size: 12px; font-weight: 600; }
.pdt-cust-pill button { background: transparent; border: none; color: inherit; cursor: pointer; display: flex; align-items: center; padding: 0; opacity: .7; }
.pdt-topbar-stat { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,.12); border-radius: 6px; padding: 4px 10px; font-size: 11px; }
.pdt-topbar-stat span { opacity: .7; }
.pdt-topbar-stat strong { font-size: 13px; }
.pdt-session-ok { background: rgba(45,122,79,.35); }
.pdt-session-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; display: inline-block; animation: pos-pulse 1.5s infinite; }
.pdt-topbar-right { display: flex; flex-direction: column; align-items: flex-end; }
.pdt-topbar-total-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; opacity: .65; }
.pdt-topbar-total { font-size: 24px; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1.1; }

.pdt-main { display: contents; }

.pdt-ticket { display: flex; flex-direction: column; background: #fff; overflow: hidden; border-right: 1px solid #D0DBF0; grid-column: 1; grid-row: 2; max-height: 220px; }
.pdt-ticket-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #8A9BBD; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
.pdt-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.pdt-table thead { background: #F0F4FA; border-bottom: 2px solid #D0DBF0; position: sticky; top: 0; }
.pdt-table th { padding: 6px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #4A5A7A; }
.pdt-row { border-bottom: 1px solid #E8EFF8; cursor: pointer; transition: background .1s; }
.pdt-row:hover { background: #F0F4FA; }
.pdt-row.selected { background: #DBEAFE; }
.pdt-row.selected .pdt-net { color: #1D4ED8; font-weight: 800; }
.pdt-row td { padding: 7px 10px; }
.pdt-td-name { font-weight: 600; color: #0F1E3D; }
.pdt-td-num { text-align: right; font-variant-numeric: tabular-nums; color: #4A5A7A; }
.pdt-qty { font-weight: 700; color: #2563EB; }
.pdt-net { font-weight: 700; color: #0F1E3D; }
.pdt-ticket-footer { padding: 5px 10px; border-top: 1px solid #D0DBF0; background: #F8FAFC; flex-shrink: 0; display: flex; flex-direction: column; gap: 2px; }
.pdt-tot-row { display: flex; justify-content: space-between; font-size: 11px; color: #4A5A7A; font-variant-numeric: tabular-nums; }
.pdt-disc { color: #C0392B; }
.pdt-grand { font-size: 13px; font-weight: 800; color: #0F1E3D; padding-top: 4px; border-top: 1px solid #D0DBF0; margin-top: 2px; }

.pdt-numpad-panel { background: #0F1E3D; color: #EEF2FF; display: flex; flex-direction: column; padding: 5px; gap: 3px; box-sizing: border-box; overflow-y: auto; grid-column: 2; grid-row: 2 / 6; }
.pdt-total-box { background: #162545; border-radius: 6px; padding: 3px 8px; text-align: center; }
.pdt-total-label { display: block; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #7B93C8; }
.pdt-total-val { font-size: 16px; font-weight: 800; font-variant-numeric: tabular-nums; }
.pdt-mode-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.pdt-mode-btn { padding: 4px; border: 1px solid #2A4480; background: #162545; color: #7B93C8; border-radius: 5px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; cursor: pointer; transition: all .15s; font-family: inherit; }
.pdt-mode-btn:hover { background: #1E3060; color: #EEF2FF; }
.pdt-mode-btn.active { background: #2563EB; color: #fff; border-color: #2563EB; }
.pdt-btn-danger { color: #F87171; border-color: #7F1D1D; }
.pdt-btn-danger:hover { background: #991B1B; color: #fff; border-color: #991B1B; }
.pdt-buffer-display { background: #0A1628; border-radius: 5px; padding: 2px 6px; font-size: 10px; color: #7B93C8; min-height: 16px; display: flex; align-items: center; }
.pdt-numpad { display: grid; grid-template-columns: repeat(3,1fr); gap: 3px; }
.pdt-num-btn { padding: 5px; background: #162545; border: 1px solid #2A4480; color: #EEF2FF; border-radius: 5px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all .12s; font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
.pdt-num-btn:hover { background: #1E3060; }
.pdt-num-btn:active { transform: scale(.93); }
.pdt-num-btn.clear { color: #FCA5A5; border-color: #7F1D1D; }
.pdt-num-btn.backspace { font-size: 12px; color: #93C5FD; }

.pdt-payment { display: flex; flex-direction: column; gap: 4px; border-top: 1px solid #2A4480; padding-top: 5px; }
.pdt-pay-methods { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.pdt-pay-btn { padding: 5px; border: 1px solid #2A4480; background: #162545; color: #7B93C8; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all .15s; font-family: inherit; }
.pdt-pay-btn.active { background: #fff; color: #1E3A8A; border-color: #fff; }
.pdt-cash-input { background: #162545; border: 1px solid #2A4480; color: #EEF2FF; border-radius: 6px; padding: 5px 8px; font-size: 12px; font-weight: 700; outline: none; font-family: 'IBM Plex Mono', monospace; width: 100%; box-sizing: border-box; }
.pdt-change-row { display: flex; justify-content: space-between; align-items: center; background: #0F2D5A; border: 1px solid #2A5298; border-radius: 6px; padding: 5px 9px; font-size: 11px; color: #93C5FD; font-variant-numeric: tabular-nums; }
.pdt-mobile-ops { display: grid; grid-template-columns: repeat(3,1fr); gap: 4px; }
.pdt-mob-op { padding: 5px; border: 1px solid #2A4480; background: #162545; color: #7B93C8; border-radius: 6px; font-size: 10px; font-weight: 700; cursor: pointer; transition: all .15s; font-family: inherit; }
.pdt-mob-op.active { background: #1E40AF; color: #fff; border-color: #1E40AF; }
.pdt-annexe { display: flex; gap: 4px; }
.pdt-hold-btn { flex: 1; padding: 4px; border: 1px solid #2A4480; background: transparent; color: #7B93C8; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all .15s; font-family: inherit; }
.pdt-hold-btn:hover { background: #162545; color: #EEF2FF; }

.pdt-catbar { display: flex; align-items: center; gap: 10px; padding: 7px 12px; background: #fff; border-top: 1px solid #D0DBF0; border-bottom: 1px solid #D0DBF0; overflow: hidden; grid-column: 1; grid-row: 3; }
.pdt-search-box { display: flex; align-items: center; gap: 6px; background: #F0F4FA; border: 1px solid #D0DBF0; border-radius: 8px; padding: 5px 9px; flex-shrink: 0; width: 210px; }
.pdt-search-box svg { color: #8A9BBD; flex-shrink: 0; }
.pdt-search { border: none; background: transparent; font-size: 12px; color: #0F1E3D; outline: none; flex: 1; font-family: inherit; min-width: 0; }
.pdt-cats { display: flex; gap: 5px; overflow-x: auto; flex: 1; scrollbar-width: none; }
.pdt-cats::-webkit-scrollbar { display: none; }
.pdt-cat-btn { padding: 5px 11px; border: 1.5px solid #D0DBF0; background: #F0F4FA; color: #4A5A7A; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; cursor: pointer; white-space: nowrap; transition: all .15s; flex-shrink: 0; font-family: inherit; display: flex; align-items: center; gap: 4px; }
.pdt-cat-btn:hover { background: #E8EFF8; }
.pdt-cat-btn.active { background: #1E3A8A; color: #fff; border-color: #1E3A8A; }
.pdt-cat-count { font-size: 9px; opacity: .6; }

.pdt-products { min-height: 0; overflow-y: auto; padding: 8px; display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 6px; align-content: start; background: #E8EFF8; grid-column: 1; grid-row: 4; }
.pdt-prod-btn { position: relative; background: #fff; border: 1.5px solid #D0DBF0; border-radius: 10px; padding: 9px 7px 7px; cursor: pointer; display: flex; flex-direction: column; gap: 3px; text-align: left; transition: all .15s; user-select: none; font-family: inherit; }
.pdt-prod-btn:hover { border-color: #2563EB; transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,.08); }
.pdt-prod-btn:active { transform: scale(.95); }
.pdt-prod-btn.no-stock { opacity: .35; cursor: not-allowed; }
.pdt-prod-btn.no-stock:hover { transform: none; box-shadow: none; }
.pdt-prod-btn.in-cart { border-color: #2563EB; background: #EFF6FF; }
.pdt-prod-badge { position: absolute; top: -1px; right: -1px; background: #2563EB; color: #fff; font-size: 10px; font-weight: 700; width: 19px; height: 19px; border-radius: 0 9px 0 9px; display: flex; align-items: center; justify-content: center; }
.pdt-prod-name { font-size: 11px; font-weight: 600; color: #0F1E3D; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.pdt-prod-price { font-size: 12px; font-weight: 700; color: #2563EB; margin-top: auto; font-variant-numeric: tabular-nums; }

.pdt-footer { padding: 7px 12px; background: #fff; border-top: 2px solid #D0DBF0; grid-column: 1; grid-row: 5; }
.pdt-encaisser-btn { width: 100%; padding: 13px; background: #16A34A; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all .15s; font-family: inherit; }
.pdt-encaisser-btn:hover:not(:disabled) { background: #15803D; transform: translateY(-1px); }
.pdt-encaisser-btn:active:not(:disabled) { transform: scale(.99); }
.pdt-encaisser-btn:disabled { opacity: .35; cursor: not-allowed; }
`;