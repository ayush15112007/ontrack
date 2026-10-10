import { useCallback, useEffect, useState } from "react";
import { BriefcaseBusiness, MapPin, Clock3, Plus, Send, RefreshCw, ExternalLink, Users } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
async function request(path, options = {}) {
  const response = await fetch(`${API}/api/student${path}`, {
    credentials: "include", headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || data.message || "Request failed. Check that the backend is running.");
  return data;
}
const emptyJob = { title: "", company: "", opportunity_type: "Internship", location: "Remote", description: "", apply_url: "" };
export default function CareersPanel({ user, role }) {
  const [jobs, setJobs] = useState([]); const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(emptyJob); const [coverNote, setCoverNote] = useState({});
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try { setJobs(await request("/careers/jobs")); if (role === "hr") setApplications(await request("/careers/applications")); }
    catch (e) { setError(e.message); }
  }, [role]);
  useEffect(() => { load(); }, [load]);
  async function publish(e) { e.preventDefault(); setBusy(true); setError(""); setMessage(""); try { await request("/careers/jobs", { method: "POST", body: JSON.stringify(form) }); setForm(emptyJob); setMessage("Opportunity published."); await load(); } catch(e) { setError(e.message); } finally { setBusy(false); } }
  async function apply(job) { setBusy(true); setError(""); setMessage(""); try { await request(`/careers/jobs/${job.id}/apply`, { method: "POST", body: JSON.stringify({ cover_note: coverNote[job.id] || "" }) }); setMessage(`Application submitted for ${job.title}.`); } catch(e) { setError(e.message); } finally { setBusy(false); } }
  return <div className="career-page">
    <div className="career-hero"><div><span className="section-eyebrow">CAREER STUDIO</span><h2>{role === "hr" ? "Find your next great candidate" : "Your next opportunity starts here"}</h2><p>{role === "hr" ? "Publish roles and review student applications in one calm workspace." : "Explore jobs and internships shared by verified OnTrack hiring accounts."}</p></div><div className="career-hero-mark"><BriefcaseBusiness size={30}/></div></div>
    {error && <div className="error-banner" role="alert">{error}</div>}{message && <div className="success-banner" role="status">{message}</div>}
    {role === "hr" && <section className="card career-publish"><div className="card-heading-row"><div><h2>Post an opportunity</h2><p>Use real details and a working application link where available.</p></div></div><form className="career-form" onSubmit={publish}>
      <label>Role title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Frontend Developer Intern" required maxLength={180}/></label>
      <div className="career-form-grid"><label>Company<input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="Company name" required maxLength={180}/></label><label>Type<select value={form.opportunity_type} onChange={e=>setForm({...form,opportunity_type:e.target.value})}><option>Internship</option><option>Full-time job</option><option>Part-time job</option><option>Apprenticeship</option></select></label><label>Location<input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Remote / city" required maxLength={180}/></label><label>Application link (optional)<input type="url" value={form.apply_url} onChange={e=>setForm({...form,apply_url:e.target.value})} placeholder="https://..."/></label></div>
      <label>Description<textarea rows="4" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Responsibilities, skills, eligibility, deadline…" required maxLength={6000}/></label><button className="primary-btn" disabled={busy}><Plus size={16}/> {busy ? "Publishing…" : "Publish opportunity"}</button>
    </form></section>}
    <section className="card"><div className="card-heading-row"><div><h2>{role === "hr" ? "Your published opportunities" : "Jobs & internships"}</h2><p>{role === "hr" ? "Applications appear below when students apply." : "Listings are provided by OnTrack hiring accounts; check each description before applying."}</p></div><button className="text-action" onClick={load}><RefreshCw size={14} inline/> Refresh</button></div>
      {jobs.length ? <div className="career-list">{jobs.map(job=><article className="career-card" key={job.id}><div className="career-card-top"><span className="career-type">{job.opportunity_type}</span>{job.apply_url && <a href={job.apply_url} target="_blank" rel="noreferrer" className="career-external">External link <ExternalLink size={13}/></a>}</div><h3>{job.title}</h3><strong className="career-company">{job.company}</strong><p className="career-meta"><span><MapPin size={14}/>{job.location || "Location not specified"}</span><span><Clock3 size={14}/>{job.created_at ? new Date(job.created_at).toLocaleDateString() : "Recently posted"}</span></p><p className="career-description">{job.description}</p>{role === "student" && <div className="career-apply"><textarea rows="2" value={coverNote[job.id] || ""} onChange={e=>setCoverNote({...coverNote,[job.id]:e.target.value})} placeholder="Optional short note to the hiring team"/><button className="primary-btn" onClick={()=>apply(job)} disabled={busy}><Send size={15}/> Apply on OnTrack</button>{job.apply_url && <span className="career-hint">You may also use the external application link above.</span>}</div>}</article>)}</div> : <div className="empty-state"><span><BriefcaseBusiness size={22}/></span><strong>No opportunities published yet</strong><p>{role === "hr" ? "Publish your first job or internship using the form above." : "New opportunities will appear here after a hiring team publishes them."}</p></div>}
    </section>
    {role === "hr" && <section className="card"><div className="card-heading-row"><div><h2>Student applications</h2><p>Applications submitted through OnTrack.</p></div><Users size={19}/></div>{applications.length ? <div className="list-items">{applications.map(a=><div className="list-item" key={a.id}><div><strong>{a.full_name} · {a.job_title}</strong><small>{a.email} · {a.company} · {a.status}</small>{a.cover_note && <p>{a.cover_note}</p>}</div></div>)}</div> : <div className="empty-state"><span><Users size={22}/></span><strong>No applications yet</strong><p>Student applications will be listed here.</p></div>}</section>}
  </div>;
}
