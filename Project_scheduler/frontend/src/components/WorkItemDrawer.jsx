import { useEffect, useState } from "react";
import { api, pageItems } from "../api/client";
import { ErrorMessage } from "./Primitives";

export default function WorkItemDrawer({ projectId, item, sprints, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: item?.title || "",
    description: item?.description || "",
    status: item?.status || "BACKLOG",
    priority: item?.priority || "MEDIUM",
    assigneeId: item?.assigneeId || "",
    sprintId: item?.sprintId || "",
    dueDate: item?.dueDate || "",
  });
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [savingComment, setSavingComment] = useState(false);

  async function loadComments() {
    if (!item?.id) return;
    try {
      setComments(pageItems(await api(`/projects/${projectId}/work-items/${item.id}/comments?size=100`)));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => { loadComments(); }, [projectId, item?.id]);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const body = {
      ...form,
      assigneeId: form.assigneeId || null,
      sprintId: form.sprintId || null,
      dueDate: form.dueDate || null,
    };
    try {
      await api(item
        ? `/projects/${projectId}/work-items/${item.id}`
        : `/projects/${projectId}/work-items`, {
        method: item ? "PUT" : "POST",
        body,
      });
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function addComment(event) {
    event.preventDefault();
    setSavingComment(true);
    setError("");
    try {
      await api(`/projects/${projectId}/work-items/${item.id}/comments`, {
        method: "POST",
        body: { body: comment },
      });
      setComment("");
      await loadComments();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingComment(false);
    }
  }

  async function saveComment(commentId) {
    try {
      await api(`/projects/${projectId}/work-items/${item.id}/comments/${commentId}`, {
        method: "PATCH",
        body: { body: editingComment.body },
      });
      setEditingComment(null);
      await loadComments();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteItem() {
    if (!window.confirm("Delete this work item?")) return;
    try {
      await api(`/projects/${projectId}/work-items/${item.id}`, { method: "DELETE" });
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteComment(commentId) {
    try {
      await api(`/projects/${projectId}/work-items/${item.id}/comments/${commentId}`, { method: "DELETE" });
      await loadComments();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="work-drawer">
        <div className="drawer-heading">
          <div><div className="eyebrow">{item ? "WORK ITEM" : "NEW WORK"}</div><h2>{item ? "Edit item" : "Create item"}</h2></div>
          <button className="icon-button" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <ErrorMessage error={error} />
        <form className="form-stack drawer-form" onSubmit={save}>
          <label>Title<input required maxLength="240" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label>Description<textarea rows="4" maxLength="4000" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <div className="form-grid">
            <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              {["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"].map((status) => <option key={status}>{status}</option>)}
            </select></label>
            <label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((priority) => <option key={priority}>{priority}</option>)}
            </select></label>
            <label>Assignee ID<input value={form.assigneeId} onChange={(event) => setForm({ ...form, assigneeId: event.target.value })} placeholder="Optional user UUID" /></label>
            <label>Sprint<select value={form.sprintId} onChange={(event) => setForm({ ...form, sprintId: event.target.value })}>
              <option value="">No sprint</option>
              {sprints.map((sprint) => <option value={sprint.id} key={sprint.id}>{sprint.name}</option>)}
            </select></label>
            <label className="span-two">Due date<input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label>
          </div>
          <div className="form-actions">
            {item && <button type="button" className="button button-danger-ghost" onClick={deleteItem}>Delete item</button>}
            <button type="button" className="button button-subtle" onClick={onClose}>Cancel</button>
            <button className="button button-primary" disabled={busy}>{busy ? "Saving…" : "Save item"}</button>
          </div>
        </form>
        {item && (
          <section className="comments-section">
            <div className="section-heading"><div><div className="eyebrow">DISCUSSION</div><h3>Comments <span>{comments.length}</span></h3></div></div>
            <form className="comment-compose" onSubmit={addComment}>
              <textarea required maxLength="4000" rows="2" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add context for your team…" />
              <button className="button button-primary button-small" disabled={savingComment}>{savingComment ? "Sending…" : "Post comment"}</button>
            </form>
            <div className="comment-list">
              {comments.map((entry) => (
                <article className="comment" key={entry.id}>
                  <div className="comment-meta"><span className="avatar avatar-small">{entry.authorName?.slice(0, 1)}</span><strong>{entry.authorName}</strong><time>{new Date(entry.createdAt).toLocaleString()}</time></div>
                  {editingComment?.id === entry.id ? (
                    <div className="comment-edit">
                      <textarea value={editingComment.body} onChange={(event) => setEditingComment({ ...editingComment, body: event.target.value })} />
                      <button className="text-button" onClick={() => saveComment(entry.id)}>Save</button>
                      <button className="text-button" onClick={() => setEditingComment(null)}>Cancel</button>
                    </div>
                  ) : <p>{entry.body}</p>}
                  <div className="comment-actions">
                    <button className="text-button" onClick={() => setEditingComment({ id: entry.id, body: entry.body })}>Edit</button>
                    <button className="text-button text-danger" onClick={() => deleteComment(entry.id)}>Delete</button>
                  </div>
                </article>
              ))}
              {comments.length === 0 && <p className="muted">No comments yet. Start the conversation.</p>}
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}
