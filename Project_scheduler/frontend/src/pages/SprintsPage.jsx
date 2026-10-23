import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { EmptyState, ErrorMessage, Loading, PageTitle, StatusBadge } from "../components/Primitives";

const transitions = {
  PLANNED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export default function SprintsPage() {
  const { projectId } = useParams();
  const [sprints, setSprints] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", goal: "", startDate: "", endDate: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setSprints(await api(`/projects/${projectId}/sprints`));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [projectId]);

  async function createSprint(event) {
    event.preventDefault();
    try {
      await api(`/projects/${projectId}/sprints`, { method: "POST", body: form });
      setForm({ name: "", goal: "", startDate: "", endDate: "" });
      setFormOpen(false);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function changeStatus(sprint, status) {
    try {
      await api(`/projects/${projectId}/sprints/${sprint.id}/status`, {
        method: "PATCH",
        body: { status },
      });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="ITERATION PLANNING"
        title="Sprints"
        description="Set a goal, choose a delivery window, and keep progress visible."
        actions={<button className="button button-primary" onClick={() => setFormOpen(!formOpen)}>＋ Plan sprint</button>}
      />
      <ErrorMessage error={error} />
      {formOpen && (
        <form className="panel form-grid create-project" onSubmit={createSprint}>
          <label>Sprint name<input required maxLength="120" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Goal<input maxLength="1000" value={form.goal} onChange={(event) => setForm({ ...form, goal: event.target.value })} /></label>
          <label>Start date<input type="date" required value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label>
          <label>End date<input type="date" required value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></label>
          <div className="form-actions span-two">
            <button type="button" className="button button-subtle" onClick={() => setFormOpen(false)}>Cancel</button>
            <button className="button button-primary">Create sprint</button>
          </div>
        </form>
      )}
      {loading ? <Loading label="Loading sprints…" /> : sprints.length === 0 ? (
        <EmptyState title="No sprints planned"><p>Create a sprint to give the next delivery window a goal.</p></EmptyState>
      ) : (
        <div className="sprint-list">
          {sprints.map((sprint) => (
            <article className="panel sprint-card" key={sprint.id}>
              <div className="sprint-icon">◷</div>
              <div className="sprint-main">
                <div className="sprint-title-line"><h2>{sprint.name}</h2><StatusBadge value={sprint.status} /></div>
                <p className="muted">{sprint.goal || "No sprint goal added."}</p>
                <div className="sprint-dates">{sprint.startDate} <span>→</span> {sprint.endDate}</div>
              </div>
              {transitions[sprint.status].length > 0 && (
                <select aria-label={`Change ${sprint.name} status`} value="" onChange={(event) => changeStatus(sprint, event.target.value)}>
                  <option value="" disabled>Update status</option>
                  {transitions[sprint.status].map((status) => <option value={status} key={status}>{status.replaceAll("_", " ")}</option>)}
                </select>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
