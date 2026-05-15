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

  html, body { height: 100%; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', system-ui, sans-serif;
    background: var(--stone);
    color: var(--ink);
    min-height: 100vh;
  }

  /* ── LAYOUT ── */
  .dash {
    display: grid;
    grid-template-columns: var(--sidebar-w) 1fr;
    min-height: 100vh;
  }

  /* ── SIDEBAR ── */
  .sidebar {
    background: var(--blue);
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: hidden;
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
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }

  .stat-card {
    background: var(--white);
    border: 1px solid var(--stone-border);
    border-radius: 8px;
    padding: 20px 24px;
    position: relative;
    overflow: hidden;
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
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 8px;
  }

  .stat-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.4rem;
    font-weight: 600;
    color: var(--blue);
    line-height: 1;
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
    border-radius: 8px;
    overflow: hidden;
  }

  table { width: 100%; border-collapse: collapse; }

  thead { background: var(--stone); }

  th {
    padding: 10px 16px;
    text-align: left;
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-muted);
    border-bottom: 1px solid var(--stone-border);
  }

  td {
    padding: 12px 16px;
    font-size: 0.84rem;
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
    border-radius: 8px;
    padding: 28px;
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

  /* ── BOOKING CALENDAR ── */
  .bookings-layout { display: grid; grid-template-columns: 264px 1fr; gap: 20px; align-items: start; }

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
    .dash { grid-template-columns: 1fr; }

    .sidebar {
      position: fixed;
      left: calc(-1 * var(--sidebar-w) - 4px);
      top: 0;
      bottom: 0;
      z-index: 50;
      transition: left 0.26s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: none;
    }

    .sidebar.open {
      left: 0;
      box-shadow: 6px 0 32px rgba(8,12,30,0.22);
    }

    .hamburger-btn { display: flex; }
    .topbar { padding: 0 18px; }
    .content { padding: 24px 18px; }

    .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
    .profile-grid { grid-template-columns: 1fr; }
    .bookings-layout { grid-template-columns: 1fr; }
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { min-width: 540px; }
  }

  @media (max-width: 520px) {
    .stats-grid { grid-template-columns: 1fr; }
    .two-col { grid-template-columns: 1fr; }
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
    }
    .slot-grid { grid-template-columns: repeat(auto-fill, minmax(56px, 1fr)); }
    .wizard-steps { gap: 0; }
    .step-label { display: none; }
    .section-title { font-size: 1.3rem; }
    table { min-width: 480px; }
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
    { id: "overview", label: "Resumen" },
    { id: "empresa", label: "Mi empresa" },
    { id: "services", label: "Servicios" },
    { id: "employees", label: "Empleados" },
    { id: "hours", label: "Horarios" },
    { id: "bookings", label: "Reservas" },
  ];

  const TITLES = {
    overview: "Panel de control",
    empresa: "Mi empresa",
    services: "Servicios",
    employees: "Empleados",
    hours: "Horarios",
    bookings: "Reservas",
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
            {section === "overview" && <Overview setSection={goSection} />}
            {section === "empresa" && <Empresa />}
            {section === "services" && <Services />}
            {section === "employees" && <Employees />}
            {section === "hours" && <Hours />}
            {section === "bookings" && <Bookings />}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── OVERVIEW ── */
function Overview({ setSection }) {
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    api("/api/services")
      .then(setServices)
      .catch(() => {});
    api("/api/employees")
      .then(setEmployees)
      .catch(() => {});
    api("/api/bookings")
      .then(setBookings)
      .catch(() => {});
  }, []);

  const pending = bookings.filter((b) => b.status === "PENDING").length;

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Servicios activos</div>
          <div className="stat-value">
            {services.filter((s) => s.active).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Empleados</div>
          <div className="stat-value">
            {employees.filter((e) => e.active).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Reservas pendientes</div>
          <div className="stat-value">{pending}</div>
        </div>
      </div>

      <div className="section-header">
        <div className="section-title">Últimas reservas</div>
        <button className="btn-sm" onClick={() => setSection("bookings")}>
          Ver todas
        </button>
      </div>
      <div className="table-wrap">
        {bookings.length === 0 ? (
          <div className="empty">No hay reservas aún.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 5).map((b) => (
                <tr key={b.id}>
                  <td>{b.customerName}</td>
                  <td>{b.date}</td>
                  <td>{b.startTime?.slice(0, 5)}</td>
                  <td>
                    <span className={`badge badge-${b.status.toLowerCase()}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/* ── EMPRESA ── */
function Empresa() {
  const [tenant, setTenant] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [msg, setMsg] = useState(null);
  const [copied, setCopied] = useState(false);
  const [bh, setBh] = useState(
    DAYS.map((d) => ({
      dayOfWeek: d,
      startTime: "",
      endTime: "",
      enabled: false,
    })),
  );
  const [bhMsg, setBhMsg] = useState(null);

  useEffect(() => {
    api("/api/tenant")
      .then((data) => {
        setTenant(data);
        setForm({
          name: data.name,
          email: data.email,
          phone: data.phone || "",
          address: data.address || "",
        });
      })
      .catch(() => {});

    api("/api/tenant/hours")
      .then((data) => {
        const map = {};
        data.forEach((h) => {
          map[h.dayOfWeek] = h;
        });
        setBh(
          DAYS.map((d) =>
            map[d]
              ? {
                  dayOfWeek: d,
                  startTime: map[d].startTime?.slice(0, 5) || "",
                  endTime: map[d].endTime?.slice(0, 5) || "",
                  enabled: true,
                }
              : { dayOfWeek: d, startTime: "", endTime: "", enabled: false },
          ),
        );
      })
      .catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      const updated = await api("/api/tenant", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setTenant(updated);
      localStorage.setItem("tenantName", updated.name);
      setMsg({ type: "ok", text: "Datos actualizados correctamente." });
    } catch {
      setMsg({ type: "err", text: "Error al guardar los datos." });
    }
  };

  const saveBusinessHours = async () => {
    const payload = bh
      .filter((h) => h.enabled && h.startTime && h.endTime)
      .map(({ dayOfWeek, startTime, endTime }) => ({
        dayOfWeek,
        startTime,
        endTime,
      }));
    try {
      await api("/api/tenant/hours", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setBhMsg({ type: "ok", text: "Horario guardado." });
    } catch {
      setBhMsg({ type: "err", text: "Error al guardar el horario." });
    }
  };

  const toggleDay = (i) =>
    setBh((h) =>
      h.map((d, j) => (j === i ? { ...d, enabled: !d.enabled } : d)),
    );
  const updateDay = (i, k, v) =>
    setBh((h) => h.map((d, j) => (j === i ? { ...d, [k]: v } : d)));

  const bookingUrl = tenant ? `${API}/${tenant.slug}/booking` : "";
  const copyUrl = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>URL de reservas para clientes</label>
            <div className="link-box">
              <span className="link-text">{bookingUrl}</span>
              <button
                type="button"
                className={`copy-btn${copied ? " ok" : ""}`}
                onClick={copyUrl}
              >
                {copied ? "✓ Copiado" : "Copiar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <div className="card-title">Horario del negocio</div>
        {bhMsg && (
          <div
            className={`alert ${bhMsg.type}`}
            style={{ marginBottom: "16px" }}
          >
            {bhMsg.text}
          </div>
        )}
        <p
          style={{
            fontSize: "0.82rem",
            color: "var(--ink-muted)",
            marginBottom: "18px",
            lineHeight: 1.5,
          }}
        >
          Define el horario general de apertura. Los horarios individuales de
          cada profesional determinan la disponibilidad real de reservas.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Día</th>
                <th>Abierto</th>
                <th>Apertura</th>
                <th>Cierre</th>
              </tr>
            </thead>
            <tbody>
              {bh.map((h, i) => (
                <tr key={h.dayOfWeek}>
                  <td>
                    <strong>{DAY_ES[h.dayOfWeek]}</strong>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={h.enabled}
                      onChange={() => toggleDay(i)}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={h.startTime}
                      disabled={!h.enabled}
                      onChange={(e) =>
                        updateDay(i, "startTime", e.target.value)
                      }
                      style={{
                        border: "1px solid var(--stone-border)",
                        borderRadius: "5px",
                        padding: "4px 8px",
                        fontSize: "0.84rem",
                        opacity: h.enabled ? 1 : 0.4,
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={h.endTime}
                      disabled={!h.enabled}
                      onChange={(e) => updateDay(i, "endTime", e.target.value)}
                      style={{
                        border: "1px solid var(--stone-border)",
                        borderRadius: "5px",
                        padding: "4px 8px",
                        fontSize: "0.84rem",
                        opacity: h.enabled ? 1 : 0.4,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    </>
  );
}

/* ── SERVICES ── */
function Services() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [step, setStep] = useState("create");
  const [editingService, setEditingService] = useState(null);
  const [form, setForm] = useState({ name: "", duration: "" });
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
  }, []);

  const loadFields = (serviceId) =>
    api(`/api/services/${serviceId}/fields`)
      .then(setServiceFields)
      .catch(() => {});

  const openCreate = () => {
    setEditingService(null);
    setForm({ name: "", duration: "" });
    setCreatedService(null);
    setServiceFields([]);
    setFieldForm({ label: "", fieldType: "TEXT", required: false });
    setStep("create");
    setModal(true);
  };

  const openEdit = async (svc) => {
    setEditingService(svc);
    setForm({ name: svc.name, duration: String(svc.duration) });
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
      const body = { name: form.name, duration: Number(form.duration) };
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

  const del = async (id) => {
    try {
      await api(`/api/services/${id}`, { method: "DELETE" });
      load();
    } catch {
      setMsg({ type: "err", text: "Error al eliminar." });
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
                      <button className="btn-danger" onClick={() => del(s.id)}>
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

/* ── EMPLOYEES ── */
function Employees() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [msg, setMsg] = useState(null);

  const load = () =>
    api("/api/employees")
      .then(setItems)
      .catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api("/api/employees", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setModal(false);
      setForm({ name: "", email: "", phone: "" });
      load();
      setMsg({ type: "ok", text: "Empleado creado." });
    } catch {
      setMsg({ type: "err", text: "Error al crear el empleado." });
    }
  };

  const del = async (id) => {
    try {
      await api(`/api/employees/${id}`, { method: "DELETE" });
      load();
    } catch {
      setMsg({ type: "err", text: "Error al eliminar." });
    }
  };

  return (
    <>
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}
      <div className="section-header">
        <div className="section-title">Todos los empleados</div>
        <button className="btn-primary" onClick={() => setModal(true)}>
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
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id}>
                  <td>
                    <strong>{e.name}</strong>
                  </td>
                  <td>{e.email}</td>
                  <td>{e.phone}</td>
                  <td>
                    <span
                      className={`badge badge-${e.active ? "active" : "inactive"}`}
                    >
                      {e.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <button className="btn-danger" onClick={() => del(e.id)}>
                      Eliminar
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
            <div className="modal-title">Nuevo empleado</div>
            <form onSubmit={save}>
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
              <div className="two-col">
                <div className="form-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
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
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar
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
  const [hours, setHours] = useState([]);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api("/api/employees")
      .then((data) => {
        setEmployees(data);
        if (data.length > 0) setSelected(data[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    api(`/api/employees/${selected}/working-hours`)
      .then((data) => {
        const map = {};
        data.forEach((h) => {
          map[h.dayOfWeek] = h;
        });
        setHours(
          DAYS.map(
            (d) =>
              map[d] || {
                dayOfWeek: d,
                startTime: "",
                endTime: "",
                enabled: false,
              },
          ),
        );
      })
      .catch(() =>
        setHours(
          DAYS.map((d) => ({
            dayOfWeek: d,
            startTime: "",
            endTime: "",
            enabled: false,
          })),
        ),
      );
  }, [selected]);

  const toggle = (i) =>
    setHours((h) =>
      h.map((d, j) => (j === i ? { ...d, enabled: !d.enabled } : d)),
    );
  const update = (i, k, v) =>
    setHours((h) => h.map((d, j) => (j === i ? { ...d, [k]: v } : d)));

  const save = async () => {
    const payload = hours
      .filter((h) => h.enabled && h.startTime && h.endTime)
      .map(({ dayOfWeek, startTime, endTime }) => ({
        dayOfWeek,
        startTime,
        endTime,
      }));
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

  return (
    <>
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}
      <div className="section-header">
        <div className="section-title">Horarios por empleado</div>
        <select
          className="status-select"
          value={selected || ""}
          onChange={(e) => setSelected(Number(e.target.value))}
        >
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Día</th>
              <th>Activo</th>
              <th>Entrada</th>
              <th>Salida</th>
            </tr>
          </thead>
          <tbody>
            {hours.map((h, i) => (
              <tr key={h.dayOfWeek}>
                <td>
                  <strong>{DAY_ES[h.dayOfWeek]}</strong>
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={!!h.enabled || (!!h.startTime && !!h.endTime)}
                    onChange={() => toggle(i)}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    value={h.startTime?.slice(0, 5) || ""}
                    onChange={(e) => update(i, "startTime", e.target.value)}
                    style={{
                      border: "1px solid var(--stone-border)",
                      borderRadius: "5px",
                      padding: "4px 8px",
                      fontSize: "0.84rem",
                    }}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    value={h.endTime?.slice(0, 5) || ""}
                    onChange={(e) => update(i, "endTime", e.target.value)}
                    style={{
                      border: "1px solid var(--stone-border)",
                      borderRadius: "5px",
                      padding: "4px 8px",
                      fontSize: "0.84rem",
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        style={{
          marginTop: "16px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button className="btn-primary" onClick={save}>
          Guardar horarios
        </button>
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
function Bookings() {
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
    <>
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
                        {b.customerEmail && (
                          <>
                            <br />
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--ink-muted)",
                              }}
                            >
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
                        {employees.find((e) => e.id === b.employeeId)?.name ||
                          "—"}
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
    </>
  );
}
