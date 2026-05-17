import { useState } from "react";
import { useNavigate } from "react-router-dom";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink-deep: #1e3a8a;
    --blue: #1a3070;
    --ochre: #c9973a;
    --ochre-warm: rgba(201,151,58,0.9);
    --stone: #f4f0e6;
    --stone-border: #d8cfc0;
    --ink: #110e0a;
    --ink-muted: #6a5f52;
    --white: #ffffff;
  }

  html, body {
    height: 100%;
    margin: 0;
    padding: 0;
    width: 100%;
    overflow-x: hidden;
    background: #f4f0e6;
  }

  body {
    font-family: 'DM Sans', system-ui, sans-serif;
    background: #f4f0e6;
    min-height: 100vh;
  }

  .page {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    max-width: 100%;
    min-height: 100vh;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    align-items: stretch;
  }

  /* ── LEFT: pure chiaroscuro ── */
  .left {
    position: sticky;
    top: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 52px 56px;
    overflow: hidden;
    background: var(--ink-deep);
  }

  /* Single dramatic warm light source - top left, like a candle */
  .left::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 65% 55% at 0% 0%, rgba(201,151,58,0.22) 0%, transparent 60%),
      radial-gradient(ellipse 40% 40% at 100% 100%, rgba(30,58,138,0.35) 0%, transparent 55%);
    pointer-events: none;
  }

  /* Very subtle warm vignette at bottom */
  .left::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 80% 40% at 50% 110%, rgba(201,151,58,0.06) 0%, transparent 60%);
    pointer-events: none;
  }

  /* ── TOP SECTION ── */
  .left-top {
    position: relative;
    z-index: 1;
  }

  .brand-large {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 4rem;
    font-weight: 600;
    color: var(--white);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    line-height: 1;
  }

  .brand-rule {
    width: 48px;
    height: 1.5px;
    background: var(--ochre);
    margin-top: 14px;
  }

  .brand-sub {
    font-size: 0.62rem;
    font-weight: 400;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(201,151,58,0.55);
    margin-top: 10px;
  }

  /* ── BOTTOM SECTION ── */
  .left-bottom {
    position: relative;
    z-index: 1;
  }

  .left-kicker {
    font-size: 0.62rem;
    font-weight: 400;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
    margin-bottom: 18px;
  }

  .left-headline {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(3.2rem, 5.5vw, 5rem);
    font-weight: 300;
    color: var(--white);
    line-height: 1.04;
    letter-spacing: -0.02em;
  }

  .left-headline .italic {
    display: block;
    font-style: italic;
    font-weight: 300;
    color: rgba(255,255,255,0.32);
    font-size: 0.9em;
  }

  .left-headline .bold {
    display: block;
    font-weight: 700;
    color: rgba(255,255,255,0.95);
  }

  /* ── RIGHT ── */
  .right {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 52px;
    background: var(--stone);
    min-height: 100vh;
    overflow-y: auto;
  }

  .card {
    width: 100%;
    max-width: 370px;
  }

  /* Tabs */
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--stone-border);
    margin-bottom: 40px;
  }

  .tab {
    padding: 10px 0;
    margin-right: 24px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.83rem;
    font-weight: 500;
    color: var(--ink-muted);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }

  .tab.on {
    color: var(--blue);
    border-bottom-color: var(--ochre);
  }

  /* Heading */
  .card-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 2.8rem;
    font-weight: 300;
    color: var(--ink);
    line-height: 1.05;
    margin-bottom: 10px;
    letter-spacing: -0.015em;
  }

  .card-title em {
    font-style: italic;
    font-weight: 600;
    color: var(--blue);
  }

  .card-sub {
    font-size: 0.85rem;
    color: var(--ink-muted);
    line-height: 1.65;
    margin-bottom: 36px;
    font-weight: 300;
  }

  /* Section markers */
  .marker {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 22px 0 14px;
  }

  .marker-pip {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--ochre);
    flex-shrink: 0;
  }

  .marker-label {
    font-size: 0.64rem;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ink-muted);
    opacity: 0.7;
  }

  .marker-rule {
    flex: 1;
    height: 1px;
    background: var(--stone-border);
  }

  /* Fields */
  .f { margin-bottom: 12px; }

  .f label {
    display: block;
    font-size: 0.67rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 6px;
    opacity: 0.8;
  }

  .f input {
    width: 100%;
    padding: 11px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    font-weight: 300;
    color: var(--ink);
    background: var(--white);
    border: 1.5px solid var(--stone-border);
    border-radius: 6px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .f input:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(26,48,112,0.07);
  }

  .f input::placeholder {
    color: rgba(106,95,82,0.35);
    font-size: 0.84rem;
  }

  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  /* Button */
  .btn {
    width: 100%;
    margin-top: 10px;
    padding: 13px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.86rem;
    font-weight: 500;
    color: var(--white);
    background: #2b4590;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    letter-spacing: 0.04em;
    position: relative;
    overflow: hidden;
    transition: background 0.15s, transform 0.12s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(8,12,30,0.28);
  }

  .btn::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 16px;
    right: 16px;
    height: 1.5px;
    background: rgba(201,151,58,0.6);
    border-radius: 1px;
  }

  .btn:hover {
    background: #243f90;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(8,12,30,0.36);
  }

  .btn:active { transform: translateY(0); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

  .alert {
    font-size: 0.82rem;
    padding: 10px 13px;
    border-radius: 6px;
    margin-bottom: 14px;
    line-height: 1.5;
  }

  .alert.err { background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; }
  .alert.ok  { background: #f0fdf4; border: 1px solid #86efac; color: #15803d; }

  .foot {
    text-align: center;
    margin-top: 22px;
    font-size: 0.78rem;
    color: var(--ink-muted);
    font-weight: 300;
  }

  .foot-link {
    color: var(--ochre);
    font-weight: 500;
    cursor: pointer;
  }

  .mobile-header {
    display: none;
    align-items: center;
    gap: 14px;
    margin-bottom: 36px;
  }

  .mobile-brand {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 2rem;
    font-weight: 600;
    color: var(--blue);
    letter-spacing: 0.1em;
  }

  .mobile-brand-sub {
    font-size: 0.62rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink-muted);
    font-weight: 400;
    margin-top: 2px;
  }

  .mobile-rule {
    width: 2px;
    height: 32px;
    background: var(--stone-border);
    border-radius: 1px;
  }

  @media (max-width: 860px) {
    .page { grid-template-columns: 1fr; }
    .left { display: none; }
    .right { padding: 40px 28px; min-height: 100vh; }
    .mobile-header { display: flex; }
    .card-title { font-size: 2.4rem; }
  }

  @media (max-width: 480px) {
    .right { padding: 28px 16px; }
    .card-title { font-size: 2rem; }
    .card-sub { font-size: 0.82rem; margin-bottom: 28px; }
    .two { grid-template-columns: 1fr; }
    .brand-large { font-size: 3rem; }
  }

  /* ── PLANES ── */
  .card.wide { max-width: 680px; }

  .auth-plans-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 8px;
  }

  @media (max-width: 640px) {
    .auth-plans-grid { grid-template-columns: 1fr; }
  }

  .auth-plan {
    background: var(--white);
    border: 1.5px solid var(--stone-border);
    border-radius: 10px;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .auth-plan.pro {
    background: var(--blue);
    border-color: var(--blue);
    color: var(--white);
  }

  .auth-plan-badge {
    font-size: 0.6rem;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ochre);
    margin-bottom: 8px;
  }

  .auth-plan-name {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.7rem;
    font-weight: 600;
    color: var(--ink);
    line-height: 1;
    margin-bottom: 4px;
  }

  .auth-plan.pro .auth-plan-name { color: var(--white); }

  .auth-plan-price {
    font-size: 2rem;
    font-weight: 700;
    color: var(--blue);
    line-height: 1.1;
    margin-top: 8px;
  }

  .auth-plan.pro .auth-plan-price { color: var(--ochre); }

  .auth-plan-price-sub {
    font-size: 0.74rem;
    color: var(--ink-muted);
    margin-bottom: 14px;
  }

  .auth-plan.pro .auth-plan-price-sub { color: rgba(255,255,255,0.45); }

  .auth-plan-divider {
    height: 1px;
    background: var(--stone-border);
    margin: 10px 0 14px;
  }

  .auth-plan.pro .auth-plan-divider { background: rgba(255,255,255,0.15); }

  .auth-plan-features {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 7px;
    flex: 1;
    margin-bottom: 20px;
  }

  .auth-plan-feature {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 0.79rem;
    color: var(--ink-muted);
    line-height: 1.4;
  }

  .auth-plan.pro .auth-plan-feature { color: rgba(255,255,255,0.7); }

  .auth-plan-check {
    color: var(--ochre);
    font-weight: 700;
    flex-shrink: 0;
    font-size: 0.85rem;
  }

  .auth-plan-cta {
    width: 100%;
    padding: 11px;
    border-radius: 6px;
    border: 1.5px solid var(--blue);
    background: transparent;
    color: var(--blue);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.84rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.03em;
  }

  .auth-plan-cta:hover { background: var(--blue); color: var(--white); }

  .auth-plan-cta.cta-pro {
    background: var(--ochre);
    border-color: var(--ochre);
    color: var(--white);
    box-shadow: 0 4px 14px rgba(201,151,58,0.35);
  }

  .auth-plan-cta.cta-pro:hover { background: #b8842e; border-color: #b8842e; }

  .auth-plan-cta:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PLAN_FEATURES = [
  "Reservas ilimitadas de clientes",
  "Portal de reservas con URL personalizada",
  "Gestión de servicios y campos personalizados",
  "Horarios por empleado con jornadas partidas",
  "Panel de administración con calendario",
  "Creación manual de reservas desde el panel",
];

function AuthPlanCard({ badge, name, price, priceSub, features, ctaLabel, ctaClass, ctaDisabled, pro }) {
  return (
    <div className={`auth-plan${pro ? " pro" : ""}`}>
      <div className="auth-plan-badge">{badge}</div>
      <div className="auth-plan-name">{name}</div>
      <div className="auth-plan-price">{price}</div>
      <div className="auth-plan-price-sub">{priceSub}</div>
      <div className="auth-plan-divider" />
      <ul className="auth-plan-features">
        {features.map((f, i) => (
          <li key={i} className="auth-plan-feature">
            <span className="auth-plan-check">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <button className={`auth-plan-cta${ctaClass ? " " + ctaClass : ""}`} disabled={ctaDisabled}>
        {ctaLabel}
      </button>
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lf, setLf] = useState({ email: "", password: "" });
  const [rf, setRf] = useState({
    tenantName: "",
    tenantSlug: "",
    tenantEmail: "",
    tenantPhone: "",
    tenantAddress: "",
    userName: "",
    userEmail: "",
    userPassword: "",
  });

  const go = (t) => {
    setTab(t);
    setError("");
    setSuccess("");
  };
  const ul = (k) => (e) => setLf((p) => ({ ...p, [k]: e.target.value }));
  const ur = (k) => (e) => setRf((p) => ({ ...p, [k]: e.target.value }));

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lf),
      });
      if (!r.ok) throw new Error("Credenciales incorrectas.");
      const d = await r.json();
      localStorage.setItem("token", d.token);
      localStorage.setItem("tenantId", d.tenantId);
      localStorage.setItem("userName", d.userName);
      navigate("/dashboard");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rf),
      });
      if (!r.ok) throw new Error("Error en el registro.");
      const d = await r.json();
      localStorage.setItem("token", d.token);
      localStorage.setItem("tenantId", d.tenantId);
      localStorage.setItem("userName", d.userName);
      navigate("/dashboard");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <div className="left">
          <div className="left-top">
            <div className="brand-large">Fresco</div>
            <div className="brand-rule" />
            <div className="brand-sub">Plataforma de reservas</div>
          </div>

          <div className="left-bottom">
            <div className="left-kicker">Para negocios que crecen</div>
            <div className="left-headline">
              Tu negocio,
              <span className="italic">tu espacio.</span>
              <span className="bold">Sin límites.</span>
            </div>
          </div>
        </div>

        <div className="right">
          <div className={`card${tab === "planes" ? " wide" : ""}`}>
            <div className="mobile-header">
              <div>
                <div className="mobile-brand">Fresco</div>
                <div className="mobile-brand-sub">Plataforma de reservas</div>
              </div>
              <div className="mobile-rule" />
            </div>
            <div className="tabs">
              <button
                className={`tab ${tab === "login" ? "on" : ""}`}
                onClick={() => go("login")}
              >
                Iniciar sesión
              </button>
              <button
                className={`tab ${tab === "register" ? "on" : ""}`}
                onClick={() => go("register")}
              >
                Crear negocio
              </button>
              <button
                className={`tab ${tab === "planes" ? "on" : ""}`}
                onClick={() => go("planes")}
              >
                Planes
              </button>
            </div>

            {tab !== "planes" && (
              <>
                <div className="card-title">
                  {tab === "login" ? (
                    <>Accede a tu <em>panel</em></>
                  ) : (
                    <>Empieza <em>hoy</em></>
                  )}
                </div>
                <div className="card-sub">
                  {tab === "login"
                    ? "Introduce tus credenciales para continuar."
                    : "Configura tu negocio en menos de dos minutos."}
                </div>
              </>
            )}

            {error && tab !== "planes" && <div className="alert err">{error}</div>}
            {success && tab !== "planes" && <div className="alert ok">{success}</div>}

            {tab === "planes" && (
              <>
                <div className="card-title">Planes y <em>precios</em></div>
                <div className="card-sub">Empieza gratis durante 30 días. Sin tarjeta de crédito.</div>
                <div className="auth-plans-grid">
                  <AuthPlanCard
                    badge="Prueba gratuita"
                    name="1 mes gratis"
                    price="0€"
                    priceSub="30 días · sin tarjeta"
                    features={PLAN_FEATURES}
                    ctaLabel="Crear mi negocio →"
                    ctaDisabled={false}
                    pro={false}
                  />
                  <AuthPlanCard
                    badge="Plan profesional"
                    name="Fresco Pro"
                    price="29€"
                    priceSub="por mes · facturación mensual"
                    features={[...PLAN_FEATURES, "Empleados ilimitados", "Soporte prioritario", "Nuevas funciones anticipadas"]}
                    ctaLabel="Próximamente"
                    ctaClass="cta-pro"
                    ctaDisabled={true}
                    pro={true}
                  />
                </div>
              </>
            )}

            {tab !== "planes" && (tab === "login" ? (
              <form onSubmit={login}>
                <div className="f">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="tu@negocio.com"
                    value={lf.email}
                    onChange={ul("email")}
                    required
                  />
                </div>
                <div className="f">
                  <label>Contraseña</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={lf.password}
                    onChange={ul("password")}
                    required
                  />
                </div>
                <button className="btn" disabled={loading}>
                  {loading ? "Accediendo..." : "Entrar al panel →"}
                </button>
              </form>
            ) : (
              <form onSubmit={register}>
                <div className="marker">
                  <div className="marker-pip" />
                  <div className="marker-label">Tu negocio</div>
                  <div className="marker-rule" />
                </div>
                <div className="f">
                  <label>Nombre</label>
                  <input
                    type="text"
                    placeholder="Bar Paco"
                    value={rf.tenantName}
                    onChange={ur("tenantName")}
                    required
                  />
                </div>
                <div className="two">
                  <div className="f">
                    <label>Slug</label>
                    <input
                      type="text"
                      placeholder="bar-paco"
                      value={rf.tenantSlug}
                      onChange={ur("tenantSlug")}
                      required
                    />
                  </div>
                  <div className="f">
                    <label>Teléfono</label>
                    <input
                      type="text"
                      placeholder="600 123 456"
                      value={rf.tenantPhone}
                      onChange={ur("tenantPhone")}
                    />
                  </div>
                </div>
                <div className="two">
                  <div className="f">
                    <label>Email negocio</label>
                    <input
                      type="email"
                      placeholder="info@negocio.com"
                      value={rf.tenantEmail}
                      onChange={ur("tenantEmail")}
                      required
                    />
                  </div>
                  <div className="f">
                    <label>Dirección</label>
                    <input
                      type="text"
                      placeholder="Calle Mayor 1"
                      value={rf.tenantAddress}
                      onChange={ur("tenantAddress")}
                    />
                  </div>
                </div>
                <div className="marker">
                  <div className="marker-pip" />
                  <div className="marker-label">Tu cuenta</div>
                  <div className="marker-rule" />
                </div>
                <div className="f">
                  <label>Tu nombre</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={rf.userName}
                    onChange={ur("userName")}
                    required
                  />
                </div>
                <div className="two">
                  <div className="f">
                    <label>Email personal</label>
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      value={rf.userEmail}
                      onChange={ur("userEmail")}
                      required
                    />
                  </div>
                  <div className="f">
                    <label>Contraseña</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={rf.userPassword}
                      onChange={ur("userPassword")}
                      required
                    />
                  </div>
                </div>
                <button className="btn" disabled={loading}>
                  {loading ? "Creando..." : "Crear mi negocio →"}
                </button>
              </form>
            ))}

            {tab !== "planes" && (
              <div className="foot">
                {tab === "login" ? (
                  <>
                    <span>¿Sin cuenta? </span>
                    <span className="foot-link" onClick={() => go("register")}>
                      Regístrate gratis
                    </span>
                  </>
                ) : (
                  <>
                    <span>¿Ya tienes cuenta? </span>
                    <span className="foot-link" onClick={() => go("login")}>
                      Inicia sesión
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
