import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, pageItems } from "../api/client";
import WorkItemDrawer from "../components/WorkItemDrawer";
import { EmptyState, ErrorMessage, Loading, PageTitle, StatusBadge } from "../components/Primitives";

const columns = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export default function BoardPage() {
  const { projectId } = useParams();
  const [items, setItems] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [selected, setSelected] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [workPage, sprintList] = await Promise.all([
        api(`/projects/${projectId}/work-items?page=0&size=100&sort=updatedAt,desc`),
        api(`/projects/${projectId}/sprints`),
      ]);
      setItems(pageItems(workPage));
      setSprints(sprintList);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [projectId]);

  return (
    <>
      <PageTitle
        eyebrow="DELIVERY BOARD"
        title="Kanban"
        description="Move work through a clear, shared delivery flow."
        actions={<button className="button button-primary" onClick={() => setSelected(null)}>＋ Add work item</button>}
      />
      <ErrorMessage error={error} />
      {loading ? <Loading label="Loading board…" /> : items.length === 0 ? (
        <EmptyState title="Your board is ready"><p>Create the first work item to get delivery moving.</p></EmptyState>
      ) : null}
      {!loading && (
        <div className="board-grid">
          {columns.map((status) => {
            const lane = items.filter((item) => item.status === status);
            return (
              <section className="board-column" key={status}>
                <header className="column-heading">
                  <span>{status.replaceAll("_", " ")}</span>
                  <span className="column-count">{lane.length}</span>
                </header>
                <div className="column-cards">
                  {lane.map((item) => (
                    <button className="work-card panel" key={item.id} onClick={() => setSelected(item)}>
                      <div className="work-card-top"><span className="eyebrow">{item.priority}</span><span className={`priority-dot priority-${item.priority.toLowerCase()}`} /></div>
                      <h3>{item.title}</h3>
                      {item.description && <p>{item.description}</p>}
                      <div className="work-card-footer">
                        <StatusBadge value={item.dueDate ? `DUE ${item.dueDate}` : "WORK ITEM"} />
                        <span className="work-arrow">↗</span>
                      </div>
                    </button>
                  ))}
                  {lane.length === 0 && <div className="column-empty">Drop into this stage</div>}
                </div>
              </section>
            );
          })}
        </div>
      )}
      {selected !== undefined && (
        <WorkItemDrawer
          projectId={projectId}
          item={selected}
          sprints={sprints}
          onClose={() => setSelected(undefined)}
          onSaved={() => { setSelected(undefined); load(); }}
        />
      )}
    </>
  );
}
