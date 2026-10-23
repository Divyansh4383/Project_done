import { useEffect, useState } from "react";
import { api, pageItems } from "../api/client";
import { ErrorMessage, Loading, PageTitle, StatusBadge } from "../components/Primitives";

const outboxStatuses = ["PENDING", "PROCESSING", "RETRY", "PROCESSED", "DEAD"];

export default function AdminPage() {
  const [events, setEvents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("USER");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadEvents() {
    setLoading(true);
    const query = new URLSearchParams({ page: "0", size: "50" });
    if (statusFilter) query.set("status", statusFilter);
    try {
      setEvents(pageItems(await api(`/admin/outbox?${query}`)));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadEvents(); }, [statusFilter]);

  async function replay(eventId) {
    try {
      await api(`/admin/outbox/${eventId}/replay`, { method: "POST" });
      setNotice("Dead-lettered event queued for replay.");
      await loadEvents();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function updateRole(event) {
    event.preventDefault();
    try {
      const result = await api(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: { role },
      });
      setNotice(`Updated ${result.email} to ${result.role}.`);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <>
      <PageTitle eyebrow="SYSTEM OPERATIONS" title="Admin console" description="Inspect notification delivery and manage global roles." />
      <ErrorMessage error={error} />
      {notice && <div className="alert alert-success">{notice}<button onClick={() => setNotice("")}>×</button></div>}
      <section className="panel role-panel">
        <div><div className="eyebrow">USER ACCESS</div><h2>Change a user role</h2><p className="muted">Use the account UUID to promote or change a user.</p></div>
        <form className="role-form" onSubmit={updateRole}>
          <label>User UUID<input required value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></label>
          <label>Role<select value={role} onChange={(event) => setRole(event.target.value)}><option>USER</option><option>MANAGER</option><option>ADMIN</option></select></label>
          <button className="button button-primary">Apply role</button>
        </form>
      </section>
      <section className="panel table-panel admin-outbox">
        <div className="table-heading">
          <div><div className="eyebrow">TRANSACTIONAL EMAIL</div><h2>Outbox events</h2></div>
          <select aria-label="Filter outbox status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {outboxStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>
        {loading ? <Loading label="Loading notification events…" /> : (
          <table>
            <thead><tr><th>Event</th><th>Recipient</th><th>Status</th><th>Attempts</th><th>Last error</th><th /></tr></thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td><strong>{event.eventType}</strong><small className="mono table-sub">{event.id}</small></td>
                  <td>{event.recipient}</td>
                  <td><StatusBadge value={event.status} /></td>
                  <td>{event.attempts} / {event.maxAttempts}</td>
                  <td className="error-cell">{event.lastError || "—"}</td>
                  <td>{event.status === "DEAD" && <button className="button button-small button-subtle" onClick={() => replay(event.id)}>Replay</button>}</td>
                </tr>
              ))}
              {events.length === 0 && <tr><td colSpan="6" className="muted empty-cell">No matching outbox events.</td></tr>}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
