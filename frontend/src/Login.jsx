import React, { useState } from "react";
import {
  Activity, ArrowRight, Eye, EyeOff, LockKeyhole,
  Mail, ShieldCheck, Sparkles, GraduationCap,
  Users, BriefcaseBusiness, Check
} from "lucide-react";
import "./Login.css";

const roles = [
  { id: "Student", title: "Student", description: "Track your learning and progress", icon: GraduationCap },
  { id: "Class Coordinator", title: "Class Coordinator", description: "Monitor student success", icon: Users },
  { id: "Company HR", title: "Company HR", description: "Discover career-ready talent", icon: BriefcaseBusiness }
];

export default function Login({ onLogin }) {
  const [role, setRole] = useState("Student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");


  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    // Demo only. Real authentication will be connected to FastAPI later.
    onLogin(role);
  }

  return (
    <main className="login-page">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />

      <header className="login-header">
        <a className="login-brand" href="#" onClick={(e) => e.preventDefault()}>
          <span className="login-brand-icon"><Activity size={23} strokeWidth={2.5} /></span>
          <span>ontrack<span className="login-brand-dot">.</span><small>SMART CAMPUS ANALYTICS</small></span>
        </a>
        <div className="login-header-right"><ShieldCheck size={15} /> Secure workspace</div>
      </header>

      <div className="login-layout">
        <section className="login-promo">
          <div className="promo-pill"><Sparkles size={14} /> YOUR FUTURE, IN FOCUS</div>
          <h1>Every student.<br />Every possibility.<br /><span>On track.</span></h1>
          <p className="promo-description">
            Turn academic data into meaningful action.
            Discover potential, support student growth, and
            build brighter futures — all in one place.
          </p>

          <div className="promo-stats">
            <div><strong>01</strong><span>Understand<br />performance</span></div>
            <i />
            <div><strong>02</strong><span>Identify<br />opportunities</span></div>
            <i />
            <div><strong>03</strong><span>Improve<br />outcomes</span></div>
          </div>

          <div className="promo-visual">
            <div className="visual-top"><span><i /> STUDENT SUCCESS INDEX</span><span>LIVE PREVIEW</span></div>
            <div className="visual-score-row">
              <div><small>Overall success score</small><strong>86.2<span>/100</span></strong><em>↗ 12.8% this semester</em></div>
              <div className="visual-circle"><div><GraduationCap size={25} /><strong>86%</strong></div></div>
            </div>
            <div className="visual-bars">
              <div><span>Academic performance</span><i><b style={{width:"86%"}} /></i><strong>86%</strong></div>
              <div><span>Career readiness</span><i><b style={{width:"73%"}} /></i><strong>73%</strong></div>
              <div><span>Skill development</span><i><b style={{width:"91%"}} /></i><strong>91%</strong></div>
            </div>
            <div className="visual-orb" />
          </div>
          <div className="promo-footnote"><span>✦</span> Helping potential become progress.</div>
        </section>

        <section className="login-form-side">
          <div className="login-card">
            <div className="login-card-symbol"><LockKeyhole size={22} /></div>
            <div className="login-welcome">WELCOME TO ONTRACK</div>
            <h2>Sign in to continue</h2>
            <p className="login-subtitle">Choose your role and access your workspace.</p>

            <div className="role-picker-label">SIGN IN AS</div>
            <div className="login-role-options">
              {roles.map(({ id, title, description, icon: Icon }) => (
                <button
                  type="button"
                  key={id}
                  className={`login-role-option ${role === id ? "selected" : ""}`}
                  onClick={() => { setRole(id); setError(""); }}
                  aria-pressed={role === id}
                >
                  <span className="login-role-icon"><Icon size={19} /></span>
                  <span className="login-role-copy">
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                  <span className="login-role-check">{role === id && <Check size={14} />}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="login-email">Email address</label>
              <div className="login-input-wrap">
                <Mail size={17} />
                <input id="login-email" type="email" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
              </div>

              <div className="password-label-row">
                <label htmlFor="login-password">Password</label>
                <button type="button" className="forgot-link" onClick={() => setError("Password recovery will be available after backend authentication is connected.")}>Forgot password?</button>
              </div>
              <div className="login-input-wrap">
                <LockKeyhole size={17} />
                <input id="login-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>

              <label className="remember-row"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /><span>Remember me</span></label>

              {error && <div className="login-error" role="alert">{error}</div>}

              <button className="login-submit" type="submit">
                Continue as {role} <ArrowRight size={17} />
              </button>
            </form>

            <div className="login-separator"><span /> <small>BUILT FOR STUDENT SUCCESS</small> <span /></div>
            <div className="login-security"><ShieldCheck size={16} /><span>Your learning journey deserves a secure space.</span></div>
          </div>
          <div className="login-bottom-note">Need access? <span>Contact your campus coordinator</span></div>
        </section>
      </div>

      <footer className="login-footer"><span>© 2026 OnTrack · Smart Campus Analytics</span><span>Made for better student outcomes <b>✦</b></span></footer>
    </main>
  );
}
