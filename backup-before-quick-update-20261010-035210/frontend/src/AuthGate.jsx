import { useEffect, useState } from "react";
import {
  Activity, ArrowRight, Eye, EyeOff, GraduationCap, ShieldCheck,
  Users, BriefcaseBusiness, Mail, LockKeyhole, Sparkles, CheckCircle2
} from "lucide-react";
import { api } from "./api";
import App from "./App";
import "./auth.css";

const portalOptions = [
  { id: "login", title: "Student", detail: "Your learning and progress", icon: GraduationCap },
  { id: "coordinator_login", title: "Coordinator", detail: "Class progress and support", icon: Users },
  { id: "hr_login", title: "Company HR", detail: "Career and talent workspace", icon: BriefcaseBusiness },
];

export default function AuthGate() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("login");
  const [roleView, setRoleView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [branch, setBranch] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [passoutYear, setPassoutYear] = useState("");
  const [college, setCollege] = useState("");
  const [degree, setDegree] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    api.getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  function chooseView(next) {
    setView(next);
    setRoleView(next === "signup" ? "login" : next);
    setError("");
    setSuccessMsg("");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccessMsg("");
    try {
      await api.login({ email: email.trim(), password });
      const me = await api.getMe();
      const expectedRole = view === "hr_login" ? "company_hr"
        : view === "coordinator_login" ? "class_coordinator" : "student";
      if (me.role !== expectedRole) {
        await api.logout();
        throw new Error(`This account is registered as ${me.role.replaceAll("_", " ")}. Please use the correct portal.`);
      }
      setUser(me);
    } catch (err) {
      setError(err.message || "Unable to sign in. Check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccessMsg("");
    try {
      await api.register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        branch: branch.trim(),
        college: college.trim(),
        degree: degree.trim(),
        academic_year: academicYear,
        graduation_year: passoutYear.trim(),
        role: "student",
      });
      setSuccessMsg("Your student account is ready. Sign in with your new credentials.");
      setPassword("");
      setView("login");
      setRoleView("login");
    } catch (err) {
      setError(err.message || "Unable to create your account.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="auth-loading"><span className="brand-mark"><Activity size={22} /></span><span>Preparing your OnTrack workspace…</span></div>;
  }
  if (user) return <App user={user} onLogout={() => setUser(null)} />;

  const isSignup = view === "signup";
  const heading = isSignup ? "Create your account" : view === "hr_login" ? "Welcome, hiring team" : view === "coordinator_login" ? "Welcome, coordinator" : "Welcome back";
  const subtitle = isSignup ? "Start building a clearer picture of your academic journey." : "Sign in to continue to your personalized workspace.";

  return (
    <main className="auth-shell">
      <div className="auth-background-orb orb-one" />
      <div className="auth-background-orb orb-two" />
      <header className="auth-topbar">
        <a className="auth-brand" href="/" onClick={(e) => e.preventDefault()}>
          <span className="brand-mark"><Activity size={23} strokeWidth={2.5} /></span>
          <span className="brand-word">ontrack<span>.</span><small>STUDENT SUCCESS PLATFORM</small></span>
        </a>
        <div className="secure-label"><ShieldCheck size={16} /> Secure workspace</div>
      </header>

      <section className="auth-layout">
        <div className="auth-story">
          <div className="story-eyebrow"><Sparkles size={14} /> YOUR FUTURE, IN FOCUS</div>
          <h1>Make progress<br />you can <span>see.</span></h1>
          <p className="story-copy">One place to bring your learning, skills, goals, and career journey together — and turn small steps into meaningful progress.</p>
          <div className="story-points">
            <div><span className="point-icon"><CheckCircle2 size={18} /></span><div><strong>Know where you stand</strong><small>Keep your learning and tasks organized.</small></div></div>
            <div><span className="point-icon"><Activity size={18} /></span><div><strong>Build momentum</strong><small>Record skills and learning sessions as you go.</small></div></div>
            <div><span className="point-icon"><ShieldCheck size={18} /></span><div><strong>One secure workspace</strong><small>Access is tied to your verified account role.</small></div></div>
          </div>
          <div className="story-bottom"><span className="story-line" /> Helping potential become progress.</div>
        </div>

        <div className="auth-panel">
          <div className="auth-card">
            <div className="auth-card-top"><span className="auth-card-icon"><LockKeyhole size={20} /></span><span className="auth-card-kicker">ONTRACK ACCOUNT</span></div>
            <h2>{heading}</h2>
            <p className="auth-subtitle">{subtitle}</p>

            {!isSignup && (
              <div className="portal-selector" aria-label="Choose login portal">
                {portalOptions.map(({ id, title, detail, icon: Icon }) => (
                  <button key={id} type="button" className={`portal-option ${view === id ? "is-selected" : ""}`} onClick={() => chooseView(id)}>
                    <span className="portal-icon"><Icon size={18} /></span>
                    <span className="portal-text"><strong>{title}</strong><small>{detail}</small></span>
                    <span className="portal-radio">{view === id && <span />}</span>
                  </button>
                ))}
              </div>
            )}

            {error && <div className="auth-alert error-alert" role="alert">{error}</div>}
            {successMsg && <div className="auth-alert success-alert" role="status">{successMsg}</div>}

            <form className="auth-form" onSubmit={isSignup ? handleSignup : handleLogin}>
              {isSignup && <>
                <div className="form-field"><label htmlFor="full-name">Full name</label><input id="full-name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" autoComplete="name" required /></div>
                <div className="form-field"><label htmlFor="college">College / university <span className="optional-label">Optional</span></label><input id="college" value={college} onChange={e => setCollege(e.target.value)} placeholder="Your institution" autoComplete="organization" /></div>
                <div className="form-two-col">
                  <div className="form-field"><label htmlFor="degree">Degree <span className="optional-label">Optional</span></label><input id="degree" value={degree} onChange={e => setDegree(e.target.value)} placeholder="e.g. B.Tech" /></div>
                  <div className="form-field"><label htmlFor="branch">Branch</label><input id="branch" value={branch} onChange={e => setBranch(e.target.value)} placeholder="e.g. Computer" required /></div>
                </div>
                <div className="form-two-col">
                  <div className="form-field"><label htmlFor="academic-year">Academic year</label><select id="academic-year" value={academicYear} onChange={e => setAcademicYear(e.target.value)} required><option value="">Choose year</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>5th Year</option><option>Graduate</option></select></div>
                  <div className="form-field"><label htmlFor="passout-year">Graduation year</label><input id="passout-year" value={passoutYear} onChange={e => setPassoutYear(e.target.value)} placeholder="e.g. 2027" inputMode="numeric" required /></div>
                </div>
              </>}
              <div className="form-field"><label htmlFor="email">Email address</label><div className="input-with-icon"><Mail size={17} /><input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@college.edu" autoComplete="email" required /></div></div>
              <div className="form-field"><label htmlFor="password">Password</label><div className="input-with-icon"><LockKeyhole size={17} /><input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={isSignup ? "Create a password" : "Enter your password"} autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} required /><button type="button" className="show-password" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{isSignup && <small className="field-hint">Use at least 8 characters.</small>}</div>
              <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : isSignup ? "Create student account" : "Sign in"} <ArrowRight size={17} /></button>
            </form>

            <div className="auth-switch">{isSignup ? "Already have an account?" : "New to OnTrack?"} <button type="button" onClick={() => chooseView(isSignup ? "login" : "signup")}>{isSignup ? "Sign in" : "Create student account"}</button></div>
            <div className="auth-card-foot"><ShieldCheck size={15} /><span>Account access is protected by your sign-in credentials.</span></div>
          </div>
          <p className="auth-mobile-note">OnTrack · Smart Campus Analytics</p>
        </div>
      </section>
      <footer className="auth-footer"><span>© 2026 OnTrack</span><span>Made for better student outcomes <b>✦</b></span></footer>
    </main>
  );
}
