import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard, UserRound, TrendingUp, Award, Target, Settings,
  LogOut, CheckCircle2, Clock3, Plus, Trash2, Save, ListTodo,
  BookOpen, BriefcaseBusiness, Users, RefreshCw, Circle, GraduationCap
} from "lucide-react";
import { api } from "./api";
import "./App.css";

const emptyProfile = {
  phone: "", city: "", bio: "", college: "", degree: "", branch: "",
  academic_year: "", graduation_year: "", career_goal: "", preferred_role: "",
  courses: [], projects: []
};
const emptySession = { session_date: new Date().toISOString().slice(0, 10), topic: "", duration_minutes: 60, notes: "" };
const emptyTask = { title: "", description: "", due_date: "", status: "pending" };
const emptySkill = { skill_name: "", proficiency: "Beginner" };

export default function App({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboard, setDashboard] = useState(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [newSession, setNewSession] = useState(emptySession);
  const [newTask, setNewTask] = useState(emptyTask);
  const [newSkill, setNewSkill] = useState(emptySkill);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (user.role !== "student") return;
    setLoading(true);
    setError("");
    try {
      const results = await Promise.all([
        api.getDashboard(),
        api.getTasks(),
        api.getSessions(),
        api.getSkills()
      ]);
      setDashboard(results[0]);
      setTasks(Array.isArray(results[1]) ? results[1] : []);
      setSessions(Array.isArray(results[2]) ? results[2] : []);
      setSkills(Array.isArray(results[3]) ? results[3] : []);
      if (["profile", "goals"].includes(activeTab)) {
        const p = await api.getProfile();
        setProfile({ ...emptyProfile, ...(p || {}) });
      }
    } catch (e) {
      setError(e.message || "Could not load your data. Check that the backend and database are running.");
    } finally {
      setLoading(false);
    }
  }, [user.role, activeTab]);

  useEffect(() => { loadData(); }, [loadData]);

  async function runAction(action, successText) {
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(successText);
      await loadData();
    } catch (e) {
      setError(e.message || "That action could not be completed.");
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    await runAction(() => api.saveProfile(profile), "Your profile has been saved.");
  }

  async function createTask(e) {
    e.preventDefault();
    await runAction(async () => {
      await api.createTask(newTask);
      setNewTask(emptyTask);
    }, "Task added.");
  }

  async function toggleTask(task) {
    await runAction(
      () => api.updateTask(task.id, { ...task, status: task.status === "completed" ? "pending" : "completed" }),
      task.status === "completed" ? "Task marked as pending." : "Task completed."
    );
  }

  async function createSession(e) {
    e.preventDefault();
    await runAction(async () => {
      await api.createSession(newSession);
      setNewSession({ ...emptySession, session_date: new Date().toISOString().slice(0, 10) });
    }, "Learning session recorded.");
  }

  async function createSkill(e) {
    e.preventDefault();
    await runAction(async () => {
      await api.createSkill(newSkill);
      setNewSkill(emptySkill);
    }, "Skill added to your profile.");
  }

  async function logout() {
    try { await api.logout(); } catch {}
    onLogout();
  }

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "profile", label: "My profile", icon: UserRound },
    { id: "tasks", label: "Tasks", icon: ListTodo },
    { id: "progress", label: "Learning log", icon: TrendingUp },
    { id: "skills", label: "Skills", icon: Award },
    { id: "goals", label: "Career goals", icon: Target },
    { id: "settings", label: "Account settings", icon: Settings }
  ];

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand"><h2>OnTrack</h2><span>{user.role.replaceAll("_", " ")}</span></div>
        {user.role === "student" ? (
          <nav className="sidebar-nav" aria-label="Main navigation">
            {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={activeTab === id ? "active" : ""} onClick={() => { setActiveTab(id); setMessage(""); setError(""); }}><Icon size={17} />{label}</button>)}
            <button className="logout-btn" onClick={logout}><LogOut size={17} /> Sign out</button>
          </nav>
        ) : (
          <nav className="sidebar-nav">
            <button className="active"><LayoutDashboard size={17} /> Overview</button>
            <button className="logout-btn" onClick={logout}><LogOut size={17} /> Sign out</button>
          </nav>
        )}
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div><h1>{user.role === "student" ? `Welcome, ${user.full_name}` : user.role === "company_hr" ? "Company HR workspace" : "Class coordinator workspace"}</h1><p className="header-subtitle">{user.role === "student" ? "Your learning journey, organized in one place." : "Signed in with a verified OnTrack account."}</p></div>
          <div className="role-badge">{user.email}</div>
        </header>

        <div className="content-body">
          {error && <div className="error-banner" role="alert">{error}</div>}
          {message && <div className="success-banner" role="status">{message}</div>}

          {user.role !== "student" ? (
            <section className="card portal-placeholder">
              <div className="portal-placeholder-icon">{user.role === "company_hr" ? <BriefcaseBusiness size={24} /> : <Users size={24} />}</div>
              <p className="section-eyebrow">ROLE-BASED PORTAL</p>
              <h2>{user.role === "company_hr" ? "Welcome to the HR portal" : "Welcome to the coordinator portal"}</h2>
              <p>{user.role === "company_hr"
                ? "Your account is recognized as Company HR. Candidate discovery, recruitment workflows, and student portfolio access need dedicated HR data and permissions before they can be enabled."
                : "Your account is recognized as Class Coordinator. Class rosters, attendance, grades, and cohort analytics need coordinator-specific data and permissions before they can be enabled."}</p>
              <div className="portal-status"><CheckCircle2 size={17} /> Role check passed <span>·</span> <span>Feature setup pending</span></div>
              <button className="primary-btn" onClick={logout}><LogOut size={16} /> Sign out</button>
            </section>
          ) : (
            <>
              {activeTab === "overview" && <>
                <div className="welcome-strip"><div><span className="section-eyebrow">YOUR STUDENT SPACE</span><h2>Small steps add up.</h2><p>Record what you learn, track your tasks, and keep your goals visible.</p></div><div className="welcome-art"><GraduationCap size={44} /></div></div>
                <div className="overview-grid">
                  <Metric icon={Clock3} value={`${dashboard?.total_learning_hours ?? "—"}`} suffix=" hrs" label="Learning hours" />
                  <Metric icon={CheckCircle2} value={`${dashboard?.tasks_completed ?? "—"} / ${dashboard?.total_tasks ?? "—"}`} label="Tasks completed" />
                  <Metric icon={TrendingUp} value={`${dashboard?.progress_percentage ?? "—"}%`} label="Task completion" />
                  <Metric icon={Award} value={dashboard?.skills_recorded ?? "—"} label="Skills recorded" />
                </div>
                <div className="overview-lower">
                  <section className="card">
                    <div className="card-heading-row"><div><h2>Task list</h2><p>Your next steps, all in one place.</p></div><button className="text-action" onClick={() => setActiveTab("tasks")}>View all</button></div>
                    {tasks.length ? <div className="list-items">{tasks.slice(0, 4).map(task => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task)} onDelete={() => runAction(() => api.deleteTask(task.id), "Task deleted.")} />)}</div> : <EmptyState icon={ListTodo} title="No tasks yet" detail="Add a task to start tracking your next step." action="Add a task" onClick={() => setActiveTab("tasks")} />}
                  </section>
                  <section className="card">
                    <div className="card-heading-row"><div><h2>Skills snapshot</h2><p>Skills you choose to record.</p></div><button className="text-action" onClick={() => setActiveTab("skills")}>Manage skills</button></div>
                    {skills.length ? <div className="skills-grid">{skills.slice(0, 8).map(skill => <div key={skill.id} className="skill-chip"><span><strong>{skill.skill_name}</strong><small>{skill.proficiency}</small></span><button className="icon-btn" aria-label={`Delete ${skill.skill_name}`} onClick={() => runAction(() => api.deleteSkill(skill.id), "Skill removed.")}><Trash2 size={14} /></button></div>)}</div> : <EmptyState icon={Award} title="Your skills will appear here" detail="Add skills and proficiency levels you want to track." action="Add a skill" onClick={() => setActiveTab("skills")} />}
                  </section>
                </div>
                {loading && <p className="loading-note"><RefreshCw size={14} /> Refreshing your data…</p>}
              </>}

              {activeTab === "profile" && <section className="card"><p className="section-eyebrow">YOUR DETAILS</p><h2>Student profile</h2><p>Keep your academic background and introduction up to date.</p><form onSubmit={saveProfile} className="profile-form"><div className="form-grid">
                <Field label="Phone number" value={profile.phone} onChange={v => setProfile({ ...profile, phone: v })} placeholder="Phone (optional)" />
                <Field label="City" value={profile.city} onChange={v => setProfile({ ...profile, city: v })} placeholder="Your city" />
                <Field label="College / university" value={profile.college} onChange={v => setProfile({ ...profile, college: v })} placeholder="Institution name" />
                <Field label="Degree" value={profile.degree} onChange={v => setProfile({ ...profile, degree: v })} placeholder="e.g. B.Tech" />
                <Field label="Branch" value={profile.branch} onChange={v => setProfile({ ...profile, branch: v })} placeholder="e.g. Computer Engineering" />
                <Field label="Academic year" value={profile.academic_year} onChange={v => setProfile({ ...profile, academic_year: v })} placeholder="e.g. 3rd Year" />
                <Field label="Graduation year" value={profile.graduation_year} onChange={v => setProfile({ ...profile, graduation_year: v })} placeholder="e.g. 2027" />
              </div><div className="input-group"><label htmlFor="profile-bio">About you</label><textarea id="profile-bio" rows="4" value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="Introduce yourself, your interests, and what you are learning." /></div><button className="primary-btn" disabled={loading}><Save size={16} /> Save profile</button></form></section>}

              {activeTab === "tasks" && <section className="card"><p className="section-eyebrow">STAY ORGANIZED</p><h2>My tasks</h2><p>Create personal tasks and mark them complete as you make progress.</p><form onSubmit={createTask} className="task-create-form"><div className="form-field"><label htmlFor="task-title">Task title</label><input id="task-title" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="e.g. Finish Python course module" required /></div><div className="form-grid"><div className="form-field"><label htmlFor="task-due">Due date (optional)</label><input id="task-due" type="date" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} /></div><div className="form-field"><label htmlFor="task-description">Notes (optional)</label><input id="task-description" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="A short description" /></div></div><button className="primary-btn" disabled={loading}><Plus size={16} /> Add task</button></form><div className="list-items task-list">{tasks.map(task => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task)} onDelete={() => runAction(() => api.deleteTask(task.id), "Task deleted.")} />)}</div>{!tasks.length && <EmptyState icon={ListTodo} title="Nothing on your list yet" detail="Add your first task using the form above." />}</section>}

              {activeTab === "progress" && <section className="card"><p className="section-eyebrow">BUILD CONSISTENCY</p><h2>Learning log</h2><p>Record the time you spend learning. Your dashboard totals are calculated from these saved sessions.</p><form onSubmit={createSession} className="inline-form"><input aria-label="Session date" type="date" value={newSession.session_date} onChange={e => setNewSession({ ...newSession, session_date: e.target.value })} required /><input aria-label="Topic" type="text" placeholder="What did you learn?" value={newSession.topic} onChange={e => setNewSession({ ...newSession, topic: e.target.value })} required /><input aria-label="Duration in minutes" type="number" placeholder="Minutes" value={newSession.duration_minutes} onChange={e => setNewSession({ ...newSession, duration_minutes: Number(e.target.value) })} min="1" max="1440" required /><button className="primary-btn" disabled={loading}><Plus size={16} /> Record session</button></form><div className="list-items">{sessions.map(s => <div className="list-item" key={s.id}><div><strong>{s.topic}</strong><small>{s.session_date} · {s.duration_minutes} minutes</small></div><button className="icon-btn" aria-label={`Delete ${s.topic}`} onClick={() => runAction(() => api.deleteSession(s.id), "Session deleted.")}><Trash2 size={15} /></button></div>)}</div>{!sessions.length && <EmptyState icon={BookOpen} title="No learning sessions recorded" detail="Record your first session above. Nothing is pre-filled or fabricated." />}</section>}

              {activeTab === "skills" && <section className="card"><p className="section-eyebrow">GROW YOUR TOOLKIT</p><h2>Skills</h2><p>Add the skills you are learning and choose a proficiency level.</p><form onSubmit={createSkill} className="inline-form"><input aria-label="Skill name" placeholder="Skill name (e.g. Python)" value={newSkill.skill_name} onChange={e => setNewSkill({ ...newSkill, skill_name: e.target.value })} required /><select aria-label="Proficiency" value={newSkill.proficiency} onChange={e => setNewSkill({ ...newSkill, proficiency: e.target.value })}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select><button className="primary-btn" disabled={loading}><Plus size={16} /> Add skill</button></form><div className="skills-grid">{skills.map(skill => <div key={skill.id} className="skill-chip"><span><strong>{skill.skill_name}</strong><small>{skill.proficiency}</small></span><button className="icon-btn" aria-label={`Delete ${skill.skill_name}`} onClick={() => runAction(() => api.deleteSkill(skill.id), "Skill removed.")}><Trash2 size={14} /></button></div>)}</div>{!skills.length && <EmptyState icon={Award} title="No skills added yet" detail="Add skills you want to develop or showcase." />}</section>}

              {activeTab === "goals" && <section className="card"><p className="section-eyebrow">LOOK AHEAD</p><h2>Career goals</h2><p>Set a goal to keep your next steps connected to your interests.</p><form onSubmit={saveProfile} className="profile-form"><div className="input-group"><label htmlFor="career-goal">Career goal</label><input id="career-goal" value={profile.career_goal} onChange={e => setProfile({ ...profile, career_goal: e.target.value })} placeholder="e.g. Become a software engineer" /></div><div className="input-group"><label htmlFor="preferred-role">Preferred role</label><input id="preferred-role" value={profile.preferred_role} onChange={e => setProfile({ ...profile, preferred_role: e.target.value })} placeholder="e.g. Software engineering intern" /></div><button className="primary-btn" disabled={loading}><Save size={16} /> Save goals</button></form></section>}

              {activeTab === "settings" && <section className="card"><p className="section-eyebrow">ACCOUNT</p><h2>Account settings</h2><div className="settings-row"><span>Full name</span><strong>{user.full_name}</strong></div><div className="settings-row"><span>Email address</span><strong>{user.email}</strong></div><div className="settings-row"><span>Account role</span><strong>{user.role.replaceAll("_", " ")}</strong></div><p className="settings-note">To protect your account, your role is assigned by the system and cannot be changed from this page.</p><button className="primary-btn" onClick={logout}><LogOut size={16} /> Sign out</button></section>}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Metric({ icon: Icon, value, suffix = "", label }) {
  return <div className="metric-card"><Icon className="metric-icon" /><div><h3>{value}{suffix}</h3><p>{label}</p></div></div>;
}
function Field({ label, value, onChange, placeholder }) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return <div className="form-field"><label htmlFor={id}>{label}</label><input id={id} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} /></div>;
}
function TaskRow({ task, onToggle, onDelete }) {
  const done = task.status === "completed";
  return <div className={`list-item task-row ${done ? "task-done" : ""}`}><button type="button" className="task-toggle" onClick={onToggle} aria-label={done ? "Mark task pending" : "Mark task complete"}>{done ? <CheckCircle2 size={19} /> : <Circle size={19} />}</button><div className="task-copy"><strong>{task.title}</strong>{task.description && <small>{task.description}</small>}<small>{task.due_date ? `Due ${task.due_date} · ` : ""}{done ? "Completed" : "Pending"}</small></div><button className="icon-btn" aria-label={`Delete ${task.title}`} onClick={onDelete}><Trash2 size={15} /></button></div>;
}
function EmptyState({ icon: Icon, title, detail, action, onClick }) {
  return <div className="empty-state"><span><Icon size={22} /></span><strong>{title}</strong><p>{detail}</p>{action && <button className="text-action" onClick={onClick}>{action} →</button>}</div>;
}
