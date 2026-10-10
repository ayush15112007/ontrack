import React, { useState, useEffect } from 'react';
import { api } from './api';
import './App.css';
import { LayoutDashboard, User, TrendingUp, Award, Target, Settings, LogOut, CheckCircle, Clock, Plus, Trash2, Save } from 'lucide-react';

export default function App({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboard, setDashboard] = useState(null);
  const [profile, setProfile] = useState({ phone: "", city: "", bio: "", college: "", degree: "", branch: "", academic_year: "", graduation_year: "", career_goal: "", preferred_role: "", courses: [], projects: [] });
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [newSession, setNewSession] = useState({ session_date: "", topic: "", duration_minutes: 60, notes: "" });
  const [newSkill, setNewSkill] = useState({ skill_name: "", proficiency: "Beginner" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, [activeTab]);

  async function loadData() {
    try {
      if (user.role === "student") {
        setDashboard(await api.getDashboard());
        if (activeTab === "update_profile" || activeTab === "profile") {
          const p = await api.getProfile();
          if (p) setProfile(p);
        } else if (activeTab === "progress") {
          setTasks(await api.getTasks());
          setSessions(await api.getSessions());
        } else if (activeTab === "skills") {
          setSkills(await api.getSkills());
        }
      }
    } catch (e) { console.error(e); }
  }

  async function saveProfile(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await api.saveProfile(profile);
      setMessage("Profile saved successfully!");
      loadData();
    } catch (err) { setMessage("Error: " + err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand"><h2>OnTrack</h2><span>{user.role.replace("_", " ").toUpperCase()}</span></div>
        <nav className="sidebar-nav">
          {user.role === "student" && (
            <>
              <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}><LayoutDashboard size={18} /> Overview</button>
              <button className={activeTab === "update_profile" ? "active" : ""} onClick={() => setActiveTab("update_profile")}><User size={18} /> Profile Update</button>
              <button className={activeTab === "progress" ? "active" : ""} onClick={() => setActiveTab("progress")}><TrendingUp size={18} /> My Progress</button>
              <button className={activeTab === "skills" ? "active" : ""} onClick={() => setActiveTab("skills")}><Award size={18} /> Skills & Certifications</button>
              <button className={activeTab === "goals" ? "active" : ""} onClick={() => setActiveTab("goals")}><Target size={18} /> Career Goals & Jobs</button>
            </>
          )}
          <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}><Settings size={18} /> Settings</button>
          <button className="logout-btn" onClick={async () => { try { await api.logout(); } catch(e){} onLogout(); }}><LogOut size={18} /> Logout</button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <h1>Welcome, {user.full_name}</h1>
          <p className="role-badge">{user.email}</p>
        </header>

        <div className="content-body">
          {user.role !== "student" ? (
            <div className="card">
              <h3>{user.role === "company_hr" ? "Company HR Portal" : "Class Coordinator Portal"}</h3>
              <p>Portal access verified. Student tracking and internship management modules active.</p>
            </div>
          ) : (
            <>
              {activeTab === "overview" && dashboard && (
                <div className="overview-grid">
                  <div className="metric-card"><Clock className="metric-icon" /><div><h3>{dashboard.total_learning_hours} hrs</h3><p>Learning Hours</p></div></div>
                  <div className="metric-card"><CheckCircle className="metric-icon" /><div><h3>{dashboard.tasks_completed} / {dashboard.total_tasks}</h3><p>Tasks Completed</p></div></div>
                  <div className="metric-card"><TrendingUp className="metric-icon" /><div><h3>{dashboard.progress_percentage}%</h3><p>Progress Rate</p></div></div>
                  <div className="metric-card"><Award className="metric-icon" /><div><h3>{dashboard.skills_recorded}</h3><p>Skills Registered</p></div></div>
                </div>
              )}

              {activeTab === "update_profile" && (
                <div className="card">
                  <h2>Student Profile Update</h2>
                  {message && <div className="success-banner">{message}</div>}
                  <form onSubmit={saveProfile} className="profile-form">
                    <div className="form-grid">
                      <div><label>Phone Number</label><input type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="+91 9876543210" /></div>
                      <div><label>City / Location</label><input type="text" value={profile.city} onChange={e => setProfile({...profile, city: e.target.value})} placeholder="Mumbai" /></div>
                      <div><label>College</label><input type="text" value={profile.college} onChange={e => setProfile({...profile, college: e.target.value})} placeholder="Universal SkillTech University" /></div>
                      <div><label>Branch</label><input type="text" value={profile.branch} onChange={e => setProfile({...profile, branch: e.target.value})} placeholder="Computer Engineering" /></div>
                      <div><label>Academic Year</label><input type="text" value={profile.academic_year} onChange={e => setProfile({...profile, academic_year: e.target.value})} placeholder="3rd Year" /></div>
                      <div><label>Passout Year</label><input type="text" value={profile.graduation_year} onChange={e => setProfile({...profile, graduation_year: e.target.value})} placeholder="2027" /></div>
                    </div>
                    <div className="input-group"><label>Bio / Introduction</label><textarea rows="3" value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} placeholder="Passionate engineering student..."></textarea></div>
                    <button type="submit" className="primary-btn" disabled={loading}><Save size={16} /> {loading ? "Saving..." : "Save Profile"}</button>
                  </form>
                </div>
              )}

              {activeTab === "progress" && (
                <div className="card">
                  <h3>Record Learning Session</h3>
                  <form onSubmit={async e => { e.preventDefault(); await api.createSession(newSession); setNewSession({ session_date: "", topic: "", duration_minutes: 60, notes: "" }); loadData(); }} className="inline-form">
                    <input type="date" value={newSession.session_date} onChange={e => setNewSession({...newSession, session_date: e.target.value})} required />
                    <input type="text" placeholder="Topic (e.g. FastAPI)" value={newSession.topic} onChange={e => setNewSession({...newSession, topic: e.target.value})} required />
                    <input type="number" placeholder="Minutes" value={newSession.duration_minutes} onChange={e => setNewSession({...newSession, duration_minutes: parseInt(e.target.value)})} min="10" required />
                    <button type="submit" className="primary-btn"><Plus size={16} /> Add Session</button>
                  </form>
                  <div className="list-items">
                    {sessions.map(s => (
                      <div key={s.id} className="list-item">
                        <div><strong>{s.topic}</strong> ({s.duration_minutes} mins)</div>
                        <button onClick={async () => { await api.deleteSession(s.id); loadData(); }} className="icon-btn"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "skills" && (
                <div className="card">
                  <h2>Skills & Certifications</h2>
                  <form onSubmit={async e => { e.preventDefault(); await api.createSkill(newSkill); setNewSkill({ skill_name: "", proficiency: "Beginner" }); loadData(); }} className="inline-form">
                    <input type="text" placeholder="Skill Name (e.g. React, Python)" value={newSkill.skill_name} onChange={e => setNewSkill({...newSkill, skill_name: e.target.value})} required />
                    <select value={newSkill.proficiency} onChange={e => setNewSkill({...newSkill, proficiency: e.target.value})}>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                    <button type="submit" className="primary-btn"><Plus size={16} /> Add Skill</button>
                  </form>
                  <div className="skills-grid">
                    {skills.map(sk => (
                      <div key={sk.id} className="skill-chip">
                        <span><strong>{sk.skill_name}</strong> ({sk.proficiency})</span>
                        <button onClick={async () => { await api.deleteSkill(sk.id); loadData(); }} className="icon-btn"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "goals" && (
                <div className="card">
                  <h2>Career Goals & Target Jobs</h2>
                  <p>Define what you want to become and the job or internship you are searching for.</p>
                  <form onSubmit={saveProfile} className="profile-form">
                    <div className="input-group"><label>What do you want to become? (Career Goal)</label><input type="text" value={profile.career_goal} onChange={e => setProfile({...profile, career_goal: e.target.value})} placeholder="Full Stack Software Engineer" /></div>
                    <div className="input-group"><label>Preferred Job / Internship Role</label><input type="text" value={profile.preferred_role} onChange={e => setProfile({...profile, preferred_role: e.target.value})} placeholder="Software Engineering Intern" /></div>
                    <button type="submit" className="primary-btn"><Save size={16} /> Save Career Goals</button>
                  </form>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="card"><h2>Account Settings</h2><p>Email: <strong>{user.email}</strong></p><p>Role: <strong>{user.role}</strong></p></div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
