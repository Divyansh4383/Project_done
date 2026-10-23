import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { EmptyState, ErrorMessage, Loading, PageTitle, StatusBadge } from "../components/Primitives";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", key: "", description: "" });

  async function load() {
    setLoading(true);
    try {
      setProjects(await api("/projects"));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createProject(event) {
    event.preventDefault();
    setError("");
    try {
      await api("/projects", { method: "POST", body: form });
      setCreating(false);
      setForm({ name: "", key: "", description: "" });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="YOUR WORKSPACE"
        title="Projects"
        description="Bring plans, people, and delivery progress together."
        actions={<button className="button button-primary" onClick={() => setCreating(!creating)}>＋ New project</button>}
      />
      <ErrorMessage error={error} />
      {creating && (
        <form className="panel create-project form-grid" onSubmit={createProject}>
          <label>Project name<input required maxLength="160" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Project key<input required maxLength="12" value={form.key} onChange={(event) => setForm({ ...form, key: event.target.value.toUpperCase() })} placeholder="e.g. MOBILE" /></label>
          <label className="span-two">Description<input maxLength="2000" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <div className="form-actions span-two">
            <button type="button" className="button button-subtle" onClick={() => setCreating(false)}>Cancel</button>
            <button className="button button-primary">Create project</button>
          </div>
        </form>
      )}
      {loading ? <Loading label="Loading projects…" /> : projects.length === 0 ? (
        <EmptyState title="No projects yet"><p>Create a project to start planning and tracking work.</p></EmptyState>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <Link className="project-card panel" to={`/projects/${project.id}`} key={project.id}>
              <div className="project-card-top">
                <span className="project-symbol">{project.key.slice(0, 1)}</span>
                <StatusBadge value={project.status} />
              </div>
              <div className="eyebrow">{project.key}</div>
              <h2>{project.name}</h2>
              <p className="muted clamp">{project.description || "No description added."}</p>
              <div className="project-card-footer">
                <span>{project.memberCount} {project.memberCount === 1 ? "member" : "members"}</span>
                <span>Open project <b>→</b></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
