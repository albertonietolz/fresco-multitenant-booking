import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8080";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --blue: #1a3070;
    --blue-mid: #2b4590;
    --blue-light: #3d5aac;
    --ochre: #c9973a;
    --ochre-dim: rgba(201,151,58,0.12);
    --stone: #f4f0e6;
    --stone-border: #d8cfc0;
    --white: #ffffff;
    --ink: #110e0a;
    --ink-muted: #6a5f52;
    --sidebar-w: 240px;
    --success: #15803d;
    --error: #dc2626;
  }

  html, body { height: 100%; margin: 0; padding: 0; background: var(--stone); }

  body {
    font-family: 'DM Sans', system-ui, sans-serif;
    color: var(--ink);
    min-height: 100vh;
  }

  /* ── LAYOUT ── */
  .dash {
    min-height: 100vh;
    background: var(--stone);
  }

  /* ── SIDEBAR ── */
  .sidebar {
    background: var(--blue);
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: var(--sidebar-w);
    overflow-y: auto;
    overflow-x: hidden;
    z-index: 50;
  }

  .sidebar::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 120% 60% at 0% 0%, rgba(201,151,58,0.12) 0%, transparent 55%);
    pointer-events: none;
  }

  .sidebar-top {
    position: relative;
    z-index: 1;
    padding: 32px 24px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .sidebar-brand {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.08em;
  }

  .sidebar-rule {
    width: 20px;
    height: 1px;
    background: var(--ochre);
    margin: 8px 0 6px;
  }

  .sidebar-tenant {
    font-size: 0.72rem;
    font-weight: 400;
    color: rgba(255,255,255,0.4);
    letter-spacing: 0.04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sidebar-nav {
    position: relative;
    z-index: 1;
    flex: 1;
    padding: 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nav-label {
    font-size: 0.6rem;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.2);
    padding: 12px 12px 6px;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: rgba(255,255,255,0.55);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.84rem;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
    width: 100%;
  }

  .nav-btn:hover {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.85);
  }

  .nav-btn.active {
    background: rgba(255,255,255,0.1);
    color: #fff;
    font-weight: 500;
  }

  .nav-btn.active .nav-dot {
    background: var(--ochre);
  }

  .nav-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .sidebar-bottom {
    position: relative;
    z-index: 1;
    padding: 16px 12px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: rgba(255,255,255,0.35);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    cursor: pointer;
    transition: all 0.15s;
    width: 100%;
    text-align: left;
  }

  .logout-btn:hover {
    color: rgba(255,255,255,0.7);
    background: rgba(255,255,255,0.05);
  }

  /* ── MAIN ── */
  .main {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    margin-left: var(--sidebar-w);
  }

  .topbar {
    background: var(--white);
    border-bottom: 1px solid var(--stone-border);
    padding: 0 36px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .topbar-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--ink);
    letter-spacing: -0.01em;
  }

  .topbar-user {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--blue);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.04em;
  }

  .user-name {
    font-size: 0.82rem;
    color: var(--ink-muted);
  }

  .content {
    flex: 1;
    padding: 36px;
  }

  /* ── STATS ── */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 20px;
  }

  .stat-card {
    background: var(--white);
    border: 1px solid var(--stone-border);
    border-radius: 10px;
    padding: 18px 20px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(8,12,30,0.04);
    transition: box-shadow 0.18s, transform 0.18s;
  }

  .stat-card:hover {
    box-shadow: 0 4px 16px rgba(8,12,30,0.09);
    transform: translateY(-1px);
  }

  .stat-card::after {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 3px;
    height: 100%;
    background: var(--ochre);
    border-radius: 3px 0 0 3px;
  }

  .stat-label {
    font-size: 0.66rem;
    font-weight: 500;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 6px;
  }

  .stat-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.2rem;
    font-weight: 600;
    color: var(--blue);
    line-height: 1;
  }

  .stat-delta {
    font-size: 0.72rem;
    font-weight: 500;
    margin-top: 5px;
  }
  .stat-delta.up   { color: var(--success); }
  .stat-delta.down { color: var(--error); }
  .stat-delta.flat { color: var(--ink-muted); }

  .stat-sub {
    font-size: 0.74rem;
    color: var(--ink-muted);
    margin-top: 4px;
  }

  /* ── ANALYTICS PERIOD PICKER ── */
  .an-period {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }

  .an-seg {
    display: flex;
    border: 1.5px solid var(--stone-border);
    border-radius: 7px;
    overflow: hidden;
  }

  .an-seg-btn {
    padding: 6px 12px;
    background: var(--white);
    border: none;
    border-right: 1px solid var(--stone-border);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    color: var(--ink-muted);
    cursor: pointer;
    transition: all 0.12s;
    white-space: nowrap;
  }
  .an-seg-btn:last-child { border-right: none; }
  .an-seg-btn:hover { background: var(--stone); color: var(--ink); }
  .an-seg-btn.active { background: var(--blue); color: #fff; font-weight: 500; }

  .an-range-inputs {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .an-date-input {
    padding: 6px 10px;
    border: 1.5px solid var(--stone-border);
    border-radius: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.80rem;
    color: var(--ink);
    background: var(--white);
    outline: none;
    transition: border-color 0.13s;
  }
  .an-date-input:focus { border-color: var(--blue); }

  .an-period-label {
    font-size: 0.78rem;
    color: var(--ink-muted);
    font-style: italic;
    white-space: nowrap;
  }

  /* ── ANALYTICS CHARTS ── */
  .an-charts-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .an-chart-card {
    background: var(--white);
    border: 1px solid var(--stone-border);
    border-radius: 10px;
    padding: 20px 22px;
    box-shadow: 0 1px 4px rgba(8,12,30,0.04);
  }

  .an-chart-title {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 16px;
  }

  .an-bar-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .an-bar-label {
    font-size: 0.78rem;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 80px;
    max-width: 110px;
    flex-shrink: 0;
  }

  .an-bar-track {
    flex: 1;
    height: 12px;
    background: var(--stone);
    border-radius: 6px;
    overflow: hidden;
  }

  .an-bar-fill {
    height: 100%;
    border-radius: 6px;
    transition: width 0.4s ease;
    background: var(--blue);
  }

  .an-bar-fill.ochre { background: var(--ochre); }
  .an-bar-fill.green { background: var(--success); }

  .an-bar-count {
    font-size: 0.75rem;
    color: var(--ink-muted);
    width: 24px;
    text-align: right;
    flex-shrink: 0;
  }

  .an-dow-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    align-items: end;
    height: 80px;
  }

  .an-dow-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    height: 100%;
  }

  .an-dow-bar {
    width: 100%;
    border-radius: 4px 4px 0 0;
    background: var(--blue);
    transition: height 0.4s ease;
    min-height: 2px;
  }

  .an-dow-label {
    font-size: 0.64rem;
    color: var(--ink-muted);
    font-weight: 500;
  }

  .an-hour-grid {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 60px;
    overflow-x: auto;
  }

  .an-hour-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 3px;
    flex: 1;
    min-width: 18px;
    height: 100%;
  }

  .an-hour-bar {
    width: 100%;
    border-radius: 3px 3px 0 0;
    background: var(--ochre);
    transition: height 0.4s ease;
    min-height: 2px;
  }

  .an-hour-label {
    font-size: 0.55rem;
    color: var(--ink-muted);
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transform: rotate(180deg);
    white-space: nowrap;
  }

  .an-empty {
    color: var(--ink-muted);
    font-size: 0.82rem;
    text-align: center;
    padding: 24px 0;
    font-style: italic;
  }

  .an-table-wrap {
    background: var(--white);
    border: 1px solid var(--stone-border);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(8,12,30,0.04);
    margin-top: 16px;
  }

  @media (max-width: 860px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .an-charts-row { grid-template-columns: 1fr; }
  }
  @media (max-width: 520px) {
    .stats-grid { grid-template-columns: 1fr 1fr; }
    .an-bar-label { max-width: 72px; min-width: 60px; }
  }

  /* ── SECTION HEADER ── */
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--ink);
  }

  /* ── BUTTON ── */
  .btn-primary {
    padding: 9px 18px;
    background: var(--blue);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    letter-spacing: 0.02em;
  }

  .btn-primary:hover { background: var(--blue-light); transform: translateY(-1px); }

  .add-option-btn {
    padding: 5px 11px;
    background: transparent;
    color: var(--blue);
    border: 1px dashed var(--stone-border);
    border-radius: 5px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .add-option-btn:hover { border-color: var(--blue); background: var(--ochre-dim); }

  .add-option-remove {
    background: none;
    border: none;
    font-size: 0.72rem;
    color: var(--ink-muted);
    cursor: pointer;
    padding: 0;
    font-family: 'DM Sans', sans-serif;
    transition: color 0.15s;
  }

  .add-option-remove:hover { color: var(--error); }

  .btn-danger {
    padding: 6px 12px;
    background: transparent;
    color: var(--error);
    border: 1px solid rgba(220,38,38,0.25);
    border-radius: 5px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-danger:hover { background: #fef2f2; }

  .btn-sm {
    padding: 6px 12px;
    background: var(--stone);
    color: var(--blue);
    border: 1px solid var(--stone-border);
    border-radius: 5px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-sm:hover { background: var(--stone-border); }

  /* ── TABLE ── */
  .table-wrap {
    background: var(--white);
    border: 1px solid var(--stone-border);
    border-radius: 10px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    box-shadow: 0 1px 4px rgba(8,12,30,0.04);
  }

  .table-wrap::-webkit-scrollbar { height: 5px; }
  .table-wrap::-webkit-scrollbar-track { background: var(--stone); }
  .table-wrap::-webkit-scrollbar-thumb { background: var(--stone-border); border-radius: 3px; }

  table { width: 100%; border-collapse: collapse; }

  thead { background: var(--stone); }

  th {
    padding: 9px 12px;
    text-align: left;
    font-size: 0.67rem;
    font-weight: 500;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: var(--ink-muted);
    border-bottom: 1px solid var(--stone-border);
    white-space: nowrap;
  }

  td {
    padding: 10px 12px;
    font-size: 0.83rem;
    color: var(--ink);
    border-bottom: 1px solid rgba(216,207,192,0.4);
  }

  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(244,240,230,0.5); }

  .badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 100px;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.04em;
  }

  .badge-pending { background: #fef3c7; color: #92400e; }
  .badge-confirmed { background: #d1fae5; color: #065f46; }
  .badge-cancelled { background: #fee2e2; color: #991b1b; }
  .badge-active { background: #d1fae5; color: #065f46; }
  .badge-inactive { background: #f3f4f6; color: #6b7280; }

  /* ── MODAL ── */
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(8,12,30,0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(2px);
  }

  .modal {
    background: var(--white);
    border-radius: 10px;
    padding: 32px;
    width: 100%;
    max-width: 460px;
    box-shadow: 0 24px 64px rgba(8,12,30,0.25);
  }

  .modal-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 24px;
  }

  .form-field { margin-bottom: 14px; }

  .form-field label {
    display: block;
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 6px;
  }

  .form-field input, .form-field select {
    width: 100%;
    padding: 10px 13px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    color: var(--ink);
    background: var(--white);
    border: 1.5px solid var(--stone-border);
    border-radius: 6px;
    outline: none;
    transition: border-color 0.15s;
  }

  .form-field input:focus, .form-field select:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(26,48,112,0.08);
  }

  .modal-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 24px;
  }

  .btn-cancel {
    padding: 9px 18px;
    background: var(--stone);
    color: var(--ink-muted);
    border: 1px solid var(--stone-border);
    border-radius: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    cursor: pointer;
  }

  /* ── EMPTY STATE ── */
  .empty {
    text-align: center;
    padding: 48px;
    color: var(--ink-muted);
    font-size: 0.88rem;
  }

  /* ── ALERT ── */
  .alert {
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 0.82rem;
    margin-bottom: 16px;
  }

  .alert.err { background: #fef2f2; border: 1px solid #fca5a5; color: var(--error); }
  .alert.ok { background: #f0fdf4; border: 1px solid #86efac; color: var(--success); }

  /* ── NO-HOURS BANNER ── */
  .no-hours-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 20px;
    font-size: 0.85rem;
    color: #92400e;
  }
  .no-hours-banner .nhb-icon { font-size: 1.1rem; flex-shrink: 0; }
  .no-hours-banner .nhb-text { flex: 1; line-height: 1.4; }
  .no-hours-banner .nhb-text strong { display: block; font-weight: 600; margin-bottom: 2px; }
  .no-hours-banner .nhb-btn {
    flex-shrink: 0;
    background: #d97706;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 6px 14px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .no-hours-banner .nhb-btn:hover { background: #b45309; }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .modal-wide { max-width: 540px; }

  .fields-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 14px;
    max-height: 220px;
    overflow-y: auto;
  }

  .field-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--stone);
    border: 1px solid var(--stone-border);
    border-radius: 5px;
  }

  .field-item-left { display: flex; flex-direction: column; gap: 2px; }

  .field-item-meta { color: var(--ink-muted); font-size: 0.75rem; margin-top: 1px; }

  .three-col { display: grid; grid-template-columns: 2fr 1fr auto; gap: 8px; align-items: end; }

  .section-divider {
    border: none;
    border-top: 1px solid var(--stone-border);
    margin: 16px 0;
  }

  /* ── EMPRESA ── */
  .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

  .card {
    background: var(--white);
    border: 1px solid var(--stone-border);
    border-radius: 10px;
    padding: 28px;
    box-shadow: 0 1px 4px rgba(8,12,30,0.04);
  }

  .card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 20px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--stone-border);
  }

  .input-readonly {
    background: var(--stone) !important;
    color: var(--ink-muted) !important;
    cursor: default !important;
  }

  .link-box {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--stone);
    border: 1px solid var(--stone-border);
    border-radius: 6px;
    padding: 10px 14px;
  }

  .link-text {
    flex: 1;
    font-size: 0.76rem;
    color: var(--blue);
    word-break: break-all;
    font-family: monospace;
  }

  .copy-btn {
    padding: 5px 14px;
    background: var(--blue);
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 0.75rem;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
  }

  .copy-btn:hover { background: var(--blue-light); }
  .copy-btn.ok { background: var(--success); }

  /* ── CLOSURE CALENDAR ── */
  .cl-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .cl-month-label {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink);
    text-transform: capitalize;
  }
  .cl-nav-btn {
    background: none;
    border: 1px solid var(--stone-border);
    border-radius: 5px;
    cursor: pointer;
    color: var(--ink-muted);
    font-size: 1rem;
    padding: 2px 10px;
    line-height: 1.6;
    transition: background 0.12s;
  }
  .cl-nav-btn:hover { background: var(--stone); }

  .cl-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 4px; }
  .cl-weekday {
    text-align: center;
    font-size: 0.58rem;
    font-weight: 600;
    color: var(--ink-muted);
    padding: 4px 0;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .cl-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
  .cl-day {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 400;
    color: var(--ink);
    cursor: pointer;
    transition: all 0.1s;
    position: relative;
    border: 1.5px solid transparent;
    user-select: none;
  }
  .cl-day.cl-other-month { color: var(--stone-border); cursor: default; }
  .cl-day.cl-struct-closed { color: var(--stone-border); background: var(--stone); cursor: default; }
  .cl-day.cl-past { opacity: 0.4; cursor: default; }
  .cl-day.cl-open { background: var(--white); }
  .cl-day.cl-open:hover { border-color: var(--blue-light); background: rgba(26,48,112,0.04); }
  .cl-day.cl-selected { border-color: var(--blue); background: rgba(26,48,112,0.08); font-weight: 600; }
  .cl-day.cl-closed {
    background: rgba(220,38,38,0.08);
    color: var(--error);
    font-weight: 600;
  }
  .cl-day.cl-closed:hover { background: rgba(220,38,38,0.14); }
  .cl-day.cl-closed.cl-selected { border-color: var(--error); }
  .cl-day.cl-today { font-weight: 700; }
  .cl-day.cl-today.cl-open { color: var(--blue); }
  .cl-closed-dot {
    position: absolute;
    bottom: 3px;
    width: 4px; height: 4px;
    border-radius: 50%;
    background: var(--error);
  }

  .cl-legend {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 14px;
    font-size: 0.74rem;
    color: var(--ink-muted);
  }
  .cl-legend-item { display: flex; align-items: center; gap: 5px; }
  .cl-legend-dot {
    width: 10px; height: 10px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .cl-actions {
    display: flex;
    gap: 8px;
    margin-top: 14px;
    flex-wrap: wrap;
    align-items: center;
  }
  .cl-sel-count {
    font-size: 0.78rem;
    color: var(--ink-muted);
    margin-right: auto;
  }
  .btn-close-day {
    padding: 7px 14px;
    background: rgba(220,38,38,0.08);
    color: var(--error);
    border: 1px solid rgba(220,38,38,0.3);
    border-radius: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.80rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.13s;
  }
  .btn-close-day:hover { background: rgba(220,38,38,0.15); }
  .btn-reopen-day {
    padding: 7px 14px;
    background: rgba(21,128,61,0.07);
    color: var(--success);
    border: 1px solid rgba(21,128,61,0.25);
    border-radius: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.80rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.13s;
  }
  .btn-reopen-day:hover { background: rgba(21,128,61,0.14); }

  /* ── BOOKING PREVIEW ── */
  .preview-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0 4px;
  }

  .preview-desc {
    font-size: 0.82rem;
    color: var(--ink-muted);
    line-height: 1.5;
    margin-bottom: 28px;
    text-align: center;
    max-width: 400px;
  }

  .preview-device {
    background: var(--ink);
    border-radius: 36px;
    padding: 14px 10px;
    box-shadow: 0 24px 64px rgba(8,12,30,0.32), 0 4px 16px rgba(8,12,30,0.18);
    position: relative;
  }

  .preview-device::before {
    content: '';
    position: absolute;
    top: 7px;
    left: 50%;
    transform: translateX(-50%);
    width: 48px;
    height: 4px;
    background: rgba(255,255,255,0.15);
    border-radius: 3px;
  }

  .preview-screen {
    width: 300px;
    height: 560px;
    background: var(--stone);
    border-radius: 26px;
    overflow: hidden;
    position: relative;
  }

  .preview-screen iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
    transform-origin: top left;
  }

  .preview-open-btn {
    margin-top: 20px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    background: var(--stone);
    border: 1px solid var(--stone-border);
    border-radius: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--blue);
    cursor: pointer;
    text-decoration: none;
    transition: background 0.15s;
  }

  .preview-open-btn:hover { background: var(--stone-border); }

  /* ── SERVICE MODE (segmented control) ── */
  .svc-seg {
    display: flex;
    border: 1.5px solid var(--stone-border);
    border-radius: 7px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .svc-seg-btn {
    flex: 1;
    padding: 7px 6px;
    background: var(--white);
    border: none;
    border-right: 1px solid var(--stone-border);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 400;
    color: var(--ink-muted);
    cursor: pointer;
    transition: all 0.13s;
    text-align: center;
    line-height: 1.2;
  }

  .svc-seg-btn:last-child { border-right: none; }

  .svc-seg-btn:hover { background: var(--stone); color: var(--ink); }

  .svc-seg-btn.active {
    background: var(--blue);
    color: #fff;
    font-weight: 500;
  }

  .svc-mode-desc {
    font-size: 0.73rem;
    color: var(--ink-muted);
    margin-bottom: 12px;
    padding: 6px 10px;
    background: var(--stone);
    border-radius: 5px;
    line-height: 1.5;
  }

  /* ── EMP SERVICE PICKER ── */
  .emp-svc-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
    max-height: 140px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .emp-svc-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 8px;
    border: 1px solid var(--stone-border);
    border-radius: 5px;
    font-size: 0.80rem;
    cursor: pointer;
    background: var(--white);
    transition: background 0.12s;
  }

  .emp-svc-item:hover { background: var(--stone); }

  .emp-svc-item input[type="checkbox"] {
    accent-color: var(--blue);
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    cursor: pointer;
  }

  /* ── OVERVIEW SCHEDULE ── */
  .ov-sched-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin: 28px 0 16px;
  }

  .ov-date-input {
    padding: 7px 12px;
    border: 1.5px solid var(--stone-border);
    border-radius: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.84rem;
    color: var(--ink);
    background: var(--white);
    outline: none;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .ov-date-input:focus { border-color: var(--blue); }

  .ov-sched-grid {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 16px;
    margin-bottom: 8px;
  }

  @media (max-width: 760px) {
    .ov-sched-grid { grid-template-columns: 1fr; }
  }

  .ov-sched-card {
    background: var(--white);
    border: 1px solid var(--stone-border);
    border-radius: 10px;
    padding: 18px 20px;
    box-shadow: 0 1px 4px rgba(8,12,30,0.04);
  }

  .ov-sched-card-title {
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 12px;
  }

  .ov-hours-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ov-hours-row {
    font-size: 0.88rem;
    color: var(--ink);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ov-hours-sep { color: var(--ink-muted); font-size: 0.78rem; }

  .ov-closed {
    font-size: 0.84rem;
    color: var(--ink-muted);
    font-style: italic;
  }

  .ov-emp-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ov-emp-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 12px;
    background: var(--stone);
    border-radius: 7px;
  }

  .ov-emp-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--blue);
    color: #fff;
    font-size: 0.68rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ov-emp-name {
    font-size: 0.86rem;
    font-weight: 500;
    color: var(--ink);
    line-height: 1.2;
  }

  .ov-emp-shifts {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 3px;
  }

  .ov-emp-shift {
    font-size: 0.74rem;
    color: var(--ink-muted);
    background: var(--white);
    border: 1px solid var(--stone-border);
    border-radius: 4px;
    padding: 2px 6px;
  }

  /* ── SUBSCRIPTION ── */
  .plans-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-top: 8px;
  }

  .plan-card {
    background: var(--white);
    border: 1.5px solid var(--stone-border);
    border-radius: 12px;
    padding: 28px 24px;
    display: flex;
    flex-direction: column;
    gap: 0;
    box-shadow: 0 1px 4px rgba(8,12,30,0.04);
    transition: box-shadow 0.18s;
    position: relative;
    overflow: hidden;
  }

  .plan-card:hover { box-shadow: 0 6px 24px rgba(8,12,30,0.09); }

  .plan-card.plan-pro {
    border-color: var(--blue);
    background: linear-gradient(160deg, var(--blue) 0%, #1e3a8a 100%);
    color: #fff;
  }

  .plan-card.plan-pro::before {
    content: 'Recomendado';
    position: absolute;
    top: 26px;
    right: -30px;
    width: 130px;
    text-align: center;
    background: var(--ochre);
    color: #fff;
    font-size: 0.58rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 5px 0;
    transform: rotate(45deg);
  }

  .plan-badge {
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ochre);
    margin-bottom: 10px;
  }

  .plan-card.plan-pro .plan-badge { color: rgba(201,151,58,0.85); }

  .plan-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 4px;
    line-height: 1.1;
  }

  .plan-card.plan-pro .plan-name { color: #fff; }

  .plan-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.6rem;
    font-weight: 600;
    color: var(--blue);
    line-height: 1;
    margin: 12px 0 4px;
  }

  .plan-card.plan-pro .plan-price { color: #fff; }

  .plan-price-sub {
    font-size: 0.75rem;
    color: var(--ink-muted);
    margin-bottom: 20px;
  }

  .plan-card.plan-pro .plan-price-sub { color: rgba(255,255,255,0.55); }

  .plan-divider {
    height: 1px;
    background: var(--stone-border);
    margin: 16px 0;
  }

  .plan-card.plan-pro .plan-divider { background: rgba(255,255,255,0.12); }

  .plan-features {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 9px;
    flex: 1;
    margin-bottom: 24px;
  }

  .plan-feature {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 0.82rem;
    color: var(--ink-muted);
    line-height: 1.4;
  }

  .plan-card.plan-pro .plan-feature { color: rgba(255,255,255,0.8); }

  .plan-feature-icon {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #d1fae5;
    color: #065f46;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-weight: 700;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .plan-card.plan-pro .plan-feature-icon {
    background: rgba(201,151,58,0.25);
    color: var(--ochre);
  }

  .plan-cta {
    width: 100%;
    padding: 11px;
    border-radius: 7px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.86rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.02em;
    border: none;
  }

  .plan-cta-free {
    background: var(--stone);
    border: 1.5px solid var(--stone-border);
    color: var(--blue);
  }

  .plan-cta-free:hover { background: var(--stone-border); }

  .plan-cta-pro {
    background: var(--ochre);
    color: #fff;
    border: none;
    box-shadow: 0 4px 14px rgba(201,151,58,0.35);
  }

  .plan-cta-pro:hover { background: #b8862f; }

  @media (max-width: 640px) {
    .plans-grid { grid-template-columns: 1fr; }
  }

  /* ── SPLIT SHIFT HOURS ── */
  .sh-day-block {
    background: var(--white);
    border: 1px solid var(--stone-border);
    border-radius: 10px;
    padding: 14px 18px;
    margin-bottom: 10px;
    box-shadow: 0 1px 3px rgba(8,12,30,0.03);
  }

  .sh-day-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0;
  }

  .sh-day-name {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--ink);
    min-width: 100px;
  }

  .sh-no-shifts {
    font-size: 0.76rem;
    color: var(--ink-muted);
    font-style: italic;
  }

  .sh-shifts-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--stone-border);
  }

  .sh-shift-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .sh-time {
    padding: 7px 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.84rem;
    color: var(--ink);
    background: var(--stone);
    border: 1.5px solid var(--stone-border);
    border-radius: 6px;
    outline: none;
    transition: border-color 0.15s;
    width: 108px;
  }

  .sh-time:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(26,48,112,0.08); }

  .sh-sep { font-size: 0.8rem; color: var(--ink-muted); }

  .sh-add-btn {
    padding: 5px 12px;
    background: none;
    border: 1.5px dashed var(--stone-border);
    border-radius: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.76rem;
    color: var(--ink-muted);
    cursor: pointer;
    transition: all 0.12s;
    white-space: nowrap;
  }

  .sh-add-btn:hover { border-color: var(--blue); color: var(--blue); background: rgba(26,48,112,0.04); }

  .sh-del-btn {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid rgba(220,38,38,0.2);
    background: transparent;
    color: var(--error);
    font-size: 0.85rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.12s;
    flex-shrink: 0;
  }

  .sh-del-btn:hover { background: #fef2f2; border-color: var(--error); }

  /* ── BOOKING CALENDAR ── */
  .bookings-layout { display: grid; grid-template-columns: 210px 1fr; gap: 14px; align-items: start; }
  .bookings-layout > div { min-width: 0; }

  /* Compactar sección Reservas: fuente y padding más pequeños */
  .bookings-section { font-size: 0.78rem; }
  .bookings-section .section-header { margin-bottom: 14px; }
  .bookings-section .table-wrap th { padding: 6px 9px; font-size: 0.60rem; letter-spacing: 0.08em; }
  .bookings-section .table-wrap td { padding: 7px 9px; font-size: 0.76rem; }
  .bookings-section .status-select { font-size: 0.72rem; padding: 3px 6px; }
  .bookings-section .badge { font-size: 0.67rem; padding: 2px 7px; }
  .bookings-section .section-title { font-size: 1.35rem; }
  .bookings-section .btn-primary { font-size: 0.78rem; padding: 7px 14px; }

  .calendar-card {
    background: var(--white);
    border: 1px solid var(--stone-border);
    border-radius: 8px;
    padding: 18px;
    position: sticky;
    top: 80px;
  }

  .cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }

  .cal-month {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink);
  }

  .cal-nav-btn {
    background: none;
    border: 1px solid var(--stone-border);
    border-radius: 4px;
    cursor: pointer;
    color: var(--ink-muted);
    font-size: 1rem;
    padding: 1px 9px;
    line-height: 1.6;
  }

  .cal-nav-btn:hover { background: var(--stone); }

  .cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 4px; }

  .cal-weekday {
    text-align: center;
    font-size: 0.58rem;
    font-weight: 600;
    color: var(--ink-muted);
    padding: 4px 0;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }

  .cal-day {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.76rem;
    color: var(--ink);
    transition: background 0.1s;
    gap: 1px;
  }

  .cal-day:hover { background: var(--stone); }
  .cal-day.today { font-weight: 700; color: var(--blue); }
  .cal-day.selected { background: var(--blue); color: white; font-weight: 600; }
  .cal-day.selected:hover { background: var(--blue-light); }
  .cal-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--ochre); flex-shrink: 0; }
  .cal-dot.inv { background: rgba(255,255,255,0.75); }

  .cal-clear {
    margin-top: 10px;
    width: 100%;
    padding: 6px;
    background: none;
    border: 1px solid var(--stone-border);
    border-radius: 5px;
    font-size: 0.73rem;
    color: var(--ink-muted);
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
  }

  .cal-clear:hover { background: var(--stone); }

  /* ── BOOKING WIZARD ── */
  .wizard-steps {
    display: flex;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--stone-border);
    gap: 4px;
  }

  .wizard-step {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 0.73rem;
    color: var(--ink-muted);
  }

  .wizard-step.active { color: var(--blue); font-weight: 500; }
  .wizard-step.done { color: var(--success); }

  .step-num {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--stone);
    border: 1.5px solid var(--stone-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.66rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .wizard-step.active .step-num { background: var(--blue); color: white; border-color: var(--blue); }
  .wizard-step.done .step-num { background: var(--success); color: white; border-color: var(--success); }
  .step-label { white-space: nowrap; }

  /* ── TIME SLOTS ── */
  .slot-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(66px, 1fr));
    gap: 7px;
    margin-bottom: 20px;
    max-height: 192px;
    overflow-y: auto;
    padding: 2px;
  }

  .slot-btn {
    padding: 9px 4px;
    background: var(--stone);
    border: 1.5px solid var(--stone-border);
    border-radius: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.84rem;
    cursor: pointer;
    transition: all 0.1s;
    color: var(--ink);
    text-align: center;
  }

  .slot-btn:hover { background: var(--ochre-dim); border-color: var(--ochre); }
  .slot-btn.selected { background: var(--blue); color: white; border-color: var(--blue); font-weight: 500; }

  /* ── STATUS SELECTOR ── */
  .status-select {
    padding: 4px 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    border: 1px solid var(--stone-border);
    border-radius: 5px;
    background: var(--white);
    color: var(--ink);
    cursor: pointer;
  }

  /* ── STATUS BADGE ── */
  .status-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .status-badge.pending  { background: rgba(201,151,58,0.18); color: #92640a; border: 1px solid rgba(201,151,58,0.4); }
  .status-badge.confirmed { background: rgba(21,128,61,0.14); color: #15803d; border: 1px solid rgba(21,128,61,0.35); }
  .status-badge.cancelled { background: rgba(220,38,38,0.12); color: #dc2626; border: 1px solid rgba(220,38,38,0.3); }

  /* ── BUSINESS HOURS LIST ── */
  .bh-list { display: flex; flex-direction: column; gap: 8px; }

  .bh-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    border-radius: 8px;
    background: var(--stone);
    border: 1.5px solid transparent;
    transition: border-color 0.15s, background 0.15s;
  }

  .bh-item.bh-open {
    background: var(--white);
    border-color: var(--stone-border);
  }

  .bh-day {
    font-size: 0.84rem;
    font-weight: 500;
    color: var(--ink);
    min-width: 84px;
    flex-shrink: 0;
  }

  .bh-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    flex-shrink: 0;
    user-select: none;
    font-size: 0.78rem;
    color: var(--ink-muted);
  }

  .bh-toggle input[type="checkbox"] {
    width: 14px;
    height: 14px;
    cursor: pointer;
    accent-color: var(--blue);
    margin: 0;
    padding: 0;
  }

  .bh-times {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .bh-sep {
    font-size: 0.75rem;
    color: var(--ink-muted);
    flex-shrink: 0;
  }

  .bh-time {
    padding: 7px 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.84rem;
    color: var(--ink);
    background: var(--white);
    border: 1.5px solid var(--stone-border);
    border-radius: 6px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s;
    width: 110px;
  }

  .bh-time:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(26,48,112,0.08); }
  .bh-time:disabled { opacity: 0.35; background: var(--stone); cursor: not-allowed; }

  .bh-closed {
    margin-left: auto;
    font-size: 0.74rem;
    color: var(--ink-muted);
    font-style: italic;
    letter-spacing: 0.02em;
  }

  /* ── SIDEBAR COMPANY NAME ── */
  .sidebar-company {
    font-size: 0.84rem;
    font-weight: 500;
    color: rgba(255,255,255,0.9);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 1px;
  }

  /* ── HAMBURGER ── */
  .hamburger-btn {
    display: none;
    flex-direction: column;
    gap: 4px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 7px 6px;
    border-radius: 5px;
    flex-shrink: 0;
  }
  .hamburger-btn span {
    display: block;
    width: 20px;
    height: 2px;
    background: var(--ink);
    border-radius: 2px;
    transition: opacity 0.15s;
  }
  .hamburger-btn:hover { background: var(--stone); }

  .sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(8,12,30,0.48);
    z-index: 40;
    backdrop-filter: blur(1px);
  }
  .sidebar-overlay.visible { display: block; }

  /* ── RESPONSIVE ── */
  @media (max-width: 960px) {
    .main { margin-left: 0; }

    .sidebar {
      transform: translateX(calc(-1 * var(--sidebar-w) - 4px));
      transition: transform 0.26s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: none;
    }

    .sidebar.open {
      transform: translateX(0);
      box-shadow: 6px 0 32px rgba(8,12,30,0.22);
    }

    .hamburger-btn { display: flex; }
    .topbar { padding: 0 18px; }
    .content { padding: 24px 18px; }

    .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
    .profile-grid { grid-template-columns: 1fr; }
    .bookings-layout { grid-template-columns: 1fr; }

    .table-wrap > table { min-width: 480px; }

    .bh-item { flex-wrap: wrap; gap: 10px; }
    .bh-times { margin-left: 0; }
  }

  @media (max-width: 768px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .profile-grid { grid-template-columns: 1fr; }
    .bookings-layout { grid-template-columns: 1fr; }
    .two-col { grid-template-columns: 1fr; }
  }

  @media (max-width: 520px) {
    .stats-grid { grid-template-columns: 1fr; }
    .three-col { grid-template-columns: 1fr 1fr; }
    .content { padding: 16px 12px; }
    .topbar { padding: 0 12px; height: 52px; }
    .topbar-title { font-size: 1.15rem; }
    .user-name { display: none; }
    .modal {
      padding: 20px 16px;
      margin: 0 10px;
      max-width: calc(100vw - 20px) !important;
      border-radius: 10px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .slot-grid { grid-template-columns: repeat(auto-fill, minmax(56px, 1fr)); }
    .wizard-steps { gap: 0; }
    .step-label { display: none; }
    .section-title { font-size: 1.3rem; }
    .bh-time { width: 95px; }
    .bh-day { min-width: 72px; }
  }
`;

const api = async (path, opts = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
};

const apiMultipart = async (path, formData) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
const DAY_ES = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [section, setSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tenantName, setTenantName] = useState(
    localStorage.getItem("tenantName") || "",
  );
  const [hasBusinessHours, setHasBusinessHours] = useState(null);
  const userName = localStorage.getItem("userName") || "Usuario";
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    api("/api/tenant")
      .then((d) => {
        setTenantName(d.name);
        localStorage.setItem("tenantName", d.name);
      })
      .catch(() => {});
    api("/api/tenant/hours")
      .then((data) => setHasBusinessHours(Array.isArray(data) && data.length > 0))
      .catch(() => setHasBusinessHours(true));
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const goSection = (id) => {
    setSection(id);
    setSidebarOpen(false);
  };

  const NAV = [
    { id: "overview",  label: "Resumen" },
    { id: "planning",  label: "Planificación" },
    { id: "empresa",   label: "Mi empresa" },
    { id: "services",  label: "Servicios" },
    { id: "employees", label: "Empleados" },
    { id: "hours",     label: "Horarios" },
    { id: "suscripcion", label: "Suscripción" },
  ];

  const TITLES = {
    overview:    "Panel de control",
    planning:    "Planificación",
    empresa:     "Mi empresa",
    services:    "Servicios",
    employees:   "Empleados",
    hours:       "Horarios",
    suscripcion: "Suscripción",
  };

  return (
    <>
      <style>{styles}</style>
      {sidebarOpen && (
        <div
          className="sidebar-overlay visible"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="dash">
        <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
          <div className="sidebar-top">
            <div className="sidebar-brand">Fresco</div>
            <div className="sidebar-rule" />
            {tenantName && <div className="sidebar-company">{tenantName}</div>}
            <div className="sidebar-tenant">{userName}</div>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-label">Gestión</div>
            {NAV.map((n) => (
              <button
                key={n.id}
                className={`nav-btn ${section === n.id ? "active" : ""}`}
                onClick={() => goSection(n.id)}
              >
                <span className="nav-dot" />
                {n.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <button className="logout-btn" onClick={logout}>
              ← Cerrar sesión
            </button>
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                className="hamburger-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Menú"
              >
                <span />
                <span />
                <span />
              </button>
              <div className="topbar-title">{TITLES[section]}</div>
            </div>
            <div className="topbar-user">
              <div className="user-name">{tenantName || userName}</div>
              <div className="user-avatar">{initials}</div>
            </div>
          </header>
          <div className="content">
            {hasBusinessHours === false && section !== "empresa" && (
              <div className="no-hours-banner">
                <span className="nhb-icon">⚠️</span>
                <div className="nhb-text">
                  <strong>Tu negocio no tiene horario configurado</strong>
                  Los clientes no podrán ver disponibilidad ni hacer reservas hasta que lo configures.
                </div>
                <button className="nhb-btn" onClick={() => goSection("empresa")}>
                  Configurar horario
                </button>
              </div>
            )}
            {section === "overview"  && <Overview setSection={goSection} />}
            {section === "planning"  && <Planning />}
            {section === "empresa"   && <Empresa onHoursSaved={() => setHasBusinessHours(true)} />}
            {section === "services"  && <Services />}
            {section === "employees" && <Employees />}
            {section === "hours"     && <Hours />}
            {section === "suscripcion" && <Subscription />}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── OVERVIEW / RESUMEN ── */

// Helpers de fecha
const todayDate = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

const DOW_ES_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Calcula el rango de fechas para cada preset.
function computePeriod(preset, customFrom, customTo) {
  const today = todayDate();
  const d = (y, m, day) => { const x = new Date(y, m, day); x.setHours(0,0,0,0); return x; };
  switch (preset) {
    case "today": return { from: today, to: today };
    case "week": {
      const mon = new Date(today); mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { from: mon, to: sun };
    }
    case "month": return { from: d(today.getFullYear(), today.getMonth(), 1), to: d(today.getFullYear(), today.getMonth() + 1, 0) };
    case "7d":  { const f = new Date(today); f.setDate(today.getDate() - 6);  return { from: f, to: today }; }
    case "30d": { const f = new Date(today); f.setDate(today.getDate() - 29); return { from: f, to: today }; }
    case "3m":  { const f = new Date(today); f.setMonth(today.getMonth() - 3); return { from: f, to: today }; }
    case "year": { return { from: d(today.getFullYear(), 0, 1), to: d(today.getFullYear(), 11, 31) }; }
    case "custom": {
      if (customFrom && customTo) {
        const f = new Date(customFrom + "T00:00:00"); f.setHours(0,0,0,0);
        const t = new Date(customTo + "T00:00:00"); t.setHours(0,0,0,0);
        return { from: f, to: t };
      }
      return { from: today, to: today };
    }
    default: { const f = new Date(today); f.setDate(today.getDate() - 29); return { from: f, to: today }; }
  }
}

function prevPeriod(from, to) {
  const days = Math.round((to - from) / 86400000) + 1;
  const pTo = new Date(from); pTo.setDate(pTo.getDate() - 1);
  const pFrom = new Date(pTo); pFrom.setDate(pFrom.getDate() - days + 1);
  return { from: pFrom, to: pTo };
}

function filterByRange(bookings, from, to) {
  return bookings.filter((b) => {
    const bd = new Date(b.date + "T00:00:00");
    return bd >= from && bd <= to;
  });
}

function fmtPeriodLabel(preset, from, to) {
  const fmt = (d) => d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  if (preset === "today") return `Hoy, ${fmt(from)}`;
  if (preset === "week")  return `Semana del ${fmt(from)} al ${fmt(to)}`;
  if (preset === "month") return from.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  if (preset === "7d")    return `Últimos 7 días`;
  if (preset === "30d")   return `Últimos 30 días`;
  if (preset === "3m")    return `Últimos 3 meses`;
  if (preset === "year")  return `Año ${from.getFullYear()}`;
  return `${fmt(from)} – ${fmt(to)}`;
}

function delta(curr, prev) {
  if (prev === 0 && curr === 0) return null;
  if (prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

function DeltaBadge({ curr, prev }) {
  const pct = delta(curr, prev);
  if (pct === null) return null;
  const cls = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
  const arrow = pct > 0 ? "↑" : pct < 0 ? "↓" : "→";
  return <div className={`stat-delta ${cls}`}>{arrow} {Math.abs(pct)}% vs período anterior</div>;
}

function HBar({ label, count, max, color = "" }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="an-bar-row">
      <span className="an-bar-label" title={label}>{label}</span>
      <div className="an-bar-track">
        <div className={`an-bar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="an-bar-count">{count}</span>
    </div>
  );
}

