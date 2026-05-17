import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const API_BASE = "http://localhost:8080";

const pub = async (path) => {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const pubPost = async (path, body) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const fmtSlot = (s) => {
  if (typeof s === "string") return s.slice(0, 5);
  return `${String(s[0]).padStart(2, "0")}:${String(s[1]).padStart(2, "0")}`;
};

const fmtSlotRaw = (s) => {
  if (typeof s === "string") return s.length === 5 ? s + ":00" : s;
  return `${String(s[0]).padStart(2, "0")}:${String(s[1]).padStart(2, "0")}:00`;
};

const MONTHS_ES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];

const fmtDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${parseInt(day)} de ${MONTHS_ES[parseInt(m) - 1]} de ${y}`;
};

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
    --success: #15803d;
    --error: #dc2626;
  }

  html, body { min-height: 100%; background: var(--stone); }

  body {
    font-family: 'DM Sans', system-ui, sans-serif;
    color: var(--ink);
  }

  /* ── PAGE ── */
  .bk-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--stone);
  }

  /* ── HEADER ── */
  .bk-header {
    background: var(--blue);
    padding: 32px 24px 28px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .bk-header::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 140% 80% at 50% 0%, rgba(201,151,58,0.14) 0%, transparent 60%);
    pointer-events: none;
  }

  .bk-header-inner { position: relative; z-index: 1; }

  .bk-brand {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.03em;
    line-height: 1.1;
  }

  .bk-tagline {
    font-size: 0.8rem;
    font-weight: 400;
    color: rgba(255,255,255,0.5);
    margin-top: 6px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .bk-header-rule {
    width: 28px;
    height: 2px;
    background: var(--ochre);
    margin: 10px auto 0;
    border-radius: 2px;
  }

  /* ── MAIN ── */
  .bk-main {
    flex: 1;
    width: 100%;
    max-width: 520px;
    margin: 0 auto;
    padding: 32px 20px 48px;
  }

  /* ── PROGRESS ── */
  .bk-progress {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 0;
    margin-bottom: 32px;
    position: relative;
  }

  .bk-progress::before {
    content: '';
    position: absolute;
    top: 14px;
    left: 14%;
    right: 14%;
    height: 1px;
    background: var(--stone-border);
    z-index: 0;
  }

  .bk-prog-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    flex: 1;
    position: relative;
    z-index: 1;
  }

  .bk-prog-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--white);
    border: 2px solid var(--stone-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--ink-muted);
    transition: all 0.2s;
  }

  .bk-prog-step.active .bk-prog-dot {
    background: var(--blue);
    border-color: var(--blue);
    color: #fff;
    box-shadow: 0 0 0 4px rgba(26,48,112,0.12);
  }

  .bk-prog-step.done .bk-prog-dot {
    background: var(--success);
    border-color: var(--success);
    color: #fff;
    font-size: 0.8rem;
  }

  .bk-prog-label {
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-muted);
    text-align: center;
    line-height: 1.3;
  }

  .bk-prog-step.active .bk-prog-label { color: var(--blue); font-weight: 600; }
  .bk-prog-step.done .bk-prog-label { color: var(--success); }

  /* ── STEP HEADER ── */
  .bk-step-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 6px;
  }

  .bk-step-sub {
    font-size: 0.83rem;
    color: var(--ink-muted);
    margin-bottom: 22px;
    line-height: 1.5;
  }

  /* ── SERVICE CARDS ── */
  .bk-service-list { display: flex; flex-direction: column; gap: 10px; }

  .bk-service-card {
    background: var(--white);
    border: 1.5px solid var(--stone-border);
    border-radius: 10px;
    padding: 16px 20px;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.12s;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .bk-service-card:hover {
    border-color: var(--blue-light);
    box-shadow: 0 4px 16px rgba(26,48,112,0.1);
    transform: translateY(-1px);
  }

  .bk-service-name {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--ink);
    margin-bottom: 3px;
  }

  .bk-service-meta {
    font-size: 0.75rem;
    color: var(--ink-muted);
  }

  .bk-service-arrow {
    font-size: 1.1rem;
    color: var(--stone-border);
    flex-shrink: 0;
  }

  /* ── EMPLOYEE CARDS ── */
  .bk-emp-list { display: flex; flex-direction: column; gap: 10px; }

  .bk-emp-card {
    background: var(--white);
    border: 1.5px solid var(--stone-border);
    border-radius: 10px;
    padding: 14px 18px;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .bk-emp-card:hover {
    border-color: var(--blue-light);
    box-shadow: 0 4px 12px rgba(26,48,112,0.09);
  }

  .bk-emp-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--blue);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 600;
    flex-shrink: 0;
    letter-spacing: 0.04em;
  }

  .bk-emp-name {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--ink);
  }

  /* ── CALENDAR ── */
  .bk-cal {
    background: var(--white);
    border: 1px solid var(--stone-border);
    border-radius: 10px;
    padding: 18px;
    margin-bottom: 24px;
    box-shadow: 0 1px 4px rgba(8,12,30,0.04);
  }

  .bk-cal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .bk-cal-month {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink);
    text-transform: capitalize;
  }

  .bk-cal-nav {
    background: var(--stone);
    border: 1px solid var(--stone-border);
    border-radius: 6px;
    cursor: pointer;
    color: var(--ink-muted);
    font-size: 1.1rem;
    padding: 2px 11px;
    line-height: 1.6;
    transition: background 0.12s;
  }

  .bk-cal-nav:hover { background: var(--stone-border); }
  .bk-cal-nav:disabled { opacity: 0.35; cursor: not-allowed; }

  .bk-cal-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 4px;
  }

  .bk-cal-wd {
    text-align: center;
    font-size: 0.6rem;
    font-weight: 600;
    color: var(--ink-muted);
    padding: 4px 0;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .bk-cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 3px;
  }

  .bk-cal-day {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 7px;
    font-size: 0.8rem;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.12s;
    border: 1.5px solid transparent;
    position: relative;
  }

  .bk-cal-day.avail {
    background: #dcfce7;
    color: #166534;
    font-weight: 500;
  }

  .bk-cal-day.avail:hover {
    background: #bbf7d0;
    border-color: #4ade80;
  }

  .bk-cal-day.unavail {
    background: #fef2f2;
    color: #b91c1c;
    cursor: not-allowed;
    opacity: 0.7;
  }

  .bk-cal-day.past {
    color: var(--stone-border);
    cursor: not-allowed;
    background: transparent;
  }

  .bk-cal-day.loading {
    background: var(--stone);
    color: var(--stone-border);
    cursor: wait;
    animation: bk-pulse 1.2s ease-in-out infinite;
  }

  .bk-cal-day.selected {
    background: var(--blue) !important;
    color: #fff !important;
    border-color: var(--blue-mid) !important;
    font-weight: 600;
  }

  .bk-cal-day.today { font-weight: 700; }

  @keyframes bk-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .bk-cal-legend {
    display: flex;
    gap: 16px;
    justify-content: center;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--stone-border);
  }

  .bk-cal-legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.68rem;
    color: var(--ink-muted);
    letter-spacing: 0.04em;
  }

  .bk-cal-legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  /* ── SLOTS ── */
  .bk-slots-title {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 10px;
  }

  .bk-slot-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    gap: 8px;
    margin-bottom: 24px;
  }

  .bk-slot {
    padding: 10px 4px;
    background: var(--white);
    border: 1.5px solid var(--stone-border);
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.86rem;
    cursor: pointer;
    transition: all 0.12s;
    color: var(--ink);
    text-align: center;
    font-weight: 400;
  }

  .bk-slot:hover {
    background: var(--ochre-dim);
    border-color: var(--ochre);
  }

  .bk-no-slots {
    padding: 24px;
    text-align: center;
    color: var(--ink-muted);
    font-size: 0.84rem;
    background: var(--white);
    border: 1px solid var(--stone-border);
    border-radius: 8px;
    margin-bottom: 24px;
  }

  /* ── FORM ── */
  .bk-summary {
    background: var(--blue);
    border-radius: 10px;
    padding: 16px 18px;
    margin-bottom: 22px;
    color: rgba(255,255,255,0.9);
  }

  .bk-summary-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 8px;
  }

  .bk-summary-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.7);
    margin-bottom: 3px;
  }

  .bk-summary-row:last-child { margin-bottom: 0; }

  .bk-summary-icon { font-size: 0.9rem; opacity: 0.8; }

  .bk-field { margin-bottom: 14px; }

  .bk-field label {
    display: block;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 6px;
  }

  .bk-input {
    width: 100%;
    padding: 10px 13px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    color: var(--ink);
    background: var(--white);
    border: 1.5px solid var(--stone-border);
    border-radius: 7px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .bk-input:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(26,48,112,0.08);
  }

  .bk-input-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .bk-textarea {
    resize: vertical;
    min-height: 72px;
  }

  .bk-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%236a5f52' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 16px;
    padding-right: 36px;
  }

  /* ── BUTTONS ── */
  .bk-btn-primary {
    width: 100%;
    padding: 12px;
    background: var(--blue);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    letter-spacing: 0.02em;
  }

  .bk-btn-primary:hover:not(:disabled) { background: var(--blue-light); transform: translateY(-1px); }
  .bk-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

  .bk-btn-back {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    color: var(--ink-muted);
    cursor: pointer;
    padding: 0;
    margin-bottom: 20px;
    transition: color 0.12s;
  }

  .bk-btn-back:hover { color: var(--ink); }

  /* ── ERROR ── */
  .bk-error {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    color: var(--error);
    padding: 10px 14px;
    border-radius: 7px;
    font-size: 0.82rem;
    margin-bottom: 14px;
  }

  /* ── CONFIRMATION ── */
  .bk-confirm {
    text-align: center;
    padding: 24px 0 8px;
  }

  .bk-confirm-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #d1fae5;
    border: 2px solid #6ee7b7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    margin: 0 auto 20px;
  }

  .bk-confirm-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 8px;
  }

  .bk-confirm-sub {
    font-size: 0.86rem;
    color: var(--ink-muted);
    margin-bottom: 28px;
    line-height: 1.6;
  }

  .bk-confirm-detail {
    background: var(--white);
    border: 1px solid var(--stone-border);
    border-radius: 10px;
    padding: 20px;
    text-align: left;
    margin-bottom: 24px;
  }

  .bk-confirm-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(216,207,192,0.4);
    font-size: 0.84rem;
  }

  .bk-confirm-row:last-child { border-bottom: none; }

  .bk-confirm-icon-sm { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }

  .bk-confirm-key {
    font-weight: 500;
    color: var(--ink);
    min-width: 80px;
    flex-shrink: 0;
  }

  .bk-confirm-val { color: var(--ink-muted); }

  /* ── NOT FOUND ── */
  .bk-notfound {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    background: var(--stone);
  }

  .bk-notfound-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.4rem;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 12px;
  }

  .bk-notfound-sub {
    font-size: 0.88rem;
    color: var(--ink-muted);
    line-height: 1.6;
  }

  /* ── LOADING ── */
  .bk-loading {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--stone);
    color: var(--ink-muted);
    font-size: 0.88rem;
  }

  /* ── FOOTER ── */
  .bk-footer {
    text-align: center;
    padding: 16px;
    font-size: 0.73rem;
    color: var(--ink-muted);
    letter-spacing: 0.03em;
  }

  .bk-powered {
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.86rem;
    font-weight: 600;
    color: var(--blue);
    letter-spacing: 0.06em;
  }

  /* ── EMPTY STATE ── */
  .bk-empty {
    text-align: center;
    padding: 40px 20px;
    color: var(--ink-muted);
    font-size: 0.86rem;
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 520px) {
    .bk-brand { font-size: 1.6rem; }
    .bk-main { padding: 24px 16px 40px; }
    .bk-prog-label { display: none; }
    .bk-input-2col { grid-template-columns: 1fr; }
    .bk-slot-grid { grid-template-columns: repeat(auto-fill, minmax(62px, 1fr)); }
  }
`;

