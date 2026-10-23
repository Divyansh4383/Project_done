import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, pageItems } from "../api/client";
import { EmptyState, ErrorMessage, Loading, PageTitle, StatusBadge } from "../components/Primitives";

export default function AuditPage() {
  const { projectId } = useParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/projects/${projectId}/audit-events?page=0&size=100`)
      .then((page) => setEvents(pageItems(page)))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <>
      <PageTitle eyebrow="PROJECT HISTORY" title="Audit log" description="A durable timeline of important project changes." />
      <ErrorMessage error={error} />
      {loading ? <Loading label="Loading audit history…" /> : events.length === 0 ? (
        <EmptyState title="Nothing to show yet"><p>Project activity will appear here as the team makes changes.</p></EmptyState>
      ) : (
        <div className="panel table-panel">
          <table>
            <thead><tr><th>Action</th><th>Entity</th><th>Entity ID</th><th>Actor</th><th>When</th></tr></thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td><StatusBadge value={event.action} /></td>
                  <td>{event.entityType}</td>
                  <td className="mono">{event.entityId}</td>
                  <td className="mono">{event.actorId}</td>
                  <td>{new Date(event.occurredAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
