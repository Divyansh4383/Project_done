import { Navigate, Route, Routes } from "react-router-dom";
import AppShell, { ProtectedRoute } from "./components/AppShell";
import { useAuth } from "./context/AuthContext";
import AdminPage from "./pages/AdminPage";
import AuditPage from "./pages/AuditPage";
import AuthPage from "./pages/AuthPage";
import BoardPage from "./pages/BoardPage";
import MembersPage from "./pages/MembersPage";
import ProjectOverviewPage from "./pages/ProjectOverviewPage";
import ProjectsPage from "./pages/ProjectsPage";
import SprintsPage from "./pages/SprintsPage";

function AdminRoute() {
  const { session } = useAuth();
  return session?.user?.role === "ADMIN"
    ? <AdminPage />
    : <Navigate to="/projects" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectOverviewPage />} />
        <Route path="/projects/:projectId/board" element={<BoardPage />} />
        <Route path="/projects/:projectId/sprints" element={<SprintsPage />} />
        <Route path="/projects/:projectId/members" element={<MembersPage />} />
        <Route path="/projects/:projectId/audit" element={<AuditPage />} />
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Route>
    </Routes>
  );
}
