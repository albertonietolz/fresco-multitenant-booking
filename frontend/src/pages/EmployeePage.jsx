import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";

const API = "http://localhost:8080";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --blue: #1a3070;
    --blue-mid: #2b4590;
    --blue-light: #3d5aac;
    --ochre: #c9973a;
    --stone: #f4f0e6;
    --stone-border: #d8cfc0;
    --white: #ffffff;
    --ink: #110e0a;
    --ink-muted: #6a5f52;
    --success: #15803d;
    --error: #dc2626;
  }

  html, body { height: 100%; margin: 0; background: var(--stone); font-family: 'DM Sans', system-ui, sans-serif; color: var(--ink); }

  /* ── LOGIN ── */
  .emp-login-wrap { min-height: 100svh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .emp-login-card { background: var(--white); border: 1px solid var(--stone-border); border-radius: 14px; padding: 40px 36px; width: 100%; max-width: 360px; box-shadow: 0 4px 32px rgba(17,14,10,0.07); }
  .emp-brand { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 600; color: var(--blue); letter-spacing: 0.06em; margin-bottom: 2px; }
  .emp-brand-sub { font-size: 0.73rem; color: var(--ink-muted); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--stone-border); }
  .emp-field { margin-bottom: 16px; }
  .emp-field label { display: block; font-size: 0.75rem; font-weight: 500; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
  .emp-field select, .emp-field input { width: 100%; padding: 9px 12px; border: 1.5px solid var(--stone-border); border-radius: 7px; font-size: 0.88rem; font-family: inherit; background: var(--white); color: var(--ink); outline: none; transition: border-color 0.15s; }
  .emp-field select:focus, .emp-field input:focus { border-color: var(--blue); }
  .emp-pin { font-size: 1.4rem; letter-spacing: 0.3em; text-align: center; font-family: monospace; }
  .emp-btn { width: 100%; padding: 10px; background: var(--blue); color: #fff; border: none; border-radius: 7px; font-size: 0.88rem; font-weight: 500; cursor: pointer; transition: background 0.15s; margin-top: 8px; }
  .emp-btn:hover { background: var(--blue-mid); }
  .emp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .emp-error { font-size: 0.78rem; color: var(--error); background: rgba(220,38,38,0.07); border-radius: 6px; padding: 8px 12px; margin-top: 12px; text-align: center; }

  /* ── PORTAL SHELL ── */
  .emp-portal { min-height: 100svh; display: flex; flex-direction: column; background: var(--stone); }

  /* ── HEADER ── */
  .emp-header { background: var(--blue); padding: 0 20px; display: flex; align-items: center; gap: 10px; position: sticky; top: 0; z-index: 20; height: 52px; }
  .emp-header-brand { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-weight: 600; color: #fff; letter-spacing: 0.06em; }
  .emp-tab-bar { display: flex; gap: 2px; flex: 1; margin: 0 16px; }
  .emp-tab { padding: 6px 16px; font-size: 0.78rem; font-weight: 500; color: rgba(255,255,255,0.65); background: none; border: none; border-radius: 5px; cursor: pointer; font-family: inherit; transition: all 0.15s; white-space: nowrap; }
  .emp-tab:hover { color: #fff; background: rgba(255,255,255,0.08); }
  .emp-tab.active { color: #fff; background: rgba(255,255,255,0.15); }
  .emp-header-name { font-size: 0.75rem; color: rgba(255,255,255,0.6); white-space: nowrap; }
  .emp-header-btn { font-size: 0.74rem; color: rgba(255,255,255,0.7); background: none; border: 1px solid rgba(255,255,255,0.25); border-radius: 5px; padding: 5px 11px; cursor: pointer; transition: all 0.15s; white-space: nowrap; font-family: inherit; }
  .emp-header-btn:hover { color: #fff; border-color: rgba(255,255,255,0.55); }
  .emp-header-btn.primary { background: var(--ochre); border-color: var(--ochre); color: #fff; font-weight: 500; }
  .emp-header-btn.primary:hover { background: #b8862f; }

  /* ── ALERT BAR ── */
  .emp-alertbar { padding: 8px 20px; font-size: 0.78rem; display: flex; align-items: center; gap: 8px; }
  .emp-alertbar.ok { background: #f0fdf4; border-bottom: 1px solid #86efac; color: var(--success); }
  .emp-alertbar.err { background: #fef2f2; border-bottom: 1px solid #fca5a5; color: var(--error); }

  /* ── WEEK STRIP (Tab 1) ── */
  .emp-week-strip-wrap { background: var(--white); border-bottom: 1px solid var(--stone-border); padding: 10px 20px; display: flex; align-items: center; gap: 8px; }
  .emp-strip-nav { width: 28px; height: 28px; border: 1.5px solid var(--stone-border); border-radius: 6px; background: var(--white); cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: border-color 0.12s; color: var(--ink-muted); }
  .emp-strip-nav:hover { border-color: var(--blue-light); color: var(--blue); }
  .emp-strip-days { display: flex; gap: 4px; flex: 1; overflow: hidden; }
  .emp-strip-day { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 4px; border-radius: 8px; cursor: pointer; transition: all 0.12s; border: 1.5px solid transparent; position: relative; }
  .emp-strip-day:hover { background: var(--stone); }
  .emp-strip-day.selected { background: var(--blue); border-color: var(--blue); }
  .emp-strip-day.today:not(.selected) { border-color: var(--blue-light); }
  .emp-strip-day-name { font-size: 0.60rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-muted); }
  .emp-strip-day.selected .emp-strip-day-name { color: rgba(255,255,255,0.8); }
  .emp-strip-day.today:not(.selected) .emp-strip-day-name { color: var(--blue); }
  .emp-strip-day-num { font-size: 1.1rem; font-weight: 600; font-family: 'Cormorant Garamond', serif; color: var(--ink); line-height: 1; }
  .emp-strip-day.selected .emp-strip-day-num { color: #fff; }
  .emp-strip-day.today:not(.selected) .emp-strip-day-num { color: var(--blue); }
  .emp-strip-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--ochre); }
  .emp-strip-day.selected .emp-strip-dot { background: rgba(255,255,255,0.7); }

  /* ── DAY BOOKING LIST ── */
  .emp-day-content { flex: 1; padding: 16px 20px; overflow-y: auto; }
  .emp-day-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .emp-day-title { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 600; color: var(--ink); }
  .emp-free-days-btn { font-size: 0.72rem; color: var(--ink-muted); background: none; border: 1px dashed var(--stone-border); border-radius: 5px; padding: 4px 10px; cursor: pointer; font-family: inherit; transition: all 0.12s; }
  .emp-free-days-btn:hover { border-color: var(--blue-light); color: var(--blue); }

  .emp-booking-list { display: flex; flex-direction: column; gap: 8px; }
  .emp-booking-card { background: var(--white); border: 1px solid var(--stone-border); border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.12s; box-shadow: 0 1px 3px rgba(17,14,10,0.04); }
  .emp-booking-card:hover { border-color: var(--blue-light); box-shadow: 0 2px 8px rgba(26,48,112,0.08); }
  .emp-booking-card.status-cancelled { opacity: 0.55; }
  .emp-booking-time-col { display: flex; flex-direction: column; align-items: center; min-width: 54px; flex-shrink: 0; }
  .emp-booking-start { font-size: 0.92rem; font-weight: 600; color: var(--blue); font-family: monospace; }
  .emp-booking-end { font-size: 0.68rem; color: var(--ink-muted); font-family: monospace; }
  .emp-booking-divider { width: 1px; height: 36px; background: var(--stone-border); flex-shrink: 0; }
  .emp-booking-info { flex: 1; min-width: 0; }
  .emp-booking-client { font-weight: 600; font-size: 0.88rem; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .emp-booking-service { font-size: 0.74rem; color: var(--ink-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
  .emp-booking-status { font-size: 0.64rem; font-weight: 600; padding: 2px 8px; border-radius: 20px; flex-shrink: 0; }
  .emp-booking-status.CONFIRMED { background: rgba(21,128,61,0.1); color: var(--success); }
  .emp-booking-status.PENDING { background: rgba(201,151,58,0.13); color: #92640a; }
  .emp-booking-status.CANCELLED { background: rgba(220,38,38,0.08); color: var(--error); }

  .emp-no-bookings { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 48px 20px; color: var(--ink-muted); font-size: 0.84rem; }
  .emp-no-bookings-icon { font-size: 2rem; opacity: 0.35; }
  .emp-loading { color: var(--ink-muted); font-size: 0.82rem; padding: 32px 20px; text-align: center; }

  /* ── TEAM TAB ── */
  .emp-team-controls { background: var(--white); border-bottom: 1px solid var(--stone-border); padding: 10px 20px; display: flex; align-items: center; gap: 8px; }
  .emp-nav-btn { width: 30px; height: 30px; border: 1.5px solid var(--stone-border); border-radius: 6px; background: var(--white); cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: border-color 0.12s; color: var(--ink-muted); }
  .emp-nav-btn:hover { border-color: var(--blue-light); color: var(--blue); }
  .emp-date-input { padding: 5px 10px; border: 1.5px solid var(--stone-border); border-radius: 6px; font-size: 0.84rem; font-family: inherit; background: var(--white); color: var(--ink); outline: none; }
  .emp-date-input:focus { border-color: var(--blue); }
  .emp-today-btn { padding: 5px 12px; font-size: 0.74rem; border: 1.5px solid var(--stone-border); border-radius: 5px; background: var(--white); cursor: pointer; font-family: inherit; transition: all 0.12s; }
  .emp-today-btn:hover { border-color: var(--blue-light); color: var(--blue); }
  .emp-team-date-label { font-size: 0.82rem; color: var(--ink-muted); font-weight: 500; }

  .emp-team-content { flex: 1; padding: 16px 20px; overflow-y: auto; }
  .emp-team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
  @media (max-width: 600px) { .emp-team-grid { grid-template-columns: 1fr; } }

  .emp-employee-card { background: var(--white); border: 1px solid var(--stone-border); border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(17,14,10,0.04); }
  .emp-employee-card-header { padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--stone-border); background: rgba(26,48,112,0.02); }
  .emp-employee-card-name { font-weight: 600; font-size: 0.90rem; color: var(--ink); }
  .emp-employee-count { font-size: 0.70rem; color: var(--ink-muted); background: var(--stone); border-radius: 20px; padding: 2px 10px; }
  .emp-employee-bookings { padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
  .emp-team-booking-item { padding: 8px 10px; border-radius: 7px; background: var(--stone); border: 1px solid var(--stone-border); cursor: pointer; transition: all 0.12s; display: flex; align-items: center; gap: 10px; }
  .emp-team-booking-item:hover { border-color: var(--blue-light); background: rgba(26,48,112,0.04); }
  .emp-team-booking-time { font-size: 0.72rem; font-family: monospace; font-weight: 600; color: var(--blue); min-width: 48px; flex-shrink: 0; }
  .emp-team-booking-info { flex: 1; min-width: 0; }
  .emp-team-booking-client { font-size: 0.80rem; font-weight: 500; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .emp-team-booking-svc { font-size: 0.68rem; color: var(--ink-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .emp-team-free { font-size: 0.76rem; color: var(--success); font-style: italic; padding: 8px 10px; }

  /* ── OVERLAY / MODAL ── */
  .emp-overlay { position: fixed; inset: 0; background: rgba(8,12,30,0.55); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); padding: 16px; }
  .emp-modal { background: var(--white); border-radius: 12px; padding: 28px; width: 100%; max-width: 440px; box-shadow: 0 24px 64px rgba(8,12,30,0.25); max-height: 90svh; overflow-y: auto; }
  .emp-modal-title { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; font-weight: 600; color: var(--ink); margin-bottom: 20px; }
  .emp-modal-sub { font-size: 0.78rem; color: var(--ink-muted); margin-bottom: 16px; }
  .emp-modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
  .emp-modal-cancel { padding: 8px 16px; background: var(--stone); color: var(--ink-muted); border: 1px solid var(--stone-border); border-radius: 6px; font-family: inherit; font-size: 0.82rem; cursor: pointer; }
  .emp-modal-primary { padding: 8px 16px; background: var(--blue); color: #fff; border: none; border-radius: 6px; font-family: inherit; font-size: 0.82rem; font-weight: 500; cursor: pointer; }
  .emp-modal-primary:hover { background: var(--blue-mid); }
  .emp-modal-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .emp-modal-danger { padding: 8px 16px; background: rgba(220,38,38,0.08); color: var(--error); border: 1px solid rgba(220,38,38,0.25); border-radius: 6px; font-family: inherit; font-size: 0.82rem; cursor: pointer; }
  .emp-form-field { margin-bottom: 13px; }
  .emp-form-label { display: block; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-muted); margin-bottom: 5px; }
  .emp-form-input { width: 100%; padding: 8px 11px; border: 1.5px solid var(--stone-border); border-radius: 6px; font-size: 0.86rem; font-family: inherit; background: var(--white); color: var(--ink); outline: none; transition: border-color 0.15s; }
  .emp-form-input:focus { border-color: var(--blue); }
  .emp-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  /* ── SLOT GRID ── */
  .emp-slot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(68px, 1fr)); gap: 6px; margin: 8px 0 16px; max-height: 180px; overflow-y: auto; }
  .emp-slot-btn { padding: 8px 4px; background: var(--stone); border: 1.5px solid var(--stone-border); border-radius: 6px; font-size: 0.83rem; cursor: pointer; transition: all 0.1s; text-align: center; font-family: inherit; color: var(--ink); }
  .emp-slot-btn:hover { border-color: var(--ochre); background: rgba(201,151,58,0.08); }
  .emp-slot-btn.selected { background: var(--blue); color: #fff; border-color: var(--blue); font-weight: 500; }

  /* ── SERVICE LIST ── */
  .emp-svc-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; max-height: 240px; overflow-y: auto; }
  .emp-svc-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--stone); border: 1.5px solid var(--stone-border); border-radius: 7px; cursor: pointer; transition: all 0.12s; }
  .emp-svc-item:hover { border-color: var(--blue-light); background: rgba(26,48,112,0.04); }
  .emp-svc-item.selected { border-color: var(--blue); background: rgba(26,48,112,0.06); }
  .emp-svc-name { font-size: 0.86rem; font-weight: 500; color: var(--ink); }
  .emp-svc-meta { font-size: 0.72rem; color: var(--ink-muted); }

  /* ── DETAIL PANEL ── */
  .emp-detail-row { display: flex; gap: 8px; margin-bottom: 10px; font-size: 0.84rem; }
  .emp-detail-label { font-size: 0.66rem; font-weight: 600; color: var(--ink-muted); letter-spacing: 0.1em; text-transform: uppercase; min-width: 90px; flex-shrink: 0; padding-top: 1px; }
  .emp-detail-value { color: var(--ink); word-break: break-word; }
  .emp-detail-section { font-size: 0.62rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-muted); margin: 16px 0 8px; padding-bottom: 6px; border-bottom: 1px solid var(--stone-border); }
  .emp-status-btns { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 16px; }
  .emp-status-btn { padding: 7px 14px; border-radius: 6px; font-size: 0.78rem; font-weight: 500; cursor: pointer; border: none; font-family: inherit; transition: all 0.13s; }
  .emp-status-btn.confirm { background: rgba(21,128,61,0.1); color: var(--success); border: 1px solid rgba(21,128,61,0.3); }
  .emp-status-btn.confirm:hover { background: rgba(21,128,61,0.18); }
  .emp-status-btn.cancel { background: rgba(220,38,38,0.08); color: var(--error); border: 1px solid rgba(220,38,38,0.25); }
  .emp-status-btn.cancel:hover { background: rgba(220,38,38,0.15); }
  .emp-history-badge { display: inline-block; background: rgba(26,48,112,0.1); color: var(--blue); border-radius: 20px; padding: 2px 10px; font-size: 0.72rem; font-weight: 600; }

  /* ── BLOCKED DATES CALENDAR ── */
  .emp-cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .emp-cal-month { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: var(--ink); }
  .emp-cal-nbtn { background: none; border: 1px solid var(--stone-border); border-radius: 5px; cursor: pointer; color: var(--ink-muted); font-size: 1rem; padding: 2px 10px; line-height: 1.6; }
  .emp-cal-nbtn:hover { background: var(--stone); }
  .emp-cal-weekdays { display: grid; grid-template-columns: repeat(7,1fr); margin-bottom: 4px; }
  .emp-cal-wday { text-align: center; font-size: 0.58rem; font-weight: 600; color: var(--ink-muted); padding: 4px 0; letter-spacing: 0.06em; text-transform: uppercase; }
  .emp-cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px; }
  .emp-cal-day { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 0.78rem; cursor: pointer; transition: all 0.1s; border: 1.5px solid transparent; user-select: none; }
  .emp-cal-day.other { color: var(--stone-border); cursor: default; }
  .emp-cal-day.past { opacity: 0.35; cursor: default; }
  .emp-cal-day.free { background: var(--white); }
  .emp-cal-day.free:hover { border-color: var(--blue-light); }
  .emp-cal-day.blocked { background: rgba(220,38,38,0.09); color: var(--error); font-weight: 600; border-color: rgba(220,38,38,0.25); }
  .emp-cal-day.blocked:hover { background: rgba(220,38,38,0.15); }
  .emp-cal-legend { display: flex; gap: 14px; margin-top: 12px; font-size: 0.73rem; color: var(--ink-muted); }
  .emp-cal-legend span { display: flex; align-items: center; gap: 5px; }
  .emp-cal-legend i { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }

  /* ── CONFIRM DIALOG ── */
  .emp-confirm-msg { font-size: 0.88rem; color: var(--ink); margin-bottom: 20px; line-height: 1.55; }

  /* ── ALERT inside modal ── */
  .emp-alert { font-size: 0.78rem; padding: 8px 12px; border-radius: 6px; margin-bottom: 14px; }
  .emp-alert.ok { background: #f0fdf4; border: 1px solid #86efac; color: var(--success); }
  .emp-alert.err { background: #fef2f2; border: 1px solid #fca5a5; color: var(--error); }
`;

// ── helpers ──────────────────────────────────────────────────────────────────

const empApi = (path, opts = {}) => {
  const token = localStorage.getItem("empToken");
  return fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...opts,
  }).then((r) => {
    if (!r.ok) throw r;
    if (r.status === 204) return null;
    return r.json();
  });
};

const toDateStr = (d) => d.toISOString().slice(0, 10);
const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return toDateStr(d);
};

const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTH_FULL_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const fmtDate = (dateStr) => {
  const d = new Date(dateStr + "T12:00:00");
  return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_ES[d.getMonth()]}`;
};

const fmtDateLong = (dateStr) => {
  const d = new Date(dateStr + "T12:00:00");
  const days = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  return `${days[d.getDay()]}, ${d.getDate()} de ${MONTH_FULL_ES[d.getMonth()]}`;
};

const STATUS_ES = { PENDING: "Pendiente", CONFIRMED: "Confirmada", CANCELLED: "Cancelada" };

// Returns the Monday of the week containing dateStr
const weekMonday = (dateStr) => {
  const d = new Date(dateStr + "T12:00:00");
  const dow = d.getDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  return toDateStr(m);
};

// ── Login ─────────────────────────────────────────────────────────────────────

function EmployeeLogin({ slug, tenantName, onLogin }) {
  const [staff, setStaff] = useState([]);
  const [empId, setEmpId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/${slug}/employee/staff`).then((r) => r.json()).then(setStaff).catch(() => {});
  }, [slug]);

  const submit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const data = await fetch(`${API}/${slug}/employee/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: Number(empId), pin }),
      }).then((r) => { if (!r.ok) throw new Error(); return r.json(); });
      localStorage.setItem("empToken", data.token);
      localStorage.setItem("empName", data.name);
      localStorage.setItem("empId", String(data.employeeId));
      onLogin(data);
    } catch { setError("PIN incorrecto o empleado no encontrado."); }
    finally { setLoading(false); }
  };

  return (
    <div className="emp-login-wrap">
      <div className="emp-login-card">
        <div className="emp-brand">Fresco</div>
        <div className="emp-brand-sub">{tenantName || slug} · Portal empleados</div>
        <form onSubmit={submit}>
          <div className="emp-field"><label>Tu nombre</label>
            <select value={empId} onChange={(e) => setEmpId(e.target.value)} required>
              <option value="">Selecciona tu nombre…</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="emp-field"><label>PIN de acceso</label>
            <input type="password" className="emp-pin" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={8} placeholder="••••••" required />
          </div>
          <button className="emp-btn" disabled={loading || !empId}>{loading ? "Accediendo…" : "Entrar →"}</button>
          {error && <div className="emp-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}

// ── New Booking Modal ─────────────────────────────────────────────────────────

function NewBookingModal({ onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [selSvc, setSelSvc] = useState(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selSlot, setSelSlot] = useState("");
  const [form, setForm] = useState({ customerName: "", customerEmail: "", customerPhone: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { empApi("/emp/services").then(setServices).catch(() => {}); }, []);

  const loadSlots = async (svcId, d) => {
    if (!svcId || !d) return;
    setSlotsLoading(true); setSlots([]);
    try { setSlots(await empApi(`/emp/availability?serviceId=${svcId}&date=${d}`)); }
    catch { setSlots([]); }
    finally { setSlotsLoading(false); }
  };

  const submit = async () => {
    if (!form.customerName.trim()) { setErr("El nombre es obligatorio."); return; }
    setSaving(true); setErr("");
    try {
      await empApi("/emp/bookings", { method: "POST", body: JSON.stringify({ serviceId: selSvc.id, date, startTime: selSlot, ...form }) });
      onCreated();
    } catch { setErr("No se pudo crear la reserva."); }
    finally { setSaving(false); }
  };

  const today = toDateStr(new Date());

  return (
    <div className="emp-overlay" onClick={onClose}>
      <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="emp-modal-title">Nueva cita</div>

        <div style={{ display: "flex", gap: "6px", marginBottom: "18px" }}>
          {["Servicio", "Fecha y hora", "Cliente"].map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.72rem", color: step === i + 1 ? "var(--blue)" : step > i + 1 ? "var(--success)" : "var(--ink-muted)", fontWeight: step === i + 1 ? 600 : 400 }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: step === i + 1 ? "var(--blue)" : step > i + 1 ? "var(--success)" : "var(--stone-border)", color: step >= i + 1 ? "#fff" : "var(--ink-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.62rem", fontWeight: 700, flexShrink: 0 }}>
                {step > i + 1 ? "✓" : i + 1}
              </span>
              {label}
              {i < 2 && <span style={{ color: "var(--stone-border)", marginLeft: 2 }}>›</span>}
            </div>
          ))}
        </div>

        {err && <div className="emp-alert err">{err}</div>}

        {step === 1 && (
          <>
            <div className="emp-svc-list">
              {services.map((s) => (
                <div key={s.id} className={`emp-svc-item${selSvc?.id === s.id ? " selected" : ""}`} onClick={() => setSelSvc(s)}>
                  <div>
                    <div className="emp-svc-name">{s.name}</div>
                    <div className="emp-svc-meta">{s.duration} min{s.price > 0 ? ` · ${s.price.toFixed(2)} €` : ""}</div>
                  </div>
                  {selSvc?.id === s.id && <span style={{ color: "var(--blue)", fontSize: "1rem" }}>✓</span>}
                </div>
              ))}
            </div>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={onClose}>Cancelar</button>
              <button className="emp-modal-primary" disabled={!selSvc} onClick={() => setStep(2)}>Siguiente →</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="emp-form-field">
              <label className="emp-form-label">Fecha</label>
              <input type="date" className="emp-form-input" value={date} min={today}
                onChange={(e) => { setDate(e.target.value); setSelSlot(""); loadSlots(selSvc.id, e.target.value); }} />
            </div>
            {date && (
              <>
                <div className="emp-form-label" style={{ marginBottom: 6 }}>Hora disponible</div>
                {slotsLoading ? <div style={{ color: "var(--ink-muted)", fontSize: "0.8rem", padding: "8px 0" }}>Cargando huecos…</div>
                  : slots.length === 0 ? <div style={{ color: "var(--ink-muted)", fontSize: "0.8rem", fontStyle: "italic", padding: "4px 0 12px" }}>Sin disponibilidad este día.</div>
                  : <div className="emp-slot-grid">{slots.map((s) => (
                    <button key={s} className={`emp-slot-btn${selSlot === s ? " selected" : ""}`} onClick={() => setSelSlot(s)}>{s}</button>
                  ))}</div>}
              </>
            )}
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setStep(1)}>← Atrás</button>
              <button className="emp-modal-primary" disabled={!date || !selSlot} onClick={() => setStep(3)}>Siguiente →</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ background: "var(--stone)", borderRadius: 7, padding: "10px 14px", marginBottom: 16, fontSize: "0.82rem", color: "var(--ink-muted)" }}>
              <strong style={{ color: "var(--ink)" }}>{selSvc.name}</strong> · {selSlot} · {fmtDate(date)}
            </div>
            <div className="emp-form-field">
              <label className="emp-form-label">Nombre del cliente *</label>
              <input className="emp-form-input" value={form.customerName} onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))} />
            </div>
            <div className="emp-form-row">
              <div className="emp-form-field">
                <label className="emp-form-label">Teléfono</label>
                <input className="emp-form-input" value={form.customerPhone} onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))} />
              </div>
              <div className="emp-form-field">
                <label className="emp-form-label">Email</label>
                <input type="email" className="emp-form-input" value={form.customerEmail} onChange={(e) => setForm((p) => ({ ...p, customerEmail: e.target.value }))} />
              </div>
            </div>
            <div className="emp-form-field">
              <label className="emp-form-label">Notas</label>
              <input className="emp-form-input" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Observaciones…" />
            </div>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setStep(2)}>← Atrás</button>
              <button className="emp-modal-primary" disabled={saving || !form.customerName.trim()} onClick={submit}>
                {saving ? "Guardando…" : "Confirmar cita"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Booking Detail Modal ──────────────────────────────────────────────────────

function BookingDetailModal({ bookingId, onClose, onStatusChanged }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    empApi(`/emp/bookings/${bookingId}`).then(setDetail).catch(() => setDetail(null)).finally(() => setLoading(false));
  }, [bookingId]);

  const changeStatus = async (status) => {
    setSaving(true);
    try {
      await empApi(`/emp/bookings/${bookingId}/status?status=${status}`, { method: "PATCH" });
      onStatusChanged();
      setDetail((d) => ({ ...d, status }));
      setConfirm(null);
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  return (
    <div className="emp-overlay" onClick={onClose}>
      <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
        {loading && <div style={{ color: "var(--ink-muted)", fontSize: "0.82rem", padding: "20px 0" }}>Cargando…</div>}
        {!loading && !detail && <div style={{ color: "var(--ink-muted)", fontSize: "0.82rem", padding: "20px 0" }}>No se pudo cargar la reserva.</div>}
        {!loading && detail && !confirm && (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div className="emp-modal-title" style={{ marginBottom: 0 }}>{detail.customerName}</div>
              <span className={`emp-booking-status ${detail.status}`} style={{ fontSize: "0.74rem", padding: "3px 10px" }}>{STATUS_ES[detail.status]}</span>
            </div>

            <div className="emp-detail-section">Cita</div>
            <div className="emp-detail-row"><span className="emp-detail-label">Servicio</span><span className="emp-detail-value">{detail.serviceName}</span></div>
            <div className="emp-detail-row"><span className="emp-detail-label">Fecha</span><span className="emp-detail-value">{fmtDate(detail.date)}</span></div>
            <div className="emp-detail-row"><span className="emp-detail-label">Hora</span><span className="emp-detail-value">{detail.startTime} – {detail.endTime}</span></div>

            <div className="emp-detail-section">Cliente</div>
            {detail.customerPhone && <div className="emp-detail-row"><span className="emp-detail-label">Teléfono</span><span className="emp-detail-value"><a href={`tel:${detail.customerPhone}`} style={{ color: "var(--blue)" }}>{detail.customerPhone}</a></span></div>}
            {detail.customerEmail && <div className="emp-detail-row"><span className="emp-detail-label">Email</span><span className="emp-detail-value" style={{ fontSize: "0.82rem" }}>{detail.customerEmail}</span></div>}
            {detail.previousVisits > 0 && (
              <div className="emp-detail-row"><span className="emp-detail-label">Historial</span><span className="emp-detail-value"><span className="emp-history-badge">{detail.previousVisits} visita{detail.previousVisits !== 1 ? "s" : ""} anterior{detail.previousVisits !== 1 ? "es" : ""}</span></span></div>
            )}

            {detail.notes && (<>
              <div className="emp-detail-section">Notas</div>
              <div style={{ fontSize: "0.83rem", color: "var(--ink)", lineHeight: 1.55, background: "var(--stone)", borderRadius: 6, padding: "8px 12px" }}>{detail.notes}</div>
            </>)}

            {detail.fields && detail.fields.length > 0 && (<>
              <div className="emp-detail-section">Campos personalizados</div>
              {detail.fields.map((f, i) => (
                <div key={i} className="emp-detail-row"><span className="emp-detail-label">{f.label}</span><span className="emp-detail-value">{f.value || "—"}</span></div>
              ))}
            </>)}

            {detail.status !== "CANCELLED" && (
              <div className="emp-status-btns">
                {detail.status !== "CONFIRMED" && (
                  <button className="emp-status-btn confirm" onClick={() => setConfirm({ status: "CONFIRMED", label: "¿Confirmar esta reserva?" })}>Confirmar</button>
                )}
                <button className="emp-status-btn cancel" onClick={() => setConfirm({ status: "CANCELLED", label: "¿Cancelar esta reserva? Esta acción liberará el hueco." })}>Cancelar cita</button>
              </div>
            )}

            <div className="emp-modal-actions" style={{ marginTop: 16 }}>
              <button className="emp-modal-cancel" onClick={onClose}>Cerrar</button>
            </div>
          </>
        )}

        {confirm && (
          <>
            <div className="emp-modal-title">Confirmar acción</div>
            <p className="emp-confirm-msg">{confirm.label}</p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setConfirm(null)}>Atrás</button>
              <button
                className={confirm.status === "CANCELLED" ? "emp-modal-danger" : "emp-modal-primary"}
                disabled={saving}
                onClick={() => changeStatus(confirm.status)}
              >
                {saving ? "Guardando…" : confirm.status === "CONFIRMED" ? "Sí, confirmar" : "Sí, cancelar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Blocked Dates Modal ───────────────────────────────────────────────────────

function BlockedDatesModal({ onClose }) {
  const today = toDateStr(new Date());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [blocked, setBlocked] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    empApi("/emp/blocked-dates").then((dates) => setBlocked(new Set(dates))).catch(() => {});
  }, []);

  const prevMonth = () => { if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); } else setCalMonth((m) => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); } else setCalMonth((m) => m + 1); };

  const toggleDay = async (dateStr) => {
    if (dateStr < today) return;
    setSaving(true); setMsg(null);
    try {
      if (blocked.has(dateStr)) {
        await empApi(`/emp/blocked-dates?date=${dateStr}`, { method: "DELETE" });
        setBlocked((prev) => { const n = new Set(prev); n.delete(dateStr); return n; });
      } else {
        await empApi(`/emp/blocked-dates?date=${dateStr}`, { method: "POST" });
        setBlocked((prev) => new Set([...prev, dateStr]));
      }
    } catch { setMsg("Error al guardar el cambio."); }
    finally { setSaving(false); }
  };

  const buildDays = () => {
    const first = new Date(calYear, calMonth, 1);
    const startDow = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push({ key: `p${i}`, type: "other" });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ key: dateStr, dateStr, d, past: dateStr < today, blocked: blocked.has(dateStr) });
    }
    return cells;
  };

  const days = buildDays();

  return (
    <div className="emp-overlay" onClick={onClose}>
      <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="emp-modal-title">Mis días no disponibles</div>
        <div className="emp-modal-sub">Marca los días en los que no estarás disponible. Los clientes no podrán reservarte esos días.</div>

        {msg && <div className="emp-alert err">{msg}</div>}

        <div className="emp-cal-nav">
          <button className="emp-cal-nbtn" onClick={prevMonth}>‹</button>
          <span className="emp-cal-month">{MONTH_FULL_ES[calMonth]} {calYear}</span>
          <button className="emp-cal-nbtn" onClick={nextMonth}>›</button>
        </div>
        <div className="emp-cal-weekdays">
          {["L","M","X","J","V","S","D"].map((d) => <div key={d} className="emp-cal-wday">{d}</div>)}
        </div>
        <div className="emp-cal-grid">
          {days.map((cell) => {
            if (cell.type === "other") return <div key={cell.key} className="emp-cal-day other" />;
            const cls = `emp-cal-day${cell.past ? " past" : cell.blocked ? " blocked" : " free"}`;
            return (
              <div key={cell.key} className={cls} onClick={() => !cell.past && toggleDay(cell.dateStr)}>
                {cell.d}
              </div>
            );
          })}
        </div>
        <div className="emp-cal-legend">
          <span><i style={{ background: "var(--white)", border: "1.5px solid var(--stone-border)" }} />Disponible</span>
          <span><i style={{ background: "rgba(220,38,38,0.09)", border: "1px solid rgba(220,38,38,0.25)" }} />No disponible</span>
        </div>
        <div className="emp-modal-actions">
          <button className="emp-modal-primary" onClick={onClose}>Listo</button>
        </div>
      </div>
    </div>
  );
}

