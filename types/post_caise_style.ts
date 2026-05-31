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
.qpos-catalog-header { display: none; }
.qpos-mobile-header {
  display: flex; flex-direction: column; gap: 10px;
  padding: 10px 12px 8px;
  background: var(--pos-surface);
  border-bottom: 1px solid var(--pos-border);
  position: sticky; top: 0; z-index: 10;
}
@media (min-width: 768px) {
  .qpos-product-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
  .qpos-cart {
    left: calc(50% - 240px);
    right: auto;
    width: 480px;
    height: 90dvh;
    max-height: 90dvh;
  }
}
@media (max-width: 767px) {
  .qpos-product-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
}
.qpos-catalog *::-webkit-scrollbar,
.qpos-cart *::-webkit-scrollbar { width: 3px; }
.qpos-catalog *::-webkit-scrollbar-thumb,
.qpos-cart *::-webkit-scrollbar-thumb { background: var(--pos-border); border-radius: 4px; }
`;