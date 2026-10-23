import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { ErrorMessage, Loading, PageTitle, StatusBadge } from "../components/Primitives";

export default function ProjectOverviewPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api(`/projects/${projectId}`),
      api(`/projects/${projectId}/work-items/summary`),
    ]).then(([projectResult, summaryResult]) => {
      setProject(projectResult);
      setSummary(summaryResult);
    }).catch((requestError) => setError(requestError.message));
  }, [projectId]);

  if (error) return <ErrorMessage error={error} />;
  if (!project || !summary) return <Loading label="Loading project…" />;

  return (
    <>
      <PageTitle
        eyebrow={`PROJECT / ${project.key}`}
        title={project.name}
        description={project.description || "Project overview and delivery activity."}
        actions={<StatusBadge value={project.status} />}
      />
      <div className="stat-grid">
        <div className="stat-card panel"><span className="stat-label">Open work</span><strong>{summary.total}</strong><small>tracked items</small></div>
        <div className="stat-card panel"><span className="stat-label">Team members</span><strong>{project.memberCount}</strong><small>collaborators</small></div>
        <div className="stat-card panel"><span className="stat-label">Completed</span><strong>{summary.counts?.DONE || 0}</strong><small>items delivered</small></div>
      </div>
      <section className="panel overview-panel">
        <div className="section-heading"><div><div className="eyebrow">PROJECT SPACE</div><h2>Keep the team moving</h2></div></div>
        <div className="quick-links">
          <Link to={`/projects/${projectId}/board`} className="quick-link"><span className="quick-icon">▦</span><span><strong>Kanban board</strong><small>See work across every stage</small></span><b>→</b></Link>
          <Link to={`/projects/${projectId}/sprints`} className="quick-link"><span className="quick-icon">◷</span><span><strong>Sprints</strong><small>Plan goals and delivery windows</small></span><b>→</b></Link>
          <Link to={`/projects/${projectId}/members`} className="quick-link"><span className="quick-icon">◎</span><span><strong>Members</strong><small>Manage the project team</small></span><b>→</b></Link>
          <Link to={`/projects/${projectId}/audit`} className="quick-link"><span className="quick-icon">≡</span><span><strong>Audit history</strong><small>Review important changes</small></span><b>→</b></Link>
        </div>
      </section>
    </>
  );
}
