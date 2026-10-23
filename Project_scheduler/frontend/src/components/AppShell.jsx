import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }) {
  const { session } = useAuth();
  const location = useLocation();
  if (!session?.token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

export default function AppShell() {
  const { session, logout } = useAuth();
  const location = useLocation();
  const projectId = location.pathname.match(/^\/projects\/([^/]+)/)?.[1];
  const [apiStatus, setApiStatus] = useState("checking");

  function signOut() {
    logout().catch((error) => window.alert(`Signed out locally, but server logout failed: ${error.message}`));
  }

  useEffect(() => {
    fetch("/actuator/health")
      .then((response) => setApiStatus(response.ok ? "online" : "offline"))
      .catch(() => setApiStatus("offline"));
  }, []);

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <NavLink to="/projects" className="brand">
          <span className="brand-mark">S</span>
          <span>SprintForge</span>
        </NavLink>
        <div className="nav-caption">WORKSPACE</div>
        <NavLink to="/projects" className="side-link">Projects</NavLink>
        {projectId && (
          <>
            <div className="nav-caption">PROJECT</div>
            <NavLink to={`/projects/${projectId}`} end className="side-link">Overview</NavLink>
            <NavLink to={`/projects/${projectId}/board`} className="side-link">Kanban board</NavLink>
            <NavLink to={`/projects/${projectId}/sprints`} className="side-link">Sprints</NavLink>
            <NavLink to={`/projects/${projectId}/members`} className="side-link">Members</NavLink>
            <NavLink to={`/projects/${projectId}/audit`} className="side-link">Audit history</NavLink>
          </>
        )}
        {session?.user?.role === "ADMIN" && (
          <>
            <div className="nav-caption">ADMINISTRATION</div>
            <NavLink to="/admin" className="side-link">Admin console</NavLink>
          </>
        )}
        <div className="sidebar-bottom">
          <div className="user-chip">
            <span className="avatar">{session?.user?.displayName?.slice(0, 1) || "U"}</span>
            <span className="user-copy">
              <strong>{session?.user?.displayName}</strong>
              <small>{session?.user?.role}</small>
            </span>
          </div>
          <button className="side-link signout" onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">SprintForge <span>/</span> Team workspace</div>
          <span className={`status-indicator status-${apiStatus}`}><i /> {apiStatus === "online" ? "API healthy" : apiStatus === "offline" ? "API unavailable" : "Checking API"}</span>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