export default function BookingPage() {
  const { slug } = useParams();
  const [tenant, setTenant] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [service, setService] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slot, setSlot] = useState(null);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1);
  const [availDates, setAvailDates] = useState(null); // null = loading, Set = loaded
  const [calLoading, setCalLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: "", customerEmail: "", customerPhone: "", notes: "",
  });
  const [fieldValues, setFieldValues] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [booked, setBooked] = useState(null);

  useEffect(() => {
    pub(`/${slug}/booking/info`).then(setTenant).catch(() => setNotFound(true));
    pub(`/${slug}/booking/services`).then((data) => setServices(data.filter((s) => s.active))).catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!service) return;
    pub(`/${slug}/booking/employees/${service.id}`)
      .then((data) => {
        const active = data.filter((e) => e.active);
        setEmployees(active);
        if (active.length === 1) { setEmployee(active[0]); setStep(3); }
        else setStep(2);
      })
      .catch(() => setStep(2));
  }, [service]);

  useEffect(() => {
    if (!service || !employee || !date) return;
    setSlotsLoading(true);
    setSlots([]);
    pub(`/${slug}/booking/availability?serviceId=${service.id}&employeeId=${employee.id}&date=${date}`)
      .then((d) => setSlots(d.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [date, service, employee]);

  useEffect(() => {
    if (!service || !employee) return;
    setAvailDates(null);
    setCalLoading(true);
    pub(`/${slug}/booking/availability/month?serviceId=${service.id}&employeeId=${employee.id}&year=${calYear}&month=${calMonth}`)
      .then((dates) => setAvailDates(new Set(dates)))
      .catch(() => setAvailDates(new Set()))
      .finally(() => setCalLoading(false));
  }, [service, employee, calYear, calMonth]);

  const selectService = (svc) => {
    setService(svc);
    setEmployee(null); setSlot(null); setDate(""); setSlots([]);
    setAvailDates(null);
    const now = new Date();
    setCalYear(now.getFullYear()); setCalMonth(now.getMonth() + 1);
    setFieldValues((svc.fields || []).map((f) => ({ fieldId: f.id, value: "" })));
    setError(null);
  };

  const submit = async () => {
    if (!form.customerName.trim()) { setError("El nombre es obligatorio."); return; }
    setSubmitting(true); setError(null);
    try {
      const result = await pubPost(`/${slug}/booking`, {
        serviceId: service.id,
        employeeId: employee.id,
        date,
        startTime: fmtSlotRaw(slot),
        customerName: form.customerName,
        customerEmail: form.customerEmail || null,
        customerPhone: form.customerPhone || null,
        notes: form.notes || null,
        fieldValues: fieldValues.filter((fv) => fv.value),
      });
      setBooked(result);
      setStep(5);
    } catch { setError("Error al confirmar la reserva. Inténtalo de nuevo."); }
    finally { setSubmitting(false); }
  };

  const STEPS = ["Servicio", "Profesional", "Fecha y hora", "Tus datos"];

  if (notFound) return (
    <>
      <style>{styles}</style>
      <div className="bk-notfound">
        <div className="bk-notfound-title">Página no encontrada</div>
        <div className="bk-notfound-sub">El enlace de reservas no existe o ha caducado.</div>
      </div>
    </>
  );

  if (!tenant) return (
    <>
      <style>{styles}</style>
      <div className="bk-loading">Cargando…</div>
    </>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="bk-page">
        <header className="bk-header">
          <div className="bk-header-inner">
            <div className="bk-brand">{tenant.name}</div>
            <div className="bk-header-rule" />
            <div className="bk-tagline">Portal de reservas</div>
          </div>
        </header>

        <main className="bk-main">
          {step < 5 && (
            <div className="bk-progress">
              {STEPS.map((label, i) => {
                const n = i + 1;
                const cls = step === n ? "active" : step > n ? "done" : "";
                return (
                  <div key={n} className={`bk-prog-step ${cls}`}>
                    <div className="bk-prog-dot">{step > n ? "✓" : n}</div>
                    <span className="bk-prog-label">{label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {step === 1 && (
            <StepService services={services} onSelect={selectService} />
          )}
          {step === 2 && (
            <StepEmployee
              employees={employees}
              onSelect={(emp) => { setEmployee(emp); setStep(3); setError(null); }}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepDateTime
              slug={slug}
              date={date}
              onDateChange={(d) => { setDate(d); setSlot(null); }}
              slots={slots}
              slotsLoading={slotsLoading}
              onSlot={(s) => { setSlot(s); setStep(4); setError(null); }}
              onBack={() => setStep(employees.length > 1 ? 2 : 1)}
              calYear={calYear}
              calMonth={calMonth}
              onPrevMonth={() => {
                if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); }
                else setCalMonth(m => m - 1);
                setDate(""); setSlots([]);
              }}
              onNextMonth={() => {
                if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); }
                else setCalMonth(m => m + 1);
                setDate(""); setSlots([]);
              }}
              availDates={availDates}
              calLoading={calLoading}
            />
          )}
          {step === 4 && (
            <StepDetails
              service={service}
              employee={employee}
              date={date}
              slot={slot}
              form={form}
              setForm={setForm}
              fieldValues={fieldValues}
              setFieldValues={setFieldValues}
              serviceFields={service?.fields || []}
              error={error}
              submitting={submitting}
              onBack={() => { setStep(3); setError(null); }}
              onSubmit={submit}
            />
          )}
          {step === 5 && (
            <StepConfirmation
              booked={booked}
              service={service}
              employee={employee}
              date={date}
              slot={slot}
              tenant={tenant}
            />
          )}
        </main>

        <footer className="bk-footer">
          Gestionado con&nbsp;<span className="bk-powered">Fresco</span>
        </footer>
      </div>
    </>
  );
}

function StepService({ services, onSelect }) {
  return (
    <>
      <div className="bk-step-title">¿Qué servicio necesitas?</div>
      <div className="bk-step-sub">Elige el servicio que quieres reservar.</div>
      {services.length === 0 ? (
        <div className="bk-empty">No hay servicios disponibles en este momento.</div>
      ) : (
        <div className="bk-service-list">
          {services.map((s) => (
            <button key={s.id} className="bk-service-card" onClick={() => onSelect(s)}>
              <div>
                <div className="bk-service-name">{s.name}</div>
                <div className="bk-service-meta">{s.duration} min</div>
              </div>
              <span className="bk-service-arrow">›</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function StepEmployee({ employees, onSelect, onBack }) {
  const initials = (name) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <>
      <button className="bk-btn-back" onClick={onBack}>← Volver</button>
      <div className="bk-step-title">Elige tu profesional</div>
      <div className="bk-step-sub">Selecciona quién quieres que te atienda.</div>
      {employees.length === 0 ? (
        <div className="bk-empty">No hay profesionales disponibles para este servicio.</div>
      ) : (
        <div className="bk-emp-list">
          {employees.map((e) => (
            <button key={e.id} className="bk-emp-card" onClick={() => onSelect(e)}>
              <div className="bk-emp-avatar">{initials(e.name)}</div>
              <div className="bk-emp-name">{e.name}</div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

const MONTHS_ES_FULL = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DOW_ES = ["L","M","X","J","V","S","D"];

function StepDateTime({
  date, onDateChange, slots, slotsLoading, onSlot, onBack,
  calYear, calMonth, onPrevMonth, onNextMonth,
  availDates, calLoading,
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const nowYear = new Date().getFullYear();
  const nowMonth = new Date().getMonth() + 1;
  const isPrevDisabled = calYear === nowYear && calMonth === nowMonth;

  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  // getDay() → 0=Sun; convert to Mon-first: (dow+6)%7
  const firstDow = (new Date(calYear, calMonth - 1, 1).getDay() + 6) % 7;
  const pad = (n) => String(n).padStart(2, "0");
  const toStr = (d) => `${calYear}-${pad(calMonth)}-${pad(d)}`;

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <>
      <button className="bk-btn-back" onClick={onBack}>← Volver</button>
      <div className="bk-step-title">Elige fecha y hora</div>
      <div className="bk-step-sub">Los días en verde tienen disponibilidad. Selecciona uno para ver las horas.</div>

      <div className="bk-cal">
        <div className="bk-cal-header">
          <button className="bk-cal-nav" onClick={onPrevMonth} disabled={isPrevDisabled}>‹</button>
          <span className="bk-cal-month">{MONTHS_ES_FULL[calMonth - 1]} {calYear}</span>
          <button className="bk-cal-nav" onClick={onNextMonth}>›</button>
        </div>

        <div className="bk-cal-weekdays">
          {DOW_ES.map((d) => <div key={d} className="bk-cal-wd">{d}</div>)}
        </div>

        <div className="bk-cal-grid">
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const ds = toStr(d);
            const isPast = ds < todayStr;
            const isSelected = ds === date;
            const isToday = ds === todayStr;
            const isAvail = availDates?.has(ds);
            const isUnavail = !calLoading && availDates && !availDates.has(ds) && !isPast;

            let cls = "bk-cal-day";
            if (isSelected) cls += " selected";
            else if (isPast) cls += " past";
            else if (calLoading) cls += " loading";
            else if (isAvail) cls += " avail";
            else if (isUnavail) cls += " unavail";
            if (isToday) cls += " today";

            const clickable = !isPast && !calLoading && isAvail && !isSelected;

            return (
              <div
                key={ds}
                className={cls}
                onClick={() => clickable && onDateChange(ds)}
                title={isPast ? "Fecha pasada" : isUnavail ? "Sin disponibilidad" : isAvail ? "Disponible" : ""}
              >
                {d}
              </div>
            );
          })}
        </div>

        <div className="bk-cal-legend">
          <div className="bk-cal-legend-item">
            <div className="bk-cal-legend-dot" style={{ background: "#dcfce7", border: "1px solid #4ade80" }} />
            Disponible
          </div>
          <div className="bk-cal-legend-item">
            <div className="bk-cal-legend-dot" style={{ background: "#fef2f2", border: "1px solid #fca5a5" }} />
            Sin plazas
          </div>
        </div>
      </div>

      {date && (
        <>
          <div className="bk-slots-title">
            {slotsLoading ? "Buscando horas…" : `Horas disponibles · ${fmtDate(date)}`}
          </div>
          {!slotsLoading && slots.length === 0 && (
            <div className="bk-no-slots">Sin disponibilidad para este día.</div>
          )}
          {!slotsLoading && slots.length > 0 && (
            <div className="bk-slot-grid">
              {slots.map((s, i) => (
                <button key={i} className="bk-slot" onClick={() => onSlot(s)}>
                  {fmtSlot(s)}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

function StepDetails({
  service, employee, date, slot,
  form, setForm, fieldValues, setFieldValues, serviceFields,
  error, submitting, onBack, onSubmit,
}) {
  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setFv = (id, v) =>
    setFieldValues((prev) => prev.map((fv) => (fv.fieldId === id ? { ...fv, value: v } : fv)));

  return (
    <>
      <button className="bk-btn-back" onClick={onBack}>← Volver</button>
      <div className="bk-step-title">Tus datos</div>
      <div className="bk-step-sub">Rellena tus datos de contacto para confirmar la cita.</div>

      <div className="bk-summary">
        <div className="bk-summary-title">Resumen de tu reserva</div>
        <div className="bk-summary-row"><span className="bk-summary-icon">✂</span>{service.name} · {service.duration} min</div>
        <div className="bk-summary-row"><span className="bk-summary-icon">📅</span>{fmtDate(date)} a las {fmtSlot(slot)}</div>
      </div>

      {error && <div className="bk-error">{error}</div>}

      <div className="bk-field">
        <label>Nombre completo *</label>
        <input className="bk-input" value={form.customerName} onChange={(e) => setField("customerName", e.target.value)} placeholder="Tu nombre" />
      </div>

      <div className="bk-input-2col">
        <div className="bk-field">
          <label>Email</label>
          <input className="bk-input" type="email" value={form.customerEmail} onChange={(e) => setField("customerEmail", e.target.value)} placeholder="email@ejemplo.com" />
        </div>
        <div className="bk-field">
          <label>Teléfono</label>
          <input className="bk-input" type="tel" value={form.customerPhone} onChange={(e) => setField("customerPhone", e.target.value)} placeholder="600 000 000" />
        </div>
      </div>

      {serviceFields.length > 0 && serviceFields.map((f) => {
        const fv = fieldValues.find((x) => x.fieldId === f.id);
        return (
          <div key={f.id} className="bk-field">
            <label>{f.label}{f.required ? " *" : ""}</label>
            {f.fieldType === "SELECT" ? (
              <select className={`bk-input bk-select`} value={fv?.value || ""} onChange={(e) => setFv(f.id, e.target.value)}>
                <option value="">Seleccionar…</option>
              </select>
            ) : (
              <input
                className="bk-input"
                type={f.fieldType === "NUMBER" ? "number" : "text"}
                value={fv?.value || ""}
                onChange={(e) => setFv(f.id, e.target.value)}
                required={f.required}
              />
            )}
          </div>
        );
      })}

      <div className="bk-field">
        <label>Notas (opcional)</label>
        <textarea className={`bk-input bk-textarea`} value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Cualquier información adicional…" />
      </div>

      <button className="bk-btn-primary" onClick={onSubmit} disabled={submitting}>
        {submitting ? "Confirmando…" : "Confirmar reserva"}
      </button>
    </>
  );
}

function StepConfirmation({ booked, service, employee, date, slot, tenant }) {
  return (
    <div className="bk-confirm">
      <div className="bk-confirm-icon">✓</div>
      <div className="bk-confirm-title">¡Reserva confirmada!</div>
      <div className="bk-confirm-sub">
        Hemos registrado tu cita en {tenant.name}.<br />
        {booked?.customerEmail && "Recibirás los detalles en tu correo electrónico."}
      </div>
      <div className="bk-confirm-detail">
        <div className="bk-confirm-row">
          <span className="bk-confirm-icon-sm">✂</span>
          <span className="bk-confirm-key">Servicio</span>
          <span className="bk-confirm-val">{service.name}</span>
        </div>
        <div className="bk-confirm-row">
          <span className="bk-confirm-icon-sm">📅</span>
          <span className="bk-confirm-key">Fecha</span>
          <span className="bk-confirm-val">{fmtDate(date)}</span>
        </div>
        <div className="bk-confirm-row">
          <span className="bk-confirm-icon-sm">🕐</span>
          <span className="bk-confirm-key">Hora</span>
          <span className="bk-confirm-val">{fmtSlot(slot)}</span>
        </div>
        {booked?.customerName && (
          <div className="bk-confirm-row">
            <span className="bk-confirm-icon-sm">👤</span>
            <span className="bk-confirm-key">Cliente</span>
            <span className="bk-confirm-val">{booked.customerName}</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--ink-muted)", lineHeight: 1.6 }}>
        ¿Necesitas cambiar tu reserva? Contacta directamente con {tenant.name}.
        {tenant.phone && <><br />Tel: {tenant.phone}</>}
      </div>
    </div>
  );
}