const PRESETS = [
  { id: "today", label: "Hoy" },
  { id: "week",  label: "Esta semana" },
  { id: "month", label: "Este mes" },
  { id: "7d",    label: "7 días" },
  { id: "30d",   label: "30 días" },
  { id: "3m",    label: "3 meses" },
  { id: "year",  label: "Este año" },
  { id: "custom",label: "Personalizado" },
];

function Overview({ setSection }) {
  const [bookings,  setBookings]  = useState([]);
  const [services,  setServices]  = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [preset,    setPreset]    = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo,   setCustomTo]   = useState("");

  useEffect(() => {
    Promise.all([
      api("/api/bookings"),
      api("/api/services"),
      api("/api/employees"),
    ]).then(([b, s, e]) => {
      setBookings(b);
      setServices(s);
      setEmployees(e);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const { from, to } = computePeriod(preset, customFrom, customTo);
  const { from: pFrom, to: pTo } = prevPeriod(from, to);

  const curr = filterByRange(bookings, from, to);
  const prev = filterByRange(bookings, pFrom, pTo);

  // KPIs
  const total      = curr.length;
  const confirmed  = curr.filter((b) => b.status === "CONFIRMED").length;
  const pending    = curr.filter((b) => b.status === "PENDING").length;
  const cancelled  = curr.filter((b) => b.status === "CANCELLED").length;
  const cancelRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
  const unique     = new Set(curr.map((b) => b.customerEmail || b.customerName)).size;
  const daySpan    = Math.max(1, Math.round((to - from) / 86400000) + 1);
  const avgPerDay  = (total / daySpan).toFixed(1);

  // Service map / employee map
  const svcMap = Object.fromEntries(services.map((s) => [s.id, s.name]));
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e.name]));

  // By service
  const bySvc = {};
  curr.filter((b) => b.status !== "CANCELLED").forEach((b) => {
    const name = svcMap[b.serviceId] || `Servicio ${b.serviceId}`;
    bySvc[name] = (bySvc[name] || 0) + 1;
  });
  const svcRanked = Object.entries(bySvc).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // By employee
  const byEmp = {};
  curr.filter((b) => b.status !== "CANCELLED").forEach((b) => {
    const name = empMap[b.employeeId] || `Empleado ${b.employeeId}`;
    byEmp[name] = (byEmp[name] || 0) + 1;
  });
  const empRanked = Object.entries(byEmp).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // By day of week (Mon=0..Sun=6)
  const byDow = [0, 0, 0, 0, 0, 0, 0];
  curr.filter((b) => b.status !== "CANCELLED").forEach((b) => {
    const dow = (new Date(b.date + "T00:00:00").getDay() + 6) % 7;
    byDow[dow]++;
  });
  const maxDow = Math.max(...byDow, 1);

  // By hour (07–21)
  const HOURS = Array.from({ length: 16 }, (_, i) => String(i + 7).padStart(2, "0"));
  const byHour = {};
  HOURS.forEach((h) => (byHour[h] = 0));
  curr.filter((b) => b.status !== "CANCELLED").forEach((b) => {
    const h = b.startTime?.slice(0, 2);
    if (h && byHour[h] !== undefined) byHour[h]++;
  });
  const maxHour = Math.max(...Object.values(byHour), 1);

  // Peak hour
  const peakHour = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];
  // Peak day
  const peakDow = byDow.indexOf(Math.max(...byDow));

  const periodLabel = fmtPeriodLabel(preset, from, to);
  const maxSvc = svcRanked[0]?.[1] || 1;
  const maxEmp = empRanked[0]?.[1] || 1;

  if (loading) return <div className="empty">Cargando…</div>;

  return (
    <>
      {/* Period picker */}
      <div className="an-period">
        <div className="an-seg">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className={`an-seg-btn${preset === p.id ? " active" : ""}`}
              onClick={() => setPreset(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <div className="an-range-inputs">
            <input type="date" className="an-date-input" value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)} />
            <span style={{ color: "var(--ink-muted)", fontSize: "0.8rem" }}>–</span>
            <input type="date" className="an-date-input" value={customTo}
              onChange={(e) => setCustomTo(e.target.value)} />
          </div>
        )}
        <span className="an-period-label">{periodLabel}</span>
      </div>

      {/* KPI cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total reservas</div>
          <div className="stat-value">{total}</div>
          <DeltaBadge curr={total} prev={prev.length} />
        </div>
        <div className="stat-card">
          <div className="stat-label">Confirmadas</div>
          <div className="stat-value">{confirmed}</div>
          <div className="stat-sub">{total > 0 ? Math.round(confirmed/total*100) : 0}% del total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Canceladas</div>
          <div className="stat-value">{cancelled}</div>
          <div className="stat-sub">{cancelRate}% tasa de cancelación</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Clientes únicos</div>
          <div className="stat-value">{unique}</div>
          <DeltaBadge curr={unique} prev={new Set(prev.map((b) => b.customerEmail || b.customerName)).size} />
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Media / día</div>
          <div className="stat-value" style={{ fontSize: "1.9rem" }}>{avgPerDay}</div>
          <div className="stat-sub">{daySpan} días en el período</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pendientes</div>
          <div className="stat-value">{pending}</div>
          <div className="stat-sub">Sin confirmar</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Hora punta</div>
          <div className="stat-value" style={{ fontSize: "1.9rem" }}>{peakHour?.[1] > 0 ? `${peakHour[0]}h` : "—"}</div>
          <div className="stat-sub">{peakHour?.[1] > 0 ? `${peakHour[1]} reservas` : "Sin datos"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Día más activo</div>
          <div className="stat-value" style={{ fontSize: "1.7rem" }}>{Math.max(...byDow) > 0 ? DOW_ES_SHORT[peakDow] : "—"}</div>
          <div className="stat-sub">{Math.max(...byDow) > 0 ? `${byDow[peakDow]} reservas` : "Sin datos"}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="an-charts-row">
        <div className="an-chart-card">
          <div className="an-chart-title">Por servicio</div>
          {svcRanked.length === 0
            ? <div className="an-empty">Sin reservas en este período</div>
            : svcRanked.map(([name, count]) => <HBar key={name} label={name} count={count} max={maxSvc} />)
          }
        </div>
        <div className="an-chart-card">
          <div className="an-chart-title">Por empleado</div>
          {empRanked.length === 0
            ? <div className="an-empty">Sin reservas en este período</div>
            : empRanked.map(([name, count]) => <HBar key={name} label={name} count={count} max={maxEmp} color="ochre" />)
          }
        </div>
      </div>

      <div className="an-charts-row">
        <div className="an-chart-card">
          <div className="an-chart-title">Por día de la semana</div>
          <div className="an-dow-grid">
            {DOW_ES_SHORT.map((label, i) => (
              <div key={i} className="an-dow-col">
                <div className="an-dow-bar" style={{ height: `${Math.round((byDow[i] / maxDow) * 60)}px` }} />
                <span className="an-dow-label">{label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            {byDow.map((n, i) => (
              <span key={i} style={{ flex: 1, textAlign: "center", fontSize: "0.64rem", color: "var(--ink-muted)" }}>{n}</span>
            ))}
          </div>
        </div>
        <div className="an-chart-card">
          <div className="an-chart-title">Por franja horaria</div>
          <div className="an-hour-grid">
            {HOURS.map((h) => (
              <div key={h} className="an-hour-col">
                <div className="an-hour-bar" style={{ height: `${Math.round((byHour[h] / maxHour) * 48)}px` }} />
                <span className="an-hour-label">{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking table */}
      <div className="section-header" style={{ marginTop: 8 }}>
        <div className="section-title">Reservas del período</div>
        <button className="btn-sm" onClick={() => setSection("bookings")}>Ver gestión →</button>
      </div>
      <div className="an-table-wrap">
        {curr.length === 0 ? (
          <div className="empty">No hay reservas en este período.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Servicio</th>
                <th>Empleado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {curr.sort((a, b) => b.date.localeCompare(a.date) || b.startTime?.localeCompare(a.startTime)).slice(0, 50).map((b) => (
                <tr key={b.id}>
                  <td>{b.customerName}</td>
                  <td>{b.date}</td>
                  <td>{b.startTime?.slice(0, 5)}</td>
                  <td style={{ color: "var(--ink-muted)", fontSize: "0.82rem" }}>{svcMap[b.serviceId] || "—"}</td>
                  <td style={{ color: "var(--ink-muted)", fontSize: "0.82rem" }}>{empMap[b.employeeId] || "—"}</td>
                  <td><span className={`badge badge-${b.status.toLowerCase()}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/* ── CLOSURE CALENDAR COMPONENT ── */
const CL_WEEKDAYS_ES = ["L", "M", "X", "J", "V", "S", "D"];
const toDateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayKey = toDateKey(new Date());

function ClosureCalendar({
  closures, setClosures,
  clViewDate, setClViewDate,
  clSelected, setClSelected,
  clMsg, setClMsg,
  businessDaysOfWeek,
}) {
  const year = clViewDate.getFullYear();
  const month = clViewDate.getMonth();
  const monthLabel = new Date(year, month, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = startOffset - 1; i >= 0; i--)
    cells.push({ date: new Date(year, month - 1, prevMonthDays - i), otherMonth: true });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: new Date(year, month, d), otherMonth: false });
  const remainder = cells.length % 7;
  if (remainder > 0)
    for (let d = 1; d <= 7 - remainder; d++)
      cells.push({ date: new Date(year, month + 1, d), otherMonth: true });

  const prevMonth = () => setClViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setClViewDate(new Date(year, month + 1, 1));

  const toggleSelect = (key, isPast, isStructClosed, isOtherMonth) => {
    if (isPast || isStructClosed || isOtherMonth) return;
    setClSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const markClosed = async () => {
    const dates = [...clSelected];
    try {
      await api("/api/tenant/closures", { method: "POST", body: JSON.stringify(dates) });
      setClosures((prev) => { const next = new Set(prev); dates.forEach((d) => next.add(d)); return next; });
      setClSelected(new Set());
      setClMsg({ type: "ok", text: `${dates.length} día(s) marcado(s) como cerrado.` });
    } catch { setClMsg({ type: "err", text: "Error al guardar los cierres." }); }
  };

  const reopen = async () => {
    const dates = [...clSelected];
    try {
      await api("/api/tenant/closures", { method: "DELETE", body: JSON.stringify(dates) });
      setClosures((prev) => { const next = new Set(prev); dates.forEach((d) => next.delete(d)); return next; });
      setClSelected(new Set());
      setClMsg({ type: "ok", text: `${dates.length} día(s) reabierto(s).` });
    } catch { setClMsg({ type: "err", text: "Error al reabrir los días." }); }
  };

  const selHasClosed = [...clSelected].some((k) => closures.has(k));
  const selHasOpen   = [...clSelected].some((k) => !closures.has(k));

  return (
    <div className="card" style={{ marginTop: "20px" }}>
      <div className="card-title">Calendario de cierres excepcionales</div>
      <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", marginBottom: "18px", lineHeight: 1.5 }}>
        Marca días concretos como cerrados por festivos, vacaciones u otros imprevistos. Los clientes no podrán reservar esos días aunque el negocio tenga horario ese día de la semana.
      </p>
      {clMsg && <div className={`alert ${clMsg.type}`} style={{ marginBottom: "14px" }}>{clMsg.text}</div>}

      <div className="cl-nav">
        <button className="cl-nav-btn" onClick={prevMonth}>‹</button>
        <span className="cl-month-label">{monthLabel}</span>
        <button className="cl-nav-btn" onClick={nextMonth}>›</button>
      </div>

      <div className="cl-weekdays">
        {CL_WEEKDAYS_ES.map((d) => <div key={d} className="cl-weekday">{d}</div>)}
      </div>

      <div className="cl-grid">
        {cells.map((cell, i) => {
          const key = toDateKey(cell.date);
          const jsDay = cell.date.getDay();
          const isStructClosed = !cell.otherMonth && !businessDaysOfWeek.has(jsDay);
          const isClosed = closures.has(key);
          const isSelected = clSelected.has(key);
          const isPast = !cell.otherMonth && key < todayKey;
          const isToday = key === todayKey;

          let cls = "cl-day";
          if (cell.otherMonth)       cls += " cl-other-month";
          else if (isPast)           cls += " cl-past cl-struct-closed";
          else if (isStructClosed)   cls += " cl-struct-closed";
          else if (isClosed)         cls += " cl-closed" + (isSelected ? " cl-selected" : "");
          else                       cls += " cl-open"   + (isSelected ? " cl-selected" : "");
          if (isToday && !cell.otherMonth) cls += " cl-today";

          return (
            <div key={i} className={cls}
              onClick={() => toggleSelect(key, isPast, isStructClosed, cell.otherMonth)}
              title={isStructClosed && !cell.otherMonth ? "Día sin horario configurado" : undefined}
            >
              {cell.date.getDate()}
              {isClosed && !cell.otherMonth && <span className="cl-closed-dot" />}
            </div>
          );
        })}
      </div>

      <div className="cl-legend">
        <span className="cl-legend-item"><span className="cl-legend-dot" style={{ background: "var(--white)", border: "1.5px solid var(--stone-border)" }} />Abierto</span>
        <span className="cl-legend-item"><span className="cl-legend-dot" style={{ background: "rgba(220,38,38,0.12)", border: "1.5px solid rgba(220,38,38,0.3)" }} />Cerrado (excepción)</span>
        <span className="cl-legend-item"><span className="cl-legend-dot" style={{ background: "var(--stone)" }} />Sin horario ese día</span>
      </div>

      {clSelected.size > 0 && (
        <div className="cl-actions">
          <span className="cl-sel-count">{clSelected.size} día(s) seleccionado(s)</span>
          {selHasOpen   && <button className="btn-close-day"  onClick={markClosed}>Marcar como cerrado</button>}
          {selHasClosed && <button className="btn-reopen-day" onClick={reopen}>Reabrir</button>}
          <button className="btn-sm" onClick={() => setClSelected(new Set())}>Cancelar selección</button>
        </div>
      )}
    </div>
  );
}

/* ── EMPRESA ── */
function Empresa({ onHoursSaved }) {
  const [tenant, setTenant] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    maxCapacity: "",
  });
  const [msg, setMsg] = useState(null);
  const [copied, setCopied] = useState(false);
  const [bhByDay, setBhByDay] = useState(() => Object.fromEntries(DAYS.map((d) => [d, []])));
  const [bhMsg, setBhMsg] = useState(null);
  // Closure calendar state
  const [closures, setClosures] = useState(new Set()); // Set of "YYYY-MM-DD" strings
  const [clViewDate, setClViewDate] = useState(() => new Date());
  const [clSelected, setClSelected] = useState(new Set()); // selected day strings
  const [clMsg, setClMsg] = useState(null);
  const [businessDaysOfWeek, setBusinessDaysOfWeek] = useState(new Set()); // JS getDay() values
  const [docs, setDocs] = useState([]);
  const [docsMsg, setDocsMsg] = useState(null);
  const [docUploading, setDocUploading] = useState(false);

  useEffect(() => {
    api("/api/tenant")
      .then((data) => {
        setTenant(data);
        setForm({
          name: data.name,
          email: data.email,
          phone: data.phone || "",
          address: data.address || "",
          maxCapacity: data.maxCapacity != null ? String(data.maxCapacity) : "",
          allowEmployeeChoice: data.allowEmployeeChoice ?? false,
        });
      })
      .catch(() => {});

    api("/api/tenant/hours")
      .then((data) => {
        const map = Object.fromEntries(DAYS.map((d) => [d, []]));
        // Días de la semana (JS getDay()) en que el negocio tiene horario.
        const DOW_MAP = { MONDAY:1,TUESDAY:2,WEDNESDAY:3,THURSDAY:4,FRIDAY:5,SATURDAY:6,SUNDAY:0 };
        const openJs = new Set();
        data.forEach((h) => {
          if (!map[h.dayOfWeek]) map[h.dayOfWeek] = [];
          map[h.dayOfWeek].push({
            startTime: h.startTime?.slice(0, 5) || "",
            endTime: h.endTime?.slice(0, 5) || "",
          });
          if (DOW_MAP[h.dayOfWeek] !== undefined) openJs.add(DOW_MAP[h.dayOfWeek]);
        });
        setBhByDay(map);
        setBusinessDaysOfWeek(openJs);
      })
      .catch(() => {});

    api("/api/tenant/closures")
      .then((dates) => setClosures(new Set(dates)))
      .catch(() => {});

    api("/api/tenant/documents")
      .then(setDocs)
      .catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      const updated = await api("/api/tenant", {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          maxCapacity: form.maxCapacity !== "" ? Number(form.maxCapacity) : null,
        }),
      });
      setTenant(updated);
      localStorage.setItem("tenantName", updated.name);
      setMsg({ type: "ok", text: "Datos actualizados correctamente." });
    } catch {
      setMsg({ type: "err", text: "Error al guardar los datos." });
    }
  };

  const saveBusinessHours = async () => {
    const pad = (t) => (t && t.length === 5 ? t + ":00" : t || "");
    const payload = [];
    DAYS.forEach((day) => {
      (bhByDay[day] || []).forEach((b) => {
        if (b.startTime && b.endTime)
          payload.push({ dayOfWeek: day, startTime: pad(b.startTime), endTime: pad(b.endTime) });
      });
    });
    try {
      await api("/api/tenant/hours", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      // Actualizar los días abiertos para que el calendario de cierres los refleje sin recargar
      const DOW_MAP = { MONDAY:1,TUESDAY:2,WEDNESDAY:3,THURSDAY:4,FRIDAY:5,SATURDAY:6,SUNDAY:0 };
      const openJs = new Set(payload.map((h) => DOW_MAP[h.dayOfWeek]).filter((d) => d !== undefined));
      setBusinessDaysOfWeek(openJs);
      setBhMsg({ type: "ok", text: "Horario guardado." });
      if (payload.length > 0 && onHoursSaved) onHoursSaved();
    } catch {
      setBhMsg({ type: "err", text: "Error al guardar el horario." });
    }
  };

  const addBhBlock = (day) =>
    setBhByDay((p) => ({ ...p, [day]: [...p[day], { startTime: "", endTime: "" }] }));
  const removeBhBlock = (day, idx) =>
    setBhByDay((p) => ({ ...p, [day]: p[day].filter((_, i) => i !== idx) }));
  const updateBhBlock = (day, idx, key, val) =>
    setBhByDay((p) => ({
      ...p,
      [day]: p[day].map((b, i) => (i === idx ? { ...b, [key]: val } : b)),
    }));

  const bookingUrl = tenant ? `${window.location.origin}/booking/${tenant.slug}` : "";
  const portalUrl  = tenant ? `${window.location.origin}/emp/${tenant.slug}` : "";
  const [copiedPortal, setCopiedPortal] = useState(false);
  const copyPortal = () => { if (!portalUrl) return; navigator.clipboard.writeText(portalUrl); setCopiedPortal(true); setTimeout(() => setCopiedPortal(false), 2000); };
  const copyUrl = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const uploadDocs = async (files) => {
    if (!files.length) return;
    setDocUploading(true);
    setDocsMsg(null);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      const result = await apiMultipart("/api/tenant/documents", fd);
      setDocs((prev) => [...result, ...prev]);
      setDocsMsg({ type: "ok", text: `${result.length} documento${result.length !== 1 ? "s" : ""} subido${result.length !== 1 ? "s" : ""} correctamente.` });
    } catch {
      setDocsMsg({ type: "err", text: "Error al subir los documentos." });
    } finally {
      setDocUploading(false);
    }
  };

  const deleteDoc = async (id) => {
    try {
      await api(`/api/tenant/documents/${id}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setDocsMsg({ type: "err", text: "Error al eliminar el documento." });
    }
  };

  if (!tenant) return <div className="empty">Cargando…</div>;

  return (
    <>
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}
      <div className="profile-grid">
        <div className="card">
          <div className="card-title">Perfil del negocio</div>
          <form onSubmit={save}>
            <div className="form-field">
              <label>Nombre del negocio</label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="two-col">
              <div className="form-field">
                <label>Email de contacto</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-field">
                <label>Teléfono</label>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="form-field">
              <label>Dirección</label>
              <input
                value={form.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
              />
            </div>
            <div className="form-field">
              <label>Aforo máximo simultáneo (opcional)</label>
              <input
                type="number"
                min="1"
                placeholder="Sin límite"
                value={form.maxCapacity}
                onChange={(e) =>
                  setForm((p) => ({ ...p, maxCapacity: e.target.value }))
                }
              />
              <p style={{ fontSize: "0.73rem", color: "var(--ink-muted)", marginTop: "4px", lineHeight: 1.5 }}>
                Número máximo de personas que pueden estar siendo atendidas al mismo tiempo en el local. Deja vacío si no quieres limitarlo.
              </p>
            </div>
            <div className="form-field">
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={form.allowEmployeeChoice ?? false}
                  onChange={(e) => setForm((p) => ({ ...p, allowEmployeeChoice: e.target.checked }))}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                Permitir que el cliente elija profesional
              </label>
              <p style={{ fontSize: "0.73rem", color: "var(--ink-muted)", marginTop: "4px", lineHeight: 1.5 }}>
                Si está desactivado, el sistema asigna automáticamente un profesional disponible.
              </p>
            </div>
            <div style={{ marginTop: "20px" }}>
              <button type="submit" className="btn-primary">
                Guardar cambios
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Enlace de reservas</div>
          <p
            style={{
              fontSize: "0.84rem",
              color: "var(--ink-muted)",
              marginBottom: "20px",
              lineHeight: 1.6,
            }}
          >
            Comparte este enlace con tus clientes para que reserven directamente
            desde su navegador, sin registrarse.
          </p>
          <div className="form-field">
            <label>Identificador público (slug)</label>
            <input value={tenant.slug} readOnly className="input-readonly" />
          </div>
          <div className="form-field">
            <label>URL de reservas para clientes</label>
            <div className="link-box">
              <span className="link-text">{bookingUrl}</span>
              <button type="button" className={`copy-btn${copied ? " ok" : ""}`} onClick={copyUrl}>
                {copied ? "✓ Copiado" : "Copiar"}
              </button>
            </div>
          </div>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>URL del portal de empleados</label>
            <div className="link-box">
              <span className="link-text">{portalUrl}</span>
              <button type="button" className={`copy-btn${copiedPortal ? " ok" : ""}`} onClick={copyPortal}>
                {copiedPortal ? "✓ Copiado" : "Copiar"}
              </button>
            </div>
          </div>
        </div>
      </div>


      <div className="card" style={{ marginTop: "20px" }}>
        <div className="card-title">Horario del negocio</div>
        {bhMsg && (
          <div className={`alert ${bhMsg.type}`} style={{ marginBottom: "16px" }}>
            {bhMsg.text}
          </div>
        )}
        <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", marginBottom: "18px", lineHeight: 1.5 }}>
          Define el horario general de apertura. Puedes añadir jornadas partidas con varios bloques por día.
        </p>
        {DAYS.map((day) => (
          <div key={day} className="sh-day-block">
            <div className="sh-day-header">
              <span className="sh-day-name">{DAY_ES[day]}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {bhByDay[day].length === 0 && <span className="sh-no-shifts">Cerrado</span>}
                <button className="sh-add-btn" onClick={() => addBhBlock(day)}>+ Añadir franja</button>
              </div>
            </div>
            {bhByDay[day].length > 0 && (
              <div className="sh-shifts-list">
                {bhByDay[day].map((block, idx) => (
                  <div key={idx} className="sh-shift-row">
                    <input className="sh-time" type="time" value={block.startTime}
                      onChange={(e) => updateBhBlock(day, idx, "startTime", e.target.value)} />
                    <span className="sh-sep">–</span>
                    <input className="sh-time" type="time" value={block.endTime}
                      onChange={(e) => updateBhBlock(day, idx, "endTime", e.target.value)} />
                    <button className="sh-del-btn" onClick={() => removeBhBlock(day, idx)} title="Eliminar franja">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <div
          style={{
            marginTop: "16px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button className="btn-primary" onClick={saveBusinessHours}>
            Guardar horario
          </button>
        </div>
      </div>

      <ClosureCalendar
        closures={closures}
        setClosures={setClosures}
        clViewDate={clViewDate}
        setClViewDate={setClViewDate}
        clSelected={clSelected}
        setClSelected={setClSelected}
        clMsg={clMsg}
        setClMsg={setClMsg}
        businessDaysOfWeek={businessDaysOfWeek}
      />

      <div className="card" style={{ marginTop: "20px" }}>
        <div className="card-title">Documentos del negocio</div>
        <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", marginBottom: "18px", lineHeight: 1.5 }}>
          Sube PDFs que tus clientes podrán consultar directamente en la página de reservas (política de cancelación, tarifas, información importante…).
        </p>
        {docsMsg && (
          <div className={`alert ${docsMsg.type}`} style={{ marginBottom: "14px" }}>
            {docsMsg.text}
          </div>
        )}
        <label
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "9px 18px", background: "var(--blue)", color: "#fff",
            borderRadius: "7px", fontSize: "0.84rem", fontWeight: 500,
            cursor: docUploading ? "wait" : "pointer", opacity: docUploading ? 0.6 : 1,
            marginBottom: "20px",
          }}
        >
          {docUploading ? "Subiendo…" : "+ Subir PDF(s)"}
          <input
            type="file"
            accept=".pdf,application/pdf"
            multiple
            style={{ display: "none" }}
            disabled={docUploading}
            onChange={(e) => { uploadDocs(Array.from(e.target.files)); e.target.value = ""; }}
          />
        </label>
        {docs.length === 0 ? (
          <div style={{ fontSize: "0.82rem", color: "var(--ink-muted)" }}>No hay documentos aún.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {docs.map((d) => (
              <div
                key={d.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", background: "var(--stone)", borderRadius: "8px",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1.1rem" }}>📄</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{d.displayName}</span>
                </div>
                <button className="btn-danger" onClick={() => deleteDoc(d.id)}>Eliminar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <div className="card-title">Previsualización del portal de reservas</div>
        <div className="preview-wrap">
          <p className="preview-desc">
            Así es como verán tus clientes la página de reservas al acceder
            a tu enlace personalizado.
          </p>
          <div className="preview-device">
            <div className="preview-screen">
              <iframe
                src={`/booking/${tenant.slug}`}
                title="Vista previa del portal de reservas"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="preview-open-btn"
          >
            ↗ Abrir en pantalla completa
          </a>
        </div>
      </div>
    </>
  );
}

/* ── SERVICES ── */
const SVC_MODES = [
  { id: "sequential", label: "Cita individual",       desc: "Un cliente por empleado a la vez" },
  { id: "capacity",   label: "Aforo / Grupo",          desc: "Varios clientes hasta un límite" },
  { id: "split",      label: "Con tiempo de espera",   desc: "El profesional puede atender otro cliente mientras el anterior espera" },
];

function Services() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [step, setStep] = useState("create");
  const [editingService, setEditingService] = useState(null);
  const [serviceEmployees, setServiceEmployees] = useState([]);
  const [form, setForm] = useState({ name: "", duration: "", capacity: "", chairTime: "", price: "", defaultEmployeeId: "" });
  const [serviceMode, setServiceMode] = useState("sequential");
  const [sinLimite, setSinLimite] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [createdService, setCreatedService] = useState(null);
  const [serviceFields, setServiceFields] = useState([]);
  const [fieldForm, setFieldForm] = useState({
    label: "",
    fieldType: "TEXT",
    required: false,
  });
  const [msg, setMsg] = useState(null);

  const FIELD_TYPE_LABELS = {
    TEXT: "Texto",
    NUMBER: "Número",
    SELECT: "Selección",
  };

  const load = () =>
    api("/api/services")
      .then(setItems)
      .catch(() => {});
  useEffect(() => {
    load();
    api("/api/employees").then(setServiceEmployees).catch(() => {});
  }, []);

  const loadFields = (serviceId) =>
    api(`/api/services/${serviceId}/fields`)
      .then(setServiceFields)
      .catch(() => {});

  const openCreate = () => {
    setEditingService(null);
    setForm({ name: "", duration: "", capacity: "", chairTime: "", price: "", defaultEmployeeId: "" });
    setServiceMode("sequential");
    setSinLimite(false);
    setShowPrice(false);
    setCreatedService(null);
    setServiceFields([]);
    setFieldForm({ label: "", fieldType: "TEXT", required: false });
    setStep("create");
    setModal(true);
  };

  const openEdit = async (svc) => {
    setEditingService(svc);
    const hasCapacity = svc.capacity != null;
    setForm({ name: svc.name, duration: String(svc.duration), capacity: (hasCapacity && svc.capacity > 0) ? String(svc.capacity) : "", chairTime: svc.chairTime ? String(svc.chairTime) : "", price: svc.price != null ? String(svc.price) : "", defaultEmployeeId: svc.defaultEmployeeId ? String(svc.defaultEmployeeId) : "" });
    setServiceMode(hasCapacity ? "capacity" : svc.chairTime ? "split" : "sequential");
    setSinLimite(hasCapacity && svc.capacity === 0);
    setShowPrice(svc.price != null);
    setCreatedService(null);
    setServiceFields([]);
    setFieldForm({ label: "", fieldType: "TEXT", required: false });
    setStep("create");
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    load();
  };

  const saveService = async (e) => {
    e.preventDefault();
    try {
      const body = {
        name: form.name,
        duration: Number(form.duration),
        capacity: serviceMode === "capacity"
          ? (sinLimite ? 0 : (form.capacity ? Number(form.capacity) : null))
          : null,
        chairTime: serviceMode === "split" && form.chairTime ? Number(form.chairTime) : null,
        price: showPrice && form.price ? Number(form.price) : null,
        defaultEmployeeId: form.defaultEmployeeId ? Number(form.defaultEmployeeId) : null,
      };
      const svc = editingService
        ? await api(`/api/services/${editingService.id}`, {
            method: "PUT",
            body: JSON.stringify(body),
          })
        : await api("/api/services", {
            method: "POST",
            body: JSON.stringify(body),
          });
      setCreatedService(svc);
      await loadFields(svc.id);
      setStep("fields");
    } catch {
      setMsg({ type: "err", text: "Error al guardar el servicio." });
    }
  };

  const addField = async (e) => {
    e.preventDefault();
    try {
      await api(`/api/services/${createdService.id}/fields`, {
        method: "POST",
        body: JSON.stringify({
          ...fieldForm,
          fieldOrder: serviceFields.length + 1,
        }),
      });
      setFieldForm({ label: "", fieldType: "TEXT", required: false });
      await loadFields(createdService.id);
    } catch {
      setMsg({ type: "err", text: "Error al añadir el campo." });
    }
  };

  const removeField = async (fieldId) => {
    try {
      await api(`/api/fields/${fieldId}`, { method: "DELETE" });
      await loadFields(createdService.id);
    } catch {
      setMsg({ type: "err", text: "Error al eliminar el campo." });
    }
  };

  const toggleActive = async (id, active) => {
    try {
      await api(`/api/services/${id}/active?active=${active}`, { method: "PATCH" });
      load();
    } catch {
      setMsg({ type: "err", text: "Error al cambiar el estado del servicio." });
    }
  };

  const delService = async (id) => {
    try {
      await api(`/api/services/${id}`, { method: "DELETE" });
      load();
    } catch {
      setMsg({ type: "err", text: "Error al eliminar el servicio." });
    }
  };

  return (
    <>
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}
      <div className="section-header">
        <div className="section-title">Todos los servicios</div>
        <button className="btn-primary" onClick={openCreate}>
          + Nuevo servicio
        </button>
      </div>
      <div className="table-wrap">
        {items.length === 0 ? (
          <div className="empty">No hay servicios. Crea el primero.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Duración</th>
                <th>Capacidad</th>
                <th>Precio</th>
                <th>Campos</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.name}</strong>
                  </td>
                  <td>{s.duration} min</td>
                  <td>{s.capacity == null ? "—" : s.capacity === 0 ? "Sin límite" : `${s.capacity} pers.`}</td>
                  <td>{s.price != null ? `${Number(s.price).toFixed(2)} €` : "—"}</td>
                  <td>
                    {s.fields?.length || 0} campo
                    {(s.fields?.length || 0) !== 1 ? "s" : ""}
                  </td>
                  <td>
                    <span
                      className={`badge badge-${s.active ? "active" : "inactive"}`}
                    >
                      {s.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className="btn-sm" onClick={() => openEdit(s)}>
                        Editar
                      </button>
                      <button
                        className="btn-sm"
                        onClick={() => toggleActive(s.id, !s.active)}
                      >
                        {s.active ? "Desactivar" : "Activar"}
                      </button>
                      <button className="btn-danger" onClick={() => delService(s.id)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="overlay" onClick={closeModal}>
          <div
            className="modal modal-wide"
            onClick={(e) => e.stopPropagation()}
          >
            {step === "create" ? (
              <>
                <div className="modal-title">
                  {editingService
                    ? `Editar «${editingService.name}»`
                    : "Nuevo servicio"}
                </div>
                <form onSubmit={saveService}>
                  <div className="form-field">
                    <label>Nombre</label>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Duración (min)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.duration}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, duration: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label style={{ marginBottom: "8px", display: "block" }}>¿Cómo se atiende este servicio?</label>
                    <div className="svc-seg">
                      {SVC_MODES.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className={`svc-seg-btn${serviceMode === m.id ? " active" : ""}`}
                          onClick={() => { setServiceMode(m.id); setSinLimite(false); }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                    <div className="svc-mode-desc">
                      {SVC_MODES.find((m) => m.id === serviceMode)?.desc}
                    </div>
                  </div>

                  {serviceMode === "capacity" && (
                    <div className="form-field">
                      <label
                        style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", textTransform: "none", letterSpacing: 0, fontSize: "0.78rem", color: "var(--ink)", fontWeight: 400 }}
                      >
                        <input
                          type="checkbox"
                          checked={sinLimite}
                          onChange={(e) => setSinLimite(e.target.checked)}
                          style={{ width: "auto", accentColor: "var(--blue)" }}
                        />
                        Sin límite de plazas (aceptar todos los clientes)
                      </label>
                      {!sinLimite && (
                        <input
                          type="number"
                          min="2"
                          placeholder="Nº máximo de clientes"
                          value={form.capacity}
                          onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
                          required
                        />
                      )}
                    </div>
                  )}

                  {serviceMode === "split" && (
                    <div className="form-field">
                      <label>Tiempo activo del profesional (min)</label>
                      <input
                        type="number"
                        min="1"
                        value={form.chairTime}
                        onChange={(e) => setForm((p) => ({ ...p, chairTime: e.target.value }))}
                        required
                      />
                      <p style={{ fontSize: "0.74rem", color: "var(--ink-muted)", marginTop: "4px", lineHeight: 1.5 }}>
                        Minutos que el profesional necesita estar presente. El resto de la duración total es espera pasiva.
                      </p>
                    </div>
                  )}
                  <div className="form-field">
                    <label
                      style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", textTransform: "none", letterSpacing: 0, fontSize: "0.78rem", color: "var(--ink)", fontWeight: 400 }}
                    >
                      <input
                        type="checkbox"
                        checked={showPrice}
                        onChange={(e) => { setShowPrice(e.target.checked); if (!e.target.checked) setForm((p) => ({ ...p, price: "" })); }}
                        style={{ width: "auto", accentColor: "var(--blue)" }}
                      />
                      Añadir precio al servicio
                    </label>
                    {showPrice && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={form.price}
                          onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                          style={{ flex: 1 }}
                          required
                        />
                        <span style={{ fontSize: "0.9rem", color: "var(--ink-muted)", flexShrink: 0 }}>€</span>
                      </div>
                    )}
                  </div>

                  {serviceEmployees.length > 0 && (
                    <div className="form-field">
                      <label>Empleado asignado por defecto</label>
                      <select
                        value={form.defaultEmployeeId}
                        onChange={(e) => setForm((p) => ({ ...p, defaultEmployeeId: e.target.value }))}
                      >
                        <option value="">Sin asignar (cualquier empleado)</option>
                        {serviceEmployees.map((e) => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                      <p style={{ fontSize: "0.74rem", color: "var(--ink-muted)", marginTop: "4px", lineHeight: 1.5 }}>
                        Las reservas de este servicio se asignarán siempre a este empleado.
                      </p>
                    </div>
                  )}

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={closeModal}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary">
                      {editingService
                        ? "Guardar y gestionar campos →"
                        : "Crear y añadir campos →"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="modal-title">
                  Campos de «{createdService.name}»
                </div>
                <div className="fields-list">
                  {serviceFields.length === 0 ? (
                    <div
                      style={{
                        color: "var(--ink-muted)",
                        fontSize: "0.82rem",
                        padding: "6px 0",
                      }}
                    >
                      Sin campos aún.
                    </div>
                  ) : (
                    serviceFields.map((f) => (
                      <div key={f.id} className="field-item">
                        <div className="field-item-left">
                          <strong style={{ fontSize: "0.84rem" }}>
                            {f.label}
                          </strong>
                          <span className="field-item-meta">
                            {FIELD_TYPE_LABELS[f.fieldType]}
                            {f.required ? " · Obligatorio" : ""}
                          </span>
                        </div>
                        <button
                          className="btn-danger"
                          style={{ padding: "4px 10px" }}
                          onClick={() => removeField(f.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <hr className="section-divider" />
                <form onSubmit={addField}>
                  <div className="three-col">
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label>Etiqueta</label>
                      <input
                        value={fieldForm.label}
                        onChange={(e) =>
                          setFieldForm((p) => ({ ...p, label: e.target.value }))
                        }
                        placeholder="Ej: Color, Notas, Edad…"
                        required
                      />
                    </div>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label>Tipo</label>
                      <select
                        value={fieldForm.fieldType}
                        onChange={(e) =>
                          setFieldForm((p) => ({
                            ...p,
                            fieldType: e.target.value,
                          }))
                        }
                      >
                        <option value="TEXT">Texto</option>
                        <option value="NUMBER">Número</option>
                        <option value="SELECT">Selección</option>
                      </select>
                    </div>
                    <div
                      className="form-field"
                      style={{
                        marginBottom: 0,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          textTransform: "none",
                          letterSpacing: 0,
                          fontSize: "0.82rem",
                          color: "var(--ink)",
                          fontWeight: 400,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={fieldForm.required}
                          onChange={(e) =>
                            setFieldForm((p) => ({
                              ...p,
                              required: e.target.checked,
                            }))
                          }
                          style={{ width: "auto", padding: 0 }}
                        />
                        Obligatorio
                      </label>
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: "10px",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button type="submit" className="btn-sm">
                      + Añadir campo
                    </button>
                  </div>
                </form>
                <hr className="section-divider" />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn-primary" onClick={closeModal}>
                    Finalizar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function EmpServicesBadge({ serviceIds, allServices }) {
  const [open, setOpen] = useState(false);
  if (!serviceIds || serviceIds.length === 0)
    return <span style={{ color: "var(--blue)", fontWeight: 500 }}>Todos</span>;
  const names = serviceIds.map((sid) => allServices.find((s) => s.id === sid)?.name).filter(Boolean);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        className="btn-sm"
        style={{ fontSize: "0.72rem" }}
        onClick={() => setOpen((o) => !o)}
      >
        {names.length} servicio{names.length !== 1 ? "s" : ""} {open ? "▲" : "▼"}
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
          background: "var(--white)", border: "1px solid var(--stone-border)",
          borderRadius: "10px", padding: "8px 0", minWidth: "180px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)"
        }}>
          {names.map((n, i) => (
            <div key={i} style={{ padding: "6px 14px", fontSize: "0.78rem", color: "var(--ink)", borderBottom: i < names.length - 1 ? "1px solid var(--stone)" : "none" }}>
              {n}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── EMPLOYEES ── */
function Employees() {
  const [items, setItems] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [modal, setModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", pin: "" });
  const [empAllSvcs, setEmpAllSvcs] = useState(true);
  const [empSvcIds, setEmpSvcIds] = useState([]);
  const [msg, setMsg] = useState(null);

  const load = () => api("/api/employees").then(setItems).catch(() => {});
  useEffect(() => {
    load();
    api("/api/services").then(setAllServices).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingEmp(null);
    setForm({ name: "", email: "", phone: "", pin: "" });
    setEmpAllSvcs(true);
    setEmpSvcIds([]);
    setModal(true);
  };

  const openEdit = (emp) => {
    setEditingEmp(emp);
    setForm({ name: emp.name, email: emp.email || "", phone: emp.phone || "", pin: "" });
    setEmpAllSvcs(!emp.serviceIds || emp.serviceIds.length === 0);
    setEmpSvcIds(emp.serviceIds || []);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editingEmp) {
        await api(`/api/employees/${editingEmp.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...form, serviceIds: empAllSvcs ? [] : empSvcIds }),
        });
        setMsg({ type: "ok", text: "Empleado actualizado." });
      } else {
        await api("/api/employees", {
          method: "POST",
          body: JSON.stringify({ ...form, serviceIds: empAllSvcs ? [] : empSvcIds }),
        });
        setMsg({ type: "ok", text: "Empleado creado." });
      }
      setModal(false);
      setForm({ name: "", email: "", phone: "", pin: "" });
      setEmpAllSvcs(true);
      setEmpSvcIds([]);
      load();
    } catch {
      setMsg({ type: "err", text: editingEmp ? "Error al actualizar." : "Error al crear." });
    }
  };

  const toggleActive = async (emp) => {
    try {
      await api(`/api/employees/${emp.id}/active`, { method: "PATCH" });
      load();
      setMsg({ type: "ok", text: emp.active ? `${emp.name} desactivado.` : `${emp.name} activado.` });
    } catch {
      setMsg({ type: "err", text: "Error al cambiar estado." });
    }
  };

  return (
    <>
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}
      <div className="section-header">
        <div className="section-title">Todos los empleados</div>
        <button className="btn-primary" onClick={openCreate}>
          + Nuevo empleado
        </button>
      </div>

      <div className="table-wrap">
        {items.length === 0 ? (
          <div className="empty">No hay empleados. Añade el primero.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Servicios</th>
                <th>Portal</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} style={!e.active ? { opacity: 0.55 } : undefined}>
                  <td><strong>{e.name}</strong></td>
                  <td>{e.email}</td>
                  <td>{e.phone}</td>
                  <td style={{ fontSize: "0.78rem" }}>
                    <EmpServicesBadge serviceIds={e.serviceIds} allServices={allServices} />
                  </td>
                  <td style={{ fontSize: "0.76rem", fontFamily: "monospace", letterSpacing: "0.1em" }}>
                    {e.pin
                      ? <span style={{ color: "var(--blue)", fontWeight: 600 }}>{e.pin}</span>
                      : <span style={{ color: "var(--ink-muted)" }}>Sin PIN</span>}
                  </td>
                  <td>
                    <span className={`badge badge-${e.active ? "active" : "inactive"}`}>
                      {e.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: "6px" }}>
                    <button className="btn-sm" onClick={() => openEdit(e)}>
                      Editar
                    </button>
                    <button
                      className={e.active ? "btn-danger" : "btn-sm"}
                      onClick={() => toggleActive(e)}
                    >
                      {e.active ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{editingEmp ? "Editar empleado" : "Nuevo empleado"}</div>
            <form onSubmit={save}>
              <div className="form-field">
                <label>Nombre</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="two-col">
                <div className="form-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="form-field">
                  <label>Teléfono</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-field">
                <label>Servicios que realiza</label>
                <label className="emp-svc-item" style={{ marginTop: "8px" }}>
                  <input
                    type="checkbox"
                    checked={empAllSvcs}
                    onChange={(ev) => { setEmpAllSvcs(ev.target.checked); if (ev.target.checked) setEmpSvcIds([]); }}
                  />
                  <span style={{ fontWeight: 500, color: "var(--blue)" }}>Todos los servicios</span>
                </label>
                {!empAllSvcs && (
                  <div className="emp-svc-list">
                    {allServices.map((s) => (
                      <label key={s.id} className="emp-svc-item">
                        <input
                          type="checkbox"
                          checked={empSvcIds.includes(s.id)}
                          onChange={(ev) => setEmpSvcIds((p) =>
                            ev.target.checked ? [...p, s.id] : p.filter((x) => x !== s.id)
                          )}
                        />
                        {s.name}
                        <span style={{ marginLeft: "auto", fontSize: "0.70rem", color: "var(--ink-muted)" }}>
                          {s.duration} min
                        </span>
                      </label>
                    ))}
                    {allServices.length === 0 && (
                      <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)", padding: "4px" }}>
                        Crea servicios primero
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-field" style={{ marginTop: "4px" }}>
                <label>PIN de acceso al portal</label>
                <input
                  type="text"
                  placeholder={editingEmp?.pin ? "Dejar vacío para no cambiar" : "4–8 dígitos"}
                  value={form.pin || ""}
                  onChange={(e) => setForm((p) => ({ ...p, pin: e.target.value }))}
                  maxLength={8}
                  style={{ fontFamily: "monospace", letterSpacing: "0.2em" }}
                />
                {editingEmp?.pin && (
                  <div style={{ fontSize: "0.70rem", color: "var(--ink-muted)", marginTop: "4px" }}>
                    PIN actual: <strong style={{ color: "var(--blue)", fontFamily: "monospace" }}>{editingEmp.pin}</strong>
                  </div>
                )}
                <div style={{ fontSize: "0.70rem", color: "var(--ink-muted)", marginTop: "4px" }}>
                  El empleado usará este PIN para entrar en <strong>/emp/{"{slug}"}</strong>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingEmp ? "Guardar cambios" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ── HOURS ── */
function Hours() {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [byDay, setByDay] = useState(() => Object.fromEntries(DAYS.map((d) => [d, []])));
  // tenantShifts: { MONDAY: [{s:"09:00", e:"14:00"}, ...], ... } — horario del negocio como referencia
  const [tenantShifts, setTenantShifts] = useState({});
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    // Cargar horario del negocio para filtrar días disponibles y ofrecer atajos de relleno.
    api("/api/tenant/hours")
      .then((data) => {
        const map = {};
        data.forEach((h) => {
          if (!map[h.dayOfWeek]) map[h.dayOfWeek] = [];
          map[h.dayOfWeek].push({ s: h.startTime?.slice(0, 5) || "", e: h.endTime?.slice(0, 5) || "" });
        });
        setTenantShifts(map);
      })
      .catch(() => {});

    api("/api/employees")
      .then((data) => {
        const active = data.filter((e) => e.active);
        setEmployees(active);
        if (active.length > 0) setSelected(active[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    api(`/api/employees/${selected}/working-hours`)
      .then((data) => {
        const map = Object.fromEntries(DAYS.map((d) => [d, []]));
        data.forEach((h) => {
          if (!map[h.dayOfWeek]) map[h.dayOfWeek] = [];
          map[h.dayOfWeek].push({
            startTime: h.startTime?.slice(0, 5) || "",
            endTime: h.endTime?.slice(0, 5) || "",
          });
        });
        setByDay(map);
      })
      .catch(() => setByDay(Object.fromEntries(DAYS.map((d) => [d, []]))));
  }, [selected]);

  // Solo días que el negocio tiene horario configurado.
  const openDays = DAYS.filter((d) => (tenantShifts[d] || []).length > 0);

  const addBlock = (day, preset = null) =>
    setByDay((p) => ({
      ...p,
      [day]: [...p[day], preset || { startTime: "", endTime: "" }],
    }));

  const removeBlock = (day, idx) =>
    setByDay((p) => ({ ...p, [day]: p[day].filter((_, i) => i !== idx) }));

  const updateBlock = (day, idx, key, val) =>
    setByDay((p) => ({
      ...p,
      [day]: p[day].map((b, i) => (i === idx ? { ...b, [key]: val } : b)),
    }));

  // Atajos de relleno basados en el horario del negocio.
  const applyPreset = (day, presetType) => {
    const shifts = tenantShifts[day] || [];
    if (shifts.length === 0) return;
    if (presetType === "shift1") {
      addBlock(day, { startTime: shifts[0].s, endTime: shifts[0].e });
    } else if (presetType === "shift2" && shifts.length >= 2) {
      addBlock(day, { startTime: shifts[1].s, endTime: shifts[1].e });
    } else if (presetType === "allday") {
      const start = shifts.reduce((min, sh) => sh.s < min ? sh.s : min, shifts[0].s);
      const end = shifts.reduce((max, sh) => sh.e > max ? sh.e : max, shifts[0].e);
      addBlock(day, { startTime: start, endTime: end });
    }
  };

  const save = async () => {
    const pad = (t) => (t && t.length === 5 ? t + ":00" : t || "");
    const payload = [];
    DAYS.forEach((day) => {
      (byDay[day] || []).forEach((b) => {
        if (b.startTime && b.endTime)
          payload.push({ dayOfWeek: day, startTime: pad(b.startTime), endTime: pad(b.endTime) });
      });
    });
    try {
      await api(`/api/employees/${selected}/working-hours`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setMsg({ type: "ok", text: "Horarios guardados." });
    } catch {
      setMsg({ type: "err", text: "Error al guardar." });
    }
  };

  if (employees.length === 0)
    return <div className="empty">No hay empleados activos. Crea uno primero desde la sección de Empleados.</div>;

  return (
    <>
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}
      <div className="section-header">
        <div className="section-title">Horarios por empleado</div>
        <select
          className="status-select"
          value={selected || ""}
          onChange={(e) => { setSelected(Number(e.target.value)); setMsg(null); }}
        >
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>
      <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", marginBottom: "20px", lineHeight: 1.5 }}>
        Solo aparecen los días en que el negocio tiene horario configurado. Usa los atajos para rellenar automáticamente desde el horario del negocio.
      </p>
      {openDays.length === 0 && (
        <div className="alert err">El negocio no tiene horario configurado. Configúralo primero en Mi Empresa → Horario del negocio.</div>
      )}
      {openDays.map((day) => {
        const shifts = tenantShifts[day] || [];
        return (
          <div key={day} className="sh-day-block">
            <div className="sh-day-header">
              <span className="sh-day-name">{DAY_ES[day]}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                {byDay[day].length === 0 && <span className="sh-no-shifts">Sin turno</span>}
                {/* Atajos de relleno automático */}
                {shifts.length >= 1 && (
                  <button className="sh-add-btn" style={{ borderColor: "var(--blue-light)", color: "var(--blue)" }}
                    onClick={() => applyPreset(day, "shift1")} title="Añadir 1ª franja del negocio">
                    + 1ª Franja
                  </button>
                )}
                {shifts.length >= 2 && (
                  <button className="sh-add-btn" style={{ borderColor: "var(--blue-light)", color: "var(--blue)" }}
                    onClick={() => applyPreset(day, "shift2")} title="Añadir 2ª franja del negocio">
                    + 2ª Franja
                  </button>
                )}
                {shifts.length >= 1 && (
                  <button className="sh-add-btn" style={{ borderColor: "var(--ochre)", color: "var(--ochre)" }}
                    onClick={() => applyPreset(day, "allday")} title="Todo el horario del negocio en un bloque">
                    + Todo el día
                  </button>
                )}
                <button className="sh-add-btn" onClick={() => addBlock(day)}>+ Manual</button>
              </div>
            </div>
            {byDay[day].length > 0 && (
              <div className="sh-shifts-list">
                {byDay[day].map((block, idx) => (
                  <div key={idx} className="sh-shift-row">
                    <input
                      className="sh-time"
                      type="time"
                      value={block.startTime}
                      onChange={(e) => updateBlock(day, idx, "startTime", e.target.value)}
                    />
                    <span className="sh-sep">–</span>
                    <input
                      className="sh-time"
                      type="time"
                      value={block.endTime}
                      onChange={(e) => updateBlock(day, idx, "endTime", e.target.value)}
                    />
                    <button className="sh-del-btn" onClick={() => removeBlock(day, idx)} title="Eliminar franja">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
        <button className="btn-primary" onClick={save}>Guardar horarios</button>
      </div>
    </>
  );
}

/* ── PLANNING ── */
function Planning() {
  const [items, setItems] = useState([]);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modal, setModal] = useState(false);
  const [bStep, setBStep] = useState(1);
  const [bForm, setBForm] = useState({ serviceId: "", employeeId: "", date: "", startTime: "", customerName: "", customerEmail: "", customerPhone: "", notes: "" });
  const [slots, setSlots] = useState([]);
  const [msg, setMsg] = useState(null);
  const [onDutyBooking, setOnDutyBooking] = useState(null);
  const [onDutyList, setOnDutyList] = useState([]);
  const [onDutyLoading, setOnDutyLoading] = useState(false);
  const [editBooking, setEditBooking] = useState(null);
  const [editForm, setEditForm] = useState({ customerName: "", customerEmail: "", customerPhone: "", notes: "", status: "PENDING" });

  const load = () => api("/api/bookings").then(setItems).catch(() => {});
  useEffect(() => {
    load();
    api("/api/services").then(setServices).catch(() => {});
    api("/api/employees").then(setEmployees).catch(() => {});
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const MONTHS_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const DOW_ES = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const fmtDate = (ds) => {
    const [y, m, d] = ds.split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return `${DOW_ES[dt.getDay()]}, ${Number(d)} de ${MONTHS_ES[Number(m) - 1]}`;
  };
  const STATUS_ES = { PENDING: "Pendiente", CONFIRMED: "Confirmada", CANCELLED: "Cancelada" };
  const fmtSlot = (s) => typeof s === "string" ? s.slice(0, 5) : `${String(s[0]).padStart(2,"0")}:${String(s[1]).padStart(2,"0")}`;
  const rawSlot = (s) => typeof s === "string" ? s : `${String(s[0]).padStart(2,"0")}:${String(s[1]).padStart(2,"0")}:00`;

  const filtered = items
    .filter((b) => !selectedDate || b.date === selectedDate)
    .filter((b) => statusFilter === "ALL" || b.status === statusFilter)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime||"").localeCompare(b.startTime||""));

  const byDay = {};
  filtered.forEach((b) => { if (!byDay[b.date]) byDay[b.date] = []; byDay[b.date].push(b); });

  const changeStatus = async (id, status) => {
    try { await api(`/api/bookings/${id}/status?status=${status}`, { method: "PATCH" }); load(); }
    catch { setMsg({ type: "err", text: "Error al actualizar." }); }
  };

  const openOnDuty = async (b) => {
    if (b.employeeId != null) return;
    setOnDutyBooking(b); setOnDutyList([]); setOnDutyLoading(true);
    try { setOnDutyList(await api(`/api/bookings/${b.id}/on-duty`)); }
    catch { setOnDutyList([]); }
    finally { setOnDutyLoading(false); }
  };

  const openEdit = (b) => {
    setEditForm({ customerName: b.customerName || "", customerEmail: b.customerEmail || "", customerPhone: b.customerPhone || "", notes: b.notes || "", status: b.status });
    setEditBooking(b);
  };

  const saveEdit = async () => {
    try {
      await api(`/api/bookings/${editBooking.id}`, { method: "PATCH", body: JSON.stringify({ customerName: editForm.customerName, customerEmail: editForm.customerEmail || null, customerPhone: editForm.customerPhone || null, notes: editForm.notes || null, status: editForm.status }) });
      setEditBooking(null); load(); setMsg({ type: "ok", text: "Reserva actualizada." });
    } catch { setMsg({ type: "err", text: "Error al guardar cambios." }); }
  };

  const openModal = () => {
    setBForm({ serviceId: "", employeeId: "", date: "", startTime: "", customerName: "", customerEmail: "", customerPhone: "", notes: "" });
    setSlots([]); setBStep(1); setModal(true);
  };

  const loadSlots = async (serviceId, employeeId, date) => {
    try { const d = await api(`/api/bookings/availability?serviceId=${serviceId}&employeeId=${employeeId}&date=${date}`); setSlots(d.slots || []); }
    catch { setSlots([]); }
  };

  const submitBooking = async () => {
    try {
      const startTime = bForm.startTime.length === 5 ? bForm.startTime + ":00" : bForm.startTime;
      await api("/api/bookings", { method: "POST", body: JSON.stringify({ serviceId: Number(bForm.serviceId), employeeId: Number(bForm.employeeId), date: bForm.date, startTime, customerName: bForm.customerName, customerEmail: bForm.customerEmail || null, customerPhone: bForm.customerPhone || null, notes: bForm.notes || null, fieldValues: [] }) });
      setModal(false); load(); setMsg({ type: "ok", text: "Reserva creada correctamente." });
    } catch { setMsg({ type: "err", text: "Error al crear la reserva." }); }
  };

  return (
    <div className="bookings-section">
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}
      <div className="section-header">
        <div className="section-title">Planificación</div>
        <button className="btn-primary" onClick={openModal}>+ Nueva reserva</button>
      </div>

      <div className="bookings-layout">
        <CalendarMini bookings={items} selected={selectedDate} onSelect={(d) => { setSelectedDate(d); setStatusFilter("ALL"); }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Filtros de estado */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
            {[["ALL","Todas"],["PENDING","Pendientes"],["CONFIRMED","Confirmadas"],["CANCELLED","Canceladas"]].map(([v,l]) => (
              <button key={v} onClick={() => setStatusFilter(v)} style={{
                padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", border: "1.5px solid",
                background: statusFilter === v ? "var(--blue)" : "var(--white)",
                color: statusFilter === v ? "#fff" : "var(--ink-muted)",
                borderColor: statusFilter === v ? "var(--blue)" : "var(--stone-border)",
              }}>{l}</button>
            ))}
            {selectedDate && (
              <button className="btn-sm" onClick={() => setSelectedDate(null)} style={{ marginLeft: "auto" }}>
                × {selectedDate} — Ver todo
              </button>
            )}
          </div>

          {/* Agenda agrupada por día */}
          {Object.keys(byDay).length === 0 ? (
            <div className="empty">No hay reservas{selectedDate ? " este día" : " con estos filtros"}.</div>
          ) : (
            Object.entries(byDay).map(([date, dayBookings]) => (
              <div key={date} style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  <div style={{
                    background: date === today ? "var(--blue)" : "var(--stone-border)",
                    color: date === today ? "#fff" : "var(--ink-muted)",
                    borderRadius: "6px", padding: "2px 10px",
                    fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0,
                  }}>
                    {date === today ? "Hoy" : fmtDate(date)}
                  </div>
                  <div style={{ flex: 1, height: "1px", background: "var(--stone-border)" }} />
                  <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", flexShrink: 0 }}>
                    {dayBookings.length} cita{dayBookings.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {dayBookings.map((b) => {
                    const svc = services.find((s) => s.id === b.serviceId);
                    const emp = employees.find((e) => e.id === b.employeeId);
                    return (
                      <div key={b.id} style={{
                        background: "var(--white)", border: "1.5px solid var(--stone-border)",
                        borderLeft: `4px solid ${b.status === "CONFIRMED" ? "var(--success)" : b.status === "CANCELLED" ? "var(--error)" : "var(--ochre)"}`,
                        borderRadius: "8px", padding: "12px 16px",
                        display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap",
                      }}>
                        <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "1rem", color: "var(--blue)", minWidth: "44px" }}>
                          {b.startTime?.slice(0, 5) || "—"}
                        </div>
                        <div style={{ flex: 1, minWidth: "160px" }}>
                          <div style={{ fontWeight: 500, fontSize: "0.88rem" }}>{b.customerName}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                            {svc?.name || "—"}
                            {b.employeeId != null
                              ? emp ? ` · ${emp.name}` : ""
                              : <button className="btn-sm" style={{ fontSize: "0.7rem", marginLeft: "6px" }} onClick={() => openOnDuty(b)}>Ver en turno</button>
                            }
                          </div>
                          {(b.customerPhone || b.customerEmail) && (
                            <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)", marginTop: "2px" }}>
                              {b.customerPhone && <span>{b.customerPhone}</span>}
                              {b.customerPhone && b.customerEmail && <span> · </span>}
                              {b.customerEmail && <span>{b.customerEmail}</span>}
                            </div>
                          )}
                        </div>
                        <span className={`status-badge ${b.status === "CONFIRMED" ? "confirmed" : b.status === "CANCELLED" ? "cancelled" : "pending"}`}>
                          {STATUS_ES[b.status]}
                        </span>
                        <button className="btn-sm" style={{ fontSize: "0.75rem", padding: "4px 10px" }} onClick={() => openEdit(b)}>Editar</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal nueva reserva */}
      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Nueva reserva</div>
            <div className="wizard-steps">
              {["Servicio","Fecha","Hora","Cliente"].map((s, i) => (
                <div key={s} className={`wizard-step${bStep===i+1?" active":bStep>i+1?" done":""}`}>
                  <span className="step-num">{bStep>i+1?"✓":i+1}</span>
                  <span className="step-label">{s}</span>
                </div>
              ))}
            </div>
            {bStep === 1 && (<>
              <div className="form-field"><label>Servicio</label>
                <select value={bForm.serviceId} onChange={(e) => setBForm((p) => ({ ...p, serviceId: e.target.value }))}>
                  <option value="">— Elige un servicio —</option>
                  {services.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>)}
                </select>
              </div>
              <div className="form-field"><label>Profesional</label>
                <select value={bForm.employeeId} onChange={(e) => setBForm((p) => ({ ...p, employeeId: e.target.value }))}>
                  <option value="">— Elige un profesional —</option>
                  {employees.filter((e) => e.active).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
                <button className="btn-primary" onClick={() => setBStep(2)} disabled={!bForm.serviceId || !bForm.employeeId}>Siguiente →</button>
              </div>
            </>)}
            {bStep === 2 && (<>
              <div className="form-field"><label>Fecha</label>
                <input type="date" value={bForm.date} min={today} onChange={(e) => setBForm((p) => ({ ...p, date: e.target.value, startTime: "" }))} />
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setBStep(1)}>← Atrás</button>
                <button className="btn-primary" onClick={async () => { await loadSlots(bForm.serviceId, bForm.employeeId, bForm.date); setBStep(3); }} disabled={!bForm.date}>Ver disponibilidad →</button>
              </div>
            </>)}
            {bStep === 3 && (<>
              <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", marginBottom: "12px" }}>Huecos disponibles · {bForm.date}</p>
              {slots.length === 0
                ? <div className="empty" style={{ padding: "20px" }}>Sin disponibilidad este día.</div>
                : <div className="slot-grid">{slots.map((slot, i) => { const t=fmtSlot(slot); const raw=rawSlot(slot); return (
                    <button key={i} className={`slot-btn${bForm.startTime===raw||bForm.startTime.slice(0,5)===t?" selected":""}`} onClick={() => setBForm((p) => ({ ...p, startTime: raw }))}>{t}</button>
                  );})}</div>
              }
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setBStep(2)}>← Atrás</button>
                <button className="btn-primary" onClick={() => setBStep(4)} disabled={!bForm.startTime}>Siguiente →</button>
              </div>
            </>)}
            {bStep === 4 && (<>
              <div className="form-field"><label>Nombre del cliente</label>
                <input value={bForm.customerName} onChange={(e) => setBForm((p) => ({ ...p, customerName: e.target.value }))} />
              </div>
              <div className="two-col">
                <div className="form-field"><label>Email</label>
                  <input type="email" value={bForm.customerEmail} onChange={(e) => setBForm((p) => ({ ...p, customerEmail: e.target.value }))} />
                </div>
                <div className="form-field"><label>Teléfono</label>
                  <input value={bForm.customerPhone} onChange={(e) => setBForm((p) => ({ ...p, customerPhone: e.target.value }))} />
                </div>
              </div>
              <div className="form-field"><label>Notas</label>
                <input value={bForm.notes} onChange={(e) => setBForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Observaciones adicionales…" />
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setBStep(3)}>← Atrás</button>
                <button className="btn-primary" onClick={submitBooking} disabled={!bForm.customerName}>Confirmar reserva</button>
              </div>
            </>)}
          </div>
        </div>
      )}

      {/* Modal editar reserva */}
      {editBooking && (
        <div className="overlay" onClick={() => setEditBooking(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Editar reserva</div>
            <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)", marginBottom: "16px" }}>
              {editBooking.startTime?.slice(0,5)} · {services.find((s) => s.id === editBooking.serviceId)?.name} · {editBooking.date}
            </div>
            <div className="form-field"><label>Nombre del cliente</label>
              <input value={editForm.customerName} onChange={(e) => setEditForm((p) => ({ ...p, customerName: e.target.value }))} />
            </div>
            <div className="two-col">
              <div className="form-field"><label>Email</label>
                <input type="email" value={editForm.customerEmail} onChange={(e) => setEditForm((p) => ({ ...p, customerEmail: e.target.value }))} />
              </div>
              <div className="form-field"><label>Teléfono</label>
                <input value={editForm.customerPhone} onChange={(e) => setEditForm((p) => ({ ...p, customerPhone: e.target.value }))} />
              </div>
            </div>
            <div className="form-field"><label>Notas</label>
              <input value={editForm.notes} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Observaciones adicionales…" />
            </div>
            <div className="form-field"><label>Estado</label>
              <select className="status-select" value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}>
                <option value="PENDING">Pendiente</option>
                <option value="CONFIRMED">Confirmada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditBooking(null)}>Cancelar</button>
              <button className="btn-primary" onClick={saveEdit} disabled={!editForm.customerName}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal en turno */}
      {onDutyBooking && (
        <div className="overlay" onClick={() => setOnDutyBooking(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px", padding: 0, overflow: "hidden" }}>
            {/* Cabecera azul */}
            <div style={{ background: "var(--blue)", padding: "20px 24px" }}>
              <div style={{ color: "#fff", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7, marginBottom: "4px" }}>
                Empleados en turno
              </div>
              <div style={{ color: "#fff", fontSize: "1rem", fontWeight: 600 }}>
                {onDutyBooking.startTime?.slice(0,5)} · {services.find((s) => s.id===onDutyBooking.serviceId)?.name}
              </div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.78rem", marginTop: "2px" }}>
                {onDutyBooking.date}
              </div>
            </div>

            {/* Cuerpo */}
            <div style={{ padding: "20px 24px" }}>
              {onDutyLoading ? (
                <div style={{ color: "var(--ink-muted)", fontSize: "0.84rem", textAlign: "center", padding: "16px 0" }}>Cargando...</div>
              ) : onDutyList.length === 0 ? (
                <div style={{ color: "var(--ink-muted)", fontSize: "0.84rem", textAlign: "center", padding: "16px 0" }}>
                  Ningún empleado tiene turno en este horario.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {onDutyList.map((e) => {
                    const initials = e.name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <div key={e.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "var(--stone)", borderRadius: "10px", border: "1px solid var(--stone-border)" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--blue)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 700, flexShrink: 0 }}>
                          {initials}
                        </div>
                        <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--ink)" }}>{e.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                <button className="btn-primary" onClick={() => setOnDutyBooking(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── SUBSCRIPTION ── */
const FEATURES = [
  "Reservas ilimitadas de clientes",
  "Portal de reservas personalizado por negocio",
  "Gestión de servicios con campos personalizados",
  "Horarios por empleado y jornadas partidas",
  "Panel de administración con calendario",
  "Creación manual de reservas desde el panel",
  "Hasta 5 empleados activos",
  "Acceso a todas las secciones del panel",
];

function Subscription() {
  return (
    <>
      <div className="section-header">
        <div className="section-title">Planes y suscripción</div>
      </div>
      <p style={{ fontSize: "0.86rem", color: "var(--ink-muted)", marginBottom: "28px", lineHeight: 1.6, maxWidth: "600px" }}>
        Empieza gratis durante un mes y descubre todo lo que Fresco puede hacer por tu negocio.
        Sin tarjeta de crédito, sin compromisos.
      </p>
      <div className="plans-grid">
        <div className="plan-card">
          <div className="plan-badge">Prueba gratuita</div>
          <div className="plan-name">1 mes gratis</div>
          <div className="plan-price">0€</div>
          <div className="plan-price-sub">durante 30 días · sin tarjeta</div>
          <div className="plan-divider" />
          <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", marginBottom: "16px", lineHeight: 1.5 }}>
            Prueba Fresco durante 1 mes con acceso completo a todas las funciones. Descubre cómo
            automatizar tus reservas, gestionar a tu equipo y crecer sin esfuerzo.
          </p>
          <ul className="plan-features">
            {FEATURES.map((f, i) => (
              <li key={i} className="plan-feature">
                <span className="plan-feature-icon">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <button className="plan-cta plan-cta-free" disabled>
            Plan activo · Período de prueba
          </button>
        </div>

        <div className="plan-card plan-pro">
          <div className="plan-badge">Plan profesional</div>
          <div className="plan-name">Fresco Pro</div>
          <div className="plan-price">29€</div>
          <div className="plan-price-sub">por mes · facturación mensual</div>
          <div className="plan-divider" />
          <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", marginBottom: "16px", lineHeight: 1.5 }}>
            Todas las funciones de la prueba gratuita, más empleados, soporte prioritario y
            acceso anticipado a nuevas funcionalidades.
          </p>
          <ul className="plan-features">
            {FEATURES.map((f, i) => (
              <li key={i} className="plan-feature">
                <span className="plan-feature-icon">✓</span>
                {f}
              </li>
            ))}
            <li className="plan-feature">
              <span className="plan-feature-icon">✓</span>
              Empleados ilimitados
            </li>
            <li className="plan-feature">
              <span className="plan-feature-icon">✓</span>
              Soporte prioritario por email
            </li>
            <li className="plan-feature">
              <span className="plan-feature-icon">✓</span>
              Acceso anticipado a nuevas funciones
            </li>
          </ul>
          <button className="plan-cta plan-cta-pro">
            Suscribirse por 29€/mes →
          </button>
        </div>
      </div>
    </>
  );
}

/* ── CALENDAR MINI ── */
function CalendarMini({ bookings, selected, onSelect }) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);
  const pad = (n) => String(n).padStart(2, "0");
  const toStr = (d) => `${year}-${pad(month + 1)}-${pad(d)}`;

  const countByDay = {};
  bookings.forEach((b) => {
    countByDay[b.date] = (countByDay[b.date] || 0) + 1;
  });

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const MONTHS_ES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const DOW = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div className="calendar-card">
      <div className="cal-header">
        <button
          className="cal-nav-btn"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
        >
          ‹
        </button>
        <span className="cal-month">
          {MONTHS_ES[month]} {year}
        </span>
        <button
          className="cal-nav-btn"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
        >
          ›
        </button>
      </div>
      <div className="cal-weekdays">
        {DOW.map((d) => (
          <div key={d} className="cal-weekday">
            {d}
          </div>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const ds = toStr(d);
          const isToday = ds === todayStr;
          const isSel = ds === selected;
          const count = countByDay[ds] || 0;
          return (
            <div
              key={ds}
              className={`cal-day${isToday ? " today" : ""}${isSel ? " selected" : ""}`}
              onClick={() => onSelect(isSel ? null : ds)}
            >
              {d}
              {count > 0 && (
                <span className={`cal-dot${isSel ? " inv" : ""}`} />
              )}
            </div>
          );
        })}
      </div>
      {selected && (
        <button className="cal-clear" onClick={() => onSelect(null)}>
          Ver todo el mes
        </button>
      )}
    </div>
  );
}

/* ── BOOKINGS ── */
function _BookingsDeleted_() {
  const [items, setItems] = useState([]);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modal, setModal] = useState(false);
  const [bStep, setBStep] = useState(1);
  const [bForm, setBForm] = useState({
    serviceId: "",
    employeeId: "",
    date: "",
    startTime: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    notes: "",
  });
  const [slots, setSlots] = useState([]);
  const [msg, setMsg] = useState(null);
  const [onDutyBooking, setOnDutyBooking] = useState(null);
  const [onDutyList, setOnDutyList] = useState([]);
  const [onDutyLoading, setOnDutyLoading] = useState(false);

  const openOnDuty = async (b) => {
    if (b.employeeId != null) return;
    setOnDutyBooking(b);
    setOnDutyList([]);
    setOnDutyLoading(true);
    try {
      const data = await api(`/api/bookings/${b.id}/on-duty`);
      setOnDutyList(data);
    } catch {
      setOnDutyList([]);
    } finally {
      setOnDutyLoading(false);
    }
  };

  const load = () =>
    api("/api/bookings")
      .then(setItems)
      .catch(() => {});
  useEffect(() => {
    load();
    api("/api/services")
      .then(setServices)
      .catch(() => {});
    api("/api/employees")
      .then(setEmployees)
      .catch(() => {});
  }, []);

  const filtered = selectedDate
    ? items.filter((b) => b.date === selectedDate)
    : items;

  const loadSlots = async (serviceId, employeeId, date) => {
    try {
      const data = await api(
        `/api/bookings/availability?serviceId=${serviceId}&employeeId=${employeeId}&date=${date}`,
      );
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await api(`/api/bookings/${id}/status?status=${status}`, {
        method: "PATCH",
      });
      load();
    } catch {
      setMsg({ type: "err", text: "Error al actualizar." });
    }
  };

  const openModal = () => {
    setBForm({
      serviceId: "",
      employeeId: "",
      date: "",
      startTime: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      notes: "",
    });
    setSlots([]);
    setBStep(1);
    setModal(true);
  };

  const goStep3 = async () => {
    await loadSlots(bForm.serviceId, bForm.employeeId, bForm.date);
    setBStep(3);
  };

  const submitBooking = async () => {
    try {
      const startTime =
        bForm.startTime.length === 5
          ? bForm.startTime + ":00"
          : bForm.startTime;
      await api("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          serviceId: Number(bForm.serviceId),
          employeeId: Number(bForm.employeeId),
          date: bForm.date,
          startTime,
          customerName: bForm.customerName,
          customerEmail: bForm.customerEmail || null,
          customerPhone: bForm.customerPhone || null,
          notes: bForm.notes || null,
          fieldValues: [],
        }),
      });
      setModal(false);
      load();
      setMsg({ type: "ok", text: "Reserva creada correctamente." });
    } catch {
      setMsg({ type: "err", text: "Error al crear la reserva." });
    }
  };

  const STATUS_ES = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmada",
    CANCELLED: "Cancelada",
  };
  const fmtSlot = (s) =>
    typeof s === "string"
      ? s.slice(0, 5)
      : `${String(s[0]).padStart(2, "0")}:${String(s[1]).padStart(2, "0")}`;
  const rawSlot = (s) =>
    typeof s === "string"
      ? s
      : `${String(s[0]).padStart(2, "0")}:${String(s[1]).padStart(2, "0")}:00`;

  return (
    <div className="bookings-section">
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}
      <div className="section-header">
        <div className="section-title">Reservas</div>
        <button className="btn-primary" onClick={openModal}>
          + Nueva reserva
        </button>
      </div>

      <div className="bookings-layout">
        <CalendarMini
          bookings={items}
          selected={selectedDate}
          onSelect={setSelectedDate}
        />

        <div>
          {selectedDate && (
            <div
              style={{
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "0.84rem", color: "var(--ink-muted)" }}>
                {filtered.length} reserva{filtered.length !== 1 ? "s" : ""} ·{" "}
                {selectedDate}
              </span>
              <button className="btn-sm" onClick={() => setSelectedDate(null)}>
                Ver todas
              </button>
            </div>
          )}
          <div className="table-wrap">
            {filtered.length === 0 ? (
              <div className="empty">
                {selectedDate
                  ? "Sin reservas este día."
                  : "No hay reservas aún."}
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Servicio</th>
                    <th>Profesional</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.customerName}</strong>
                        {b.customerPhone && (
                          <>
                            <br />
                            <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                              {b.customerPhone}
                            </span>
                          </>
                        )}
                        {b.customerEmail && (
                          <>
                            <br />
                            <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                              {b.customerEmail}
                            </span>
                          </>
                        )}
                      </td>
                      <td>
                        {services.find((s) => s.id === b.serviceId)?.name ||
                          "—"}
                      </td>
                      <td>
                        {b.employeeId != null
                          ? employees.find((e) => e.id === b.employeeId)?.name || "—"
                          : (
                            <button
                              className="btn-sm"
                              style={{ fontSize: "0.72rem" }}
                              onClick={() => openOnDuty(b)}
                            >
                              Ver en turno
                            </button>
                          )
                        }
                      </td>
                      <td>{b.date}</td>
                      <td>{b.startTime?.slice(0, 5)}</td>
                      <td>
                        <span
                          className={`badge badge-${b.status.toLowerCase()}`}
                        >
                          {STATUS_ES[b.status] || b.status}
                        </span>
                      </td>
                      <td>
                        <select
                          className="status-select"
                          value={b.status}
                          onChange={(e) => changeStatus(b.id, e.target.value)}
                        >
                          <option value="PENDING">Pendiente</option>
                          <option value="CONFIRMED">Confirmada</option>
                          <option value="CANCELLED">Cancelada</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div
            className="modal modal-wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-title">Nueva reserva</div>
            <div className="wizard-steps">
              {["Servicio", "Fecha", "Hora", "Cliente"].map((s, i) => (
                <div
                  key={s}
                  className={`wizard-step${bStep === i + 1 ? " active" : bStep > i + 1 ? " done" : ""}`}
                >
                  <span className="step-num">
                    {bStep > i + 1 ? "✓" : i + 1}
                  </span>
                  <span className="step-label">{s}</span>
                </div>
              ))}
            </div>

            {bStep === 1 && (
              <>
                <div className="form-field">
                  <label>Servicio</label>
                  <select
                    value={bForm.serviceId}
                    onChange={(e) =>
                      setBForm((p) => ({ ...p, serviceId: e.target.value }))
                    }
                  >
                    <option value="">— Elige un servicio —</option>
                    {services
                      .filter((s) => s.active)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.duration} min)
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Profesional</label>
                  <select
                    value={bForm.employeeId}
                    onChange={(e) =>
                      setBForm((p) => ({ ...p, employeeId: e.target.value }))
                    }
                  >
                    <option value="">— Elige un profesional —</option>
                    {employees
                      .filter((e) => e.active)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => setModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => setBStep(2)}
                    disabled={!bForm.serviceId || !bForm.employeeId}
                  >
                    Siguiente →
                  </button>
                </div>
              </>
            )}

            {bStep === 2 && (
              <>
                <div className="form-field">
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={bForm.date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) =>
                      setBForm((p) => ({
                        ...p,
                        date: e.target.value,
                        startTime: "",
                      }))
                    }
                  />
                </div>
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setBStep(1)}>
                    ← Atrás
                  </button>
                  <button
                    className="btn-primary"
                    onClick={goStep3}
                    disabled={!bForm.date}
                  >
                    Ver disponibilidad →
                  </button>
                </div>
              </>
            )}

            {bStep === 3 && (
              <>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--ink-muted)",
                    marginBottom: "12px",
                  }}
                >
                  Huecos disponibles · {bForm.date}
                </p>
                {slots.length === 0 ? (
                  <div className="empty" style={{ padding: "20px" }}>
                    Sin disponibilidad este día.
                  </div>
                ) : (
                  <div className="slot-grid">
                    {slots.map((slot, i) => {
                      const t = fmtSlot(slot);
                      const raw = rawSlot(slot);
                      return (
                        <button
                          key={i}
                          className={`slot-btn${bForm.startTime === raw || bForm.startTime.slice(0, 5) === t ? " selected" : ""}`}
                          onClick={() =>
                            setBForm((p) => ({ ...p, startTime: raw }))
                          }
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setBStep(2)}>
                    ← Atrás
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => setBStep(4)}
                    disabled={!bForm.startTime}
                  >
                    Siguiente →
                  </button>
                </div>
              </>
            )}

            {bStep === 4 && (
              <>
                <div className="form-field">
                  <label>Nombre del cliente</label>
                  <input
                    value={bForm.customerName}
                    onChange={(e) =>
                      setBForm((p) => ({ ...p, customerName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="two-col">
                  <div className="form-field">
                    <label>Email</label>
                    <input
                      type="email"
                      value={bForm.customerEmail}
                      onChange={(e) =>
                        setBForm((p) => ({
                          ...p,
                          customerEmail: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label>Teléfono</label>
                    <input
                      value={bForm.customerPhone}
                      onChange={(e) =>
                        setBForm((p) => ({
                          ...p,
                          customerPhone: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label>Notas</label>
                  <input
                    value={bForm.notes}
                    onChange={(e) =>
                      setBForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    placeholder="Observaciones adicionales…"
                  />
                </div>
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setBStep(3)}>
                    ← Atrás
                  </button>
                  <button
                    className="btn-primary"
                    onClick={submitBooking}
                    disabled={!bForm.customerName}
                  >
                    Confirmar reserva
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {onDutyBooking && (
        <div className="overlay" onClick={() => setOnDutyBooking(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "380px" }}>
            <div className="modal-title">Empleados en turno</div>
            <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", marginBottom: "14px" }}>
              {onDutyBooking.date} · {onDutyBooking.startTime?.slice(0, 5)} · {services.find((s) => s.id === onDutyBooking.serviceId)?.name}
            </p>
            {onDutyLoading ? (
              <div style={{ color: "var(--ink-muted)", fontSize: "0.82rem" }}>Cargando...</div>
            ) : onDutyList.length === 0 ? (
              <div style={{ color: "var(--ink-muted)", fontSize: "0.82rem" }}>No hay empleados con horario en este turno.</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                {onDutyList.map((e) => (
                  <li key={e.id} style={{ fontSize: "0.88rem", padding: "8px 12px", background: "var(--stone)", borderRadius: "8px", border: "1px solid var(--stone-border)" }}>
                    {e.name}
                  </li>
                ))}
              </ul>
            )}
            <div className="modal-actions" style={{ marginTop: "18px" }}>
              <button className="btn-cancel" onClick={() => setOnDutyBooking(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
