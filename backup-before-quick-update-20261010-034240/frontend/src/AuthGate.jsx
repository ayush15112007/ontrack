import React, { useState, useEffect } from 'react';
import { api } from './api';
import App from './App';
import './auth.css';
import { Shield, User } from 'lucide-react';

export default function AuthGate() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("login");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [branch, setBranch] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [passoutYear, setPassoutYear] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    try { setUser(await api.getMe()); } 
    catch (e) { setUser(null); } 
    finally { setLoading(false); }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    try {
      await api.login({ email, password });
      const me = await api.getMe();
      if (view === "hr_login" && me.role !== "company_hr") { setError("Not authorized for HR login."); await api.logout(); return; }
      if (view === "coordinator_login" && me.role !== "class_coordinator") { setError("Not authorized for Coordinator login."); await api.logout(); return; }
      setUser(me);
    } catch (err) { setError(err.message || "Invalid credentials"); }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    try {
      await api.register({ full_name: fullName, email, password, branch, academic_year: academicYear, graduation_year: passoutYear, role: "student" });
      setSuccessMsg("Account created! Please log in.");
      setView("login");
    } catch (err) { setError(err.message); }
  }

  if (loading) return <div className="auth-loading">Loading OnTrack...</div>;
  if (user) return <App user={user} onLogout={() => setUser(null)} />;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>OnTrack</h1>
          <p>AI-Powered Student Analytics and Success Platform</p>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {successMsg && <div className="success-banner">{successMsg}</div>}

        {view === "signup" ? (
          <form onSubmit={handleSignup} className="auth-form">
            <h3>Create Student Account</h3>
            <div className="input-group"><label>Full Name</label><input type="text" placeholder="Ayush Pandey" value={fullName} onChange={e => setFullName(e.target.value)} required /></div>
            <div className="input-group"><label>Branch</label><input type="text" placeholder="Computer Engineering" value={branch} onChange={e => setBranch(e.target.value)} required /></div>
            <div className="input-group"><label>Academic Year</label><input type="text" placeholder="3rd Year" value={academicYear} onChange={e => setAcademicYear(e.target.value)} required /></div>
            <div className="input-group"><label>Passout Year</label><input type="text" placeholder="2027" value={passoutYear} onChange={e => setPassoutYear(e.target.value)} required /></div>
            <div className="input-group"><label>Email Address</label><input type="email" placeholder="student@university.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div className="input-group"><label>Password</label><input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required /></div>
            <button type="submit" className="primary-btn">Register Account</button>
            <p className="switch-text">Already have an account? <span onClick={() => { setView("login"); setError(""); }}>Login here</span></p>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="auth-form">
            <h3>{view === "hr_login" ? "Company HR Login" : view === "coordinator_login" ? "Class Coordinator Login" : "Student Login"}</h3>
            <div className="input-group"><label>Email Address</label><input type="email" placeholder="email@domain.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div className="input-group"><label>Password</label><input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required /></div>
            <button type="submit" className="primary-btn">{view === "hr_login" ? "Login as HR" : view === "coordinator_login" ? "Login as Coordinator" : "Login"}</button>
            {view === "login" ? (
              <p className="switch-text">Don't have an account? <span onClick={() => { setView("signup"); setError(""); }}>Create New Account</span></p>
            ) : (
              <p className="switch-text"><span onClick={() => { setView("login"); setError(""); }}>← Back to Student Login</span></p>
            )}
          </form>
        )}

        {view === "login" && (
          <div className="role-logins">
            <p>Other Portals:</p>
            <div className="role-buttons">
              <button type="button" className="role-btn" onClick={() => { setView("hr_login"); setError(""); }}><Shield size={14} /> Company HR</button>
              <button type="button" className="role-btn" onClick={() => { setView("coordinator_login"); setError(""); }}><User size={14} /> Class Coordinator</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
