import { useState, useEffect, useRef } from "react";
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
    --ochre-dark: #a67a28;
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
  .emp-login-wrap {
    min-height: 100svh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--stone);
  }

  .emp-login-card {
    background: var(--white);
    border: 1px solid var(--stone-border);
    border-radius: 14px;
    padding: 40px 36px;
    width: 100%;
    max-width: 360px;
    box-shadow: 0 4px 32px rgba(17,14,10,0.07);
  }

  .emp-brand {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--blue);
    letter-spacing: 0.06em;
    margin-bottom: 2px;
  }

  .emp-brand-sub {
    font-size: 0.73rem;
    font-weight: 400;
    color: var(--ink-muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--stone-border);
  }

  .emp-field { margin-bottom: 16px; }
  .emp-field label { display: block; font-size: 0.75rem; font-weight: 500; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
  .emp-field select,
  .emp-field input {
    width: 100%;
    padding: 9px 12px;
    border: 1.5px solid var(--stone-border);
    border-radius: 7px;
    font-size: 0.88rem;
    font-family: inherit;
    background: var(--white);
    color: var(--ink);
    outline: none;
    transition: border-color 0.15s;
  }
  .emp-field select:focus,
  .emp-field input:focus { border-color: var(--blue); }

  .emp-pin {
    font-size: 1.4rem;
    letter-spacing: 0.3em;
    text-align: center;
    font-family: monospace;
  }

  .emp-btn {
    width: 100%;
    padding: 10px;
    background: var(--blue);
    color: #fff;
    border: none;
    border-radius: 7px;
    font-size: 0.88rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
    margin-top: 8px;
  }
  .emp-btn:hover { background: var(--blue-mid); }
  .emp-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .emp-error {
    font-size: 0.78rem;
    color: var(--error);
    background: rgba(220,38,38,0.07);
    border-radius: 6px;
    padding: 8px 12px;
    margin-top: 12px;
    text-align: center;
  }

  /* ── PORTAL ── */
  .emp-portal {
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    background: var(--stone);
  }

  .emp-header {
    background: var(--blue);
    padding: 14px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    position: sticky;
    top: 0;
    z-index: 20;
  }

  .emp-header-brand {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.3rem;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.06em;
    margin-right: auto;
  }

  .emp-header-name {
    font-size: 0.80rem;
    color: rgba(255,255,255,0.7);
  }

  .emp-header-logout {
    font-size: 0.76rem;
    color: rgba(255,255,255,0.55);
    background: none;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 5px;
    padding: 4px 10px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .emp-header-logout:hover { color: #fff; border-color: rgba(255,255,255,0.5); }

  /* ── CONTROLS ── */
  .emp-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 24px;
    background: var(--white);
    border-bottom: 1px solid var(--stone-border);
    flex-wrap: wrap;
  }

  .emp-date-nav {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .emp-nav-btn {
    width: 30px;
    height: 30px;
    border: 1.5px solid var(--stone-border);
    border-radius: 6px;
    background: var(--white);
    cursor: pointer;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.12s;
  }
  .emp-nav-btn:hover { border-color: var(--blue-light); }

  .emp-date-input {
    padding: 5px 10px;
    border: 1.5px solid var(--stone-border);
    border-radius: 6px;
    font-size: 0.84rem;
    font-family: inherit;
    background: var(--white);
    color: var(--ink);
    outline: none;
  }
  .emp-date-input:focus { border-color: var(--blue); }

  .emp-granularity {
    display: flex;
    gap: 4px;
    margin-left: auto;
  }

  .emp-gran-btn {
    padding: 4px 10px;
    font-size: 0.76rem;
    border: 1.5px solid var(--stone-border);
    border-radius: 5px;
    background: var(--white);
    cursor: pointer;
    transition: all 0.12s;
  }
  .emp-gran-btn.active {
    background: var(--blue);
    border-color: var(--blue);
    color: #fff;
    font-weight: 500;
  }

  /* ── SCHEDULE TABLE ── */
  .emp-table-wrap {
    flex: 1;
    overflow: auto;
    padding: 20px 24px;
  }

  .emp-table {
    border-collapse: collapse;
    width: 100%;
    min-width: 500px;
    background: var(--white);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 1px 8px rgba(17,14,10,0.06);
    font-size: 0.82rem;
  }

  .emp-table th {
    padding: 10px 12px;
    text-align: center;
    font-weight: 500;
    font-size: 0.78rem;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  .emp-table th.col-blue { background: var(--blue); color: #fff; }
  .emp-table th.col-ochre { background: var(--ochre); color: #fff; }

  .emp-table th.time-col {
    background: #0f2050;
    color: #fff;
    min-width: 56px;
    font-size: 0.72rem;
  }

  .emp-table td {
    border: 1px solid #eee;
    vertical-align: top;
    padding: 0;
    min-width: 130px;
  }

  .emp-table td.time-cell {
    background: var(--stone);
    color: var(--ink-muted);
    font-size: 0.72rem;
    font-weight: 500;
    text-align: right;
    padding: 4px 8px;
    white-space: nowrap;
    border-color: #ddd;
    min-width: 56px;
    vertical-align: middle;
  }

  .emp-table td.emp-col-blue { background: var(--white); }
  .emp-table td.emp-col-ochre { background: rgba(201,151,58,0.04); }

  .emp-booking-card {
    padding: 6px 10px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
  }

  .emp-booking-card.col-blue {
    border-left: 3px solid var(--blue);
    background: rgba(26,48,112,0.05);
  }

  .emp-booking-card.col-ochre {
    border-left: 3px solid var(--ochre);
    background: rgba(201,151,58,0.08);
  }

  .emp-booking-client {
    font-weight: 600;
    font-size: 0.80rem;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .emp-booking-service {
    font-size: 0.72rem;
    color: var(--ink-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .emp-booking-time {
    font-size: 0.68rem;
    color: var(--blue-light);
    margin-top: 2px;
  }

  .emp-empty {
    color: var(--ink-muted);
    font-size: 0.82rem;
    text-align: center;
    padding: 40px;
  }

  .emp-today-btn {
    padding: 5px 12px;
    font-size: 0.76rem;
    border: 1.5px solid var(--stone-border);
    border-radius: 5px;
    background: var(--white);
    cursor: pointer;
    transition: border-color 0.12s;
  }
  .emp-today-btn:hover { border-color: var(--blue-light); }
`;

const empApi = (path, opts = {}) => {
  const token = localStorage.getItem("empToken");
  return fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...opts,
  }).then((r) => { if (!r.ok) throw r; return r.json(); });
};

const toDateStr = (d) => d.toISOString().slice(0, 10);

// Java DayOfWeek: 1=Mon...7=Sun → JS getDay(): 0=Sun,1=Mon...6=Sat
const javaToJsDay = (javaDay) => javaDay % 7;

const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return toDateStr(d);
};

// Navigate to the next/previous working day (direction: +1 or -1), skipping non-working days.
const findWorkingDay = (dateStr, direction, workingJsDays) => {
  if (!workingJsDays || workingJsDays.size === 0) return addDays(dateStr, direction);
  let d = dateStr;
  for (let i = 0; i < 7; i++) {
    d = addDays(d, direction);
    const jsDay = new Date(d + "T12:00:00").getDay();
    if (workingJsDays.has(jsDay)) return d;
  }
  return addDays(dateStr, direction);
};

const DAY_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const fmtDate = (dateStr) => {
  const d = new Date(dateStr + "T12:00:00");
  return `${DAY_ES[d.getDay()]} ${d.getDate()} ${MONTH_ES[d.getMonth()]}`;
};

/* ── LOGIN ── */
function EmployeeLogin({ slug, tenantName, onLogin }) {
  const [staff, setStaff] = useState([]);
  const [empId, setEmpId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/${slug}/employee/staff`)
      .then((r) => r.json())
      .then(setStaff)
      .catch(() => {});
  }, [slug]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await fetch(`${API}/${slug}/employee/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: Number(empId), pin }),
      }).then((r) => { if (!r.ok) throw new Error(); return r.json(); });

      localStorage.setItem("empToken", data.token);
      localStorage.setItem("empName", data.name);
      localStorage.setItem("empId", String(data.employeeId));
      onLogin(data);
    } catch {
      setError("PIN incorrecto o empleado no encontrado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="emp-login-wrap">
      <div className="emp-login-card">
        <div className="emp-brand">Fresco</div>
        <div className="emp-brand-sub">{tenantName || slug} · Portal empleados</div>

        <form onSubmit={submit}>
          <div className="emp-field">
            <label>Tu nombre</label>
            <select value={empId} onChange={(e) => setEmpId(e.target.value)} required>
              <option value="">Selecciona tu nombre…</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="emp-field">
            <label>PIN de acceso</label>
            <input
              type="password"
              className="emp-pin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={8}
              placeholder="••••••"
              required
            />
          </div>
          <button className="emp-btn" disabled={loading || !empId}>
            {loading ? "Accediendo…" : "Entrar →"}
          </button>
          {error && <div className="emp-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}

/* ── PORTAL ── */
function EmployeePortal({ slug, empInfo, onLogout }) {
  const [date, setDate] = useState(toDateStr(new Date()));
  const [granularity, setGranularity] = useState(30);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  // Working days as a JS Set of getDay() values (0=Sun...6=Sat), built from first successful fetch.
  const workingDaysRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    empApi(`/emp/schedule?date=${date}&granularity=${granularity}`)
      .then((data) => {
        setSchedule(data);
        // Cache working days for smart navigation (convert Java DayOfWeek to JS getDay()).
        if (data.workingDaysOfWeek && data.workingDaysOfWeek.length > 0) {
          workingDaysRef.current = new Set(data.workingDaysOfWeek.map(javaToJsDay));
        }
      })
      .catch(() => setSchedule(null))
      .finally(() => setLoading(false));
  }, [date, granularity]);

  const navDay = (direction) =>
    setDate((d) => findWorkingDay(d, direction, workingDaysRef.current));

  const buildGrid = (sched) => {
    const { slots, employees } = sched;
    const grid = {};
    slots.forEach((_, si) => { grid[si] = {}; });

    employees.forEach((emp) => {
      emp.bookings.forEach((b) => {
        if (b.startSlotIndex >= 0 && b.startSlotIndex < slots.length) {
          grid[b.startSlotIndex][emp.id] = b;
          for (let i = 1; i < b.spanSlots; i++) {
            const idx = b.startSlotIndex + i;
            if (idx < slots.length) grid[idx][emp.id] = "skip";
          }
        }
      });
    });
    return grid;
  };

  const isToday = date === toDateStr(new Date());

  return (
    <div className="emp-portal">
      <div className="emp-header">
        <div className="emp-header-brand">Fresco</div>
        <div className="emp-header-name">Hola, {empInfo.name}</div>
        <button className="emp-header-logout" onClick={onLogout}>Salir</button>
      </div>

      <div className="emp-controls">
        <div className="emp-date-nav">
          <button className="emp-nav-btn" onClick={() => navDay(-1)}>‹</button>
          <input
            type="date"
            className="emp-date-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button className="emp-nav-btn" onClick={() => navDay(1)}>›</button>
        </div>
        <span style={{ fontSize: "0.82rem", color: "var(--ink-muted)", fontWeight: 500 }}>
          {fmtDate(date)}{isToday ? " · Hoy" : ""}
        </span>
        {!isToday && (
          <button className="emp-today-btn" onClick={() => setDate(toDateStr(new Date()))}>
            Hoy
          </button>
        )}
        <div className="emp-granularity">
          {[15, 30, 60].map((g) => (
            <button
              key={g}
              className={`emp-gran-btn${granularity === g ? " active" : ""}`}
              onClick={() => setGranularity(g)}
            >
              {g} min
            </button>
          ))}
        </div>
      </div>

      <div className="emp-table-wrap">
        {loading && <div className="emp-empty">Cargando horario…</div>}
        {!loading && !schedule && <div className="emp-empty">No se pudo cargar el horario.</div>}
        {!loading && schedule && schedule.slots.length === 0 && (
          <div className="emp-empty">El negocio no tiene horario configurado para este día.</div>
        )}
        {!loading && schedule && schedule.slots.length > 0 && (() => {
          const grid = buildGrid(schedule);
          const myId = schedule.loggedEmployeeId;

          return (
            <table className="emp-table">
              <thead>
                <tr>
                  <th className="time-col">Hora</th>
                  {schedule.employees.map((emp, i) => {
                    const colorCls = i % 2 === 0 ? "col-blue" : "col-ochre";
                    return (
                      <th key={emp.id} className={colorCls}>
                        {emp.name}{emp.id === myId ? " ★" : ""}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {schedule.slots.map((slot, si) => (
                  <tr key={slot}>
                    <td className="time-cell">{slot}</td>
                    {schedule.employees.map((emp, i) => {
                      const colorCls = i % 2 === 0 ? "col-blue" : "col-ochre";
                      const cell = grid[si]?.[emp.id];
                      if (cell === "skip") return null;
                      if (!cell) {
                        return <td key={emp.id} className={`emp-col-${i % 2 === 0 ? "blue" : "ochre"}`} />;
                      }
                      return (
                        <td
                          key={emp.id}
                          rowSpan={Math.min(cell.spanSlots, schedule.slots.length - si)}
                          className={`emp-col-${i % 2 === 0 ? "blue" : "ochre"}`}
                          style={{ padding: 0 }}
                        >
                          <div className={`emp-booking-card ${colorCls}`}>
                            <div className="emp-booking-client">{cell.clientName}</div>
                            <div className="emp-booking-service">{cell.serviceName}</div>
                            <div className="emp-booking-time">{cell.startTime} – {cell.endTime}</div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </div>
    </div>
  );
}

/* ── PAGE ── */
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
    fetch(`${API}/${slug}/booking/info`)
      .then((r) => r.json())
      .then((d) => setTenantName(d.name))
      .catch(() => {});
  }, [slug]);

  const handleLogin = (data) => setEmpInfo(data);

  const handleLogout = () => {
    localStorage.removeItem("empToken");
    localStorage.removeItem("empName");
    localStorage.removeItem("empId");
    setEmpInfo(null);
  };

  return (
    <>
      <style>{styles}</style>
      {empInfo
        ? <EmployeePortal slug={slug} empInfo={empInfo} onLogout={handleLogout} />
        : <EmployeeLogin slug={slug} tenantName={tenantName} onLogin={handleLogin} />
      }
    </>
  );
}
