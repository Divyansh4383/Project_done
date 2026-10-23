export function PageTitle({ eyebrow, title, description, actions }) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="title-actions">{actions}</div>}
    </div>
  );
}

export function ErrorMessage({ error }) {
  return error ? <div className="alert alert-error" role="alert">{error}</div> : null;
}

export function Loading({ label = "Loading…" }) {
  return <div className="loading"><span className="spinner" />{label}</div>;
}

export function EmptyState({ title, children }) {
  return <div className="empty-state"><div className="empty-icon">◇</div><h3>{title}</h3>{children}</div>;
}

export function StatusBadge({ value }) {
  const tone = value?.toLowerCase().replaceAll("_", "-") || "neutral";
  return <span className={`badge badge-${tone}`}>{value?.replaceAll("_", " ") || "—"}</span>;
}