// ── Tab 1: Mi agenda ──────────────────────────────────────────────────────────

function MiAgendaTab({ onBookingClick, showAlert }) {
  const today = toDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekStart, setWeekStart] = useState(weekMonday(today));
  const [weekData, setWeekData] = useState(null); // [{ date, bookings }]
  const [dayBookings, setDayBookings] = useState(null);
  const [loadingDay, setLoadingDay] = useState(false);
  const [showBlockedDates, setShowBlockedDates] = useState(false);

  // Build the 7-day strip for the current week
  const stripDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch week overview (dots)
  useEffect(() => {
    empApi(`/emp/my-week?startDate=${weekStart}`)
      .then(setWeekData)
      .catch(() => setWeekData(null));
  }, [weekStart]);

  // Fetch day detail
  useEffect(() => {
    setLoadingDay(true);
    setDayBookings(null);
    empApi(`/emp/my-bookings?date=${selectedDate}`)
      .then(setDayBookings)
      .catch(() => setDayBookings([]))
      .finally(() => setLoadingDay(false));
  }, [selectedDate]);

  const selectDay = (d) => {
    setSelectedDate(d);
    // If the selected day is outside the current week strip, navigate
    const mon = weekMonday(d);
    if (mon !== weekStart) setWeekStart(mon);
  };

  const prevWeek = () => {
    const newStart = addDays(weekStart, -7);
    setWeekStart(newStart);
    setSelectedDate(newStart);
  };

  const nextWeek = () => {
    const newStart = addDays(weekStart, 7);
    setWeekStart(newStart);
    setSelectedDate(newStart);
  };

  const hasBookings = (dateStr) => {
    if (!weekData) return false;
    const entry = weekData.find((d) => d.date === dateStr);
    return entry && entry.bookings.length > 0;
  };

  const refresh = () => {
    setDayBookings(null);
    setLoadingDay(true);
    empApi(`/emp/my-bookings?date=${selectedDate}`)
      .then(setDayBookings)
      .catch(() => setDayBookings([]))
      .finally(() => setLoadingDay(false));
    empApi(`/emp/my-week?startDate=${weekStart}`).then(setWeekData).catch(() => {});
    showAlert("ok", "Estado actualizado.");
  };

  return (
    <>
      {/* Week strip */}
      <div className="emp-week-strip-wrap">
        <button className="emp-strip-nav" onClick={prevWeek}>‹</button>
        <div className="emp-strip-days">
          {stripDays.map((d) => {
            const jsDate = new Date(d + "T12:00:00");
            const isToday = d === today;
            const isSelected = d === selectedDate;
            const hasDot = hasBookings(d);
            return (
              <div
                key={d}
                className={`emp-strip-day${isToday ? " today" : ""}${isSelected ? " selected" : ""}`}
                onClick={() => selectDay(d)}
              >
                <span className="emp-strip-day-name">{DAY_SHORT[jsDate.getDay()]}</span>
                <span className="emp-strip-day-num">{jsDate.getDate()}</span>
                {hasDot && <span className="emp-strip-dot" />}
              </div>
            );
          })}
        </div>
        <button className="emp-strip-nav" onClick={nextWeek}>›</button>
      </div>

      {/* Day content */}
      <div className="emp-day-content">
        <div className="emp-day-header">
          <div className="emp-day-title">
            {fmtDateLong(selectedDate)}
            {selectedDate === today && <span style={{ marginLeft: 8, fontSize: "0.72rem", background: "var(--blue)", color: "#fff", borderRadius: 20, padding: "2px 10px", fontFamily: "DM Sans, sans-serif", fontWeight: 500 }}>Hoy</span>}
          </div>
          <button className="emp-free-days-btn" onClick={() => setShowBlockedDates(true)}>Mis días libres</button>
        </div>

        {loadingDay && <div className="emp-loading">Cargando citas…</div>}

        {!loadingDay && dayBookings !== null && dayBookings.length === 0 && (
          <div className="emp-no-bookings">
            <span className="emp-no-bookings-icon">📅</span>
            <span>Sin citas este día</span>
          </div>
        )}

        {!loadingDay && dayBookings !== null && dayBookings.length > 0 && (
          <div className="emp-booking-list">
            {dayBookings.map((b) => (
              <div
                key={b.bookingId}
                className={`emp-booking-card${b.status === "CANCELLED" ? " status-cancelled" : ""}`}
                onClick={() => onBookingClick(b.bookingId, refresh)}
              >
                <div className="emp-booking-time-col">
                  <span className="emp-booking-start">{b.startTime}</span>
                  <span className="emp-booking-end">{b.endTime}</span>
                </div>
                <div className="emp-booking-divider" />
                <div className="emp-booking-info">
                  <div className="emp-booking-client">{b.clientName}</div>
                  <div className="emp-booking-service">{b.serviceName}</div>
                </div>
                <span className={`emp-booking-status ${b.status}`}>{STATUS_ES[b.status]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBlockedDates && <BlockedDatesModal onClose={() => setShowBlockedDates(false)} />}
    </>
  );
}

// ── Tab 2: Equipo ─────────────────────────────────────────────────────────────

function EquipoTab({ onBookingClick, showAlert }) {
  const today = toDateStr(new Date());
  const [date, setDate] = useState(today);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadTeam = useCallback((d) => {
    setLoading(true);
    empApi(`/emp/team-day?date=${d}`)
      .then(setTeamData)
      .catch(() => setTeamData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadTeam(date); }, [date, loadTeam]);

  const refresh = () => {
    loadTeam(date);
    showAlert("ok", "Estado actualizado.");
  };

  return (
    <>
      {/* Date controls */}
      <div className="emp-team-controls">
        <button className="emp-nav-btn" onClick={() => setDate((d) => addDays(d, -1))}>‹</button>
        <input type="date" className="emp-date-input" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="emp-nav-btn" onClick={() => setDate((d) => addDays(d, 1))}>›</button>
        {date !== today && (
          <button className="emp-today-btn" onClick={() => setDate(today)}>Hoy</button>
        )}
        <span className="emp-team-date-label">{fmtDateLong(date)}</span>
      </div>

      {/* Team grid */}
      <div className="emp-team-content">
        {loading && <div className="emp-loading">Cargando equipo…</div>}

        {!loading && !teamData && (
          <div className="emp-loading">No se pudo cargar el equipo.</div>
        )}

        {!loading && teamData && (
          <div className="emp-team-grid">
            {teamData.map((emp) => (
              <div key={emp.employeeId} className="emp-employee-card">
                <div className="emp-employee-card-header">
                  <span className="emp-employee-card-name">{emp.employeeName}</span>
                  <span className="emp-employee-count">
                    {emp.bookings.length === 0
                      ? "Libre"
                      : `${emp.bookings.length} cita${emp.bookings.length !== 1 ? "s" : ""}`}
                  </span>
                </div>
                <div className="emp-employee-bookings">
                  {emp.bookings.length === 0 ? (
                    <div className="emp-team-free">Sin citas</div>
                  ) : (
                    emp.bookings.map((b) => (
                      <div
                        key={b.bookingId}
                        className="emp-team-booking-item"
                        onClick={() => onBookingClick(b.bookingId, refresh)}
                      >
                        <span className="emp-team-booking-time">{b.startTime}</span>
                        <div className="emp-team-booking-info">
                          <div className="emp-team-booking-client">{b.clientName}</div>
                          <div className="emp-team-booking-svc">{b.serviceName}</div>
                        </div>
                        <span className={`emp-booking-status ${b.status}`} style={{ fontSize: "0.60rem" }}>{STATUS_ES[b.status]}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Portal ────────────────────────────────────────────────────────────────────

function EmployeePortal({ slug, empInfo, onLogout }) {
  const [tab, setTab] = useState("agenda"); // "agenda" | "equipo"
  const [alert, setAlert] = useState(null);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [detailBookingId, setDetailBookingId] = useState(null);
  const [detailCallback, setDetailCallback] = useState(null);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 3000);
  };

  const openBooking = (id, callback) => {
    setDetailBookingId(id);
    setDetailCallback(() => callback);
  };

  const closeDetail = () => {
    setDetailBookingId(null);
    setDetailCallback(null);
  };

  const onStatusChanged = () => {
    if (detailCallback) detailCallback();
    closeDetail();
  };

  return (
    <div className="emp-portal">
      {/* Header */}
      <div className="emp-header">
        <div className="emp-header-brand">Fresco</div>
        <div className="emp-tab-bar">
          <button className={`emp-tab${tab === "agenda" ? " active" : ""}`} onClick={() => setTab("agenda")}>Mi agenda</button>
          <button className={`emp-tab${tab === "equipo" ? " active" : ""}`} onClick={() => setTab("equipo")}>Equipo</button>
        </div>
        <span className="emp-header-name">{empInfo.name}</span>
        <button className="emp-header-btn primary" onClick={() => setShowNewBooking(true)}>+ Nueva cita</button>
        <button className="emp-header-btn" onClick={onLogout}>Salir</button>
      </div>

      {/* Alert bar */}
      {alert && (
        <div className={`emp-alertbar ${alert.type}`}>{alert.text}</div>
      )}

      {/* Tab content */}
      {tab === "agenda" && (
        <MiAgendaTab
          onBookingClick={openBooking}
          showAlert={showAlert}
        />
      )}
      {tab === "equipo" && (
        <EquipoTab
          onBookingClick={openBooking}
          showAlert={showAlert}
        />
      )}

      {/* Modals */}
      {showNewBooking && (
        <NewBookingModal
          onClose={() => setShowNewBooking(false)}
          onCreated={() => {
            setShowNewBooking(false);
            showAlert("ok", "Cita creada correctamente.");
          }}
        />
      )}
      {detailBookingId && (
        <BookingDetailModal
          bookingId={detailBookingId}
          onClose={closeDetail}
          onStatusChanged={onStatusChanged}
        />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EmployeePage() {
  const { slug } = useParams();
  const [tenantName, setTenantName] = useState("");
  const [empInfo, setEmpInfo] = useState(() => {
    const token = localStorage.getItem("empToken");
    const name = localStorage.getItem("empName");
    const id = localStorage.getItem("empId");
    return token && name ? { token, name, employeeId: Number(id) } : null;
  });

  useEffect(() => {
    fetch(`${API}/${slug}/booking/info`).then((r) => r.json()).then((d) => setTenantName(d.name)).catch(() => {});
  }, [slug]);

  const handleLogout = () => {
    localStorage.removeItem("empToken"); localStorage.removeItem("empName"); localStorage.removeItem("empId");
    setEmpInfo(null);
  };

  return (
    <>
      <style>{styles}</style>
      {empInfo
        ? <EmployeePortal slug={slug} empInfo={empInfo} onLogout={handleLogout} />
        : <EmployeeLogin slug={slug} tenantName={tenantName} onLogin={setEmpInfo} />}
    </>
  );
}
