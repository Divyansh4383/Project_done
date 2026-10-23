import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { ErrorMessage, Loading, PageTitle } from "../components/Primitives";

export default function MembersPage() {
  const { projectId } = useParams();
  const { session } = useAuth();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const isOwner = project?.ownerId === session?.user?.id;

  async function load() {
    try {
      const [projectResult, memberList] = await Promise.all([
        api(`/projects/${projectId}`),
        api(`/projects/${projectId}/members`),
      ]);
      setProject(projectResult);
      setMembers(memberList);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [projectId]);

  async function addMember(event) {
    event.preventDefault();
    try {
      await api(`/projects/${projectId}/members/${encodeURIComponent(email)}`, { method: "POST" });
      setEmail("");
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <>
      <PageTitle eyebrow="PROJECT TEAM" title="Members" description={project ? `People collaborating on ${project.name}.` : "Manage project access and collaboration."} />
      <ErrorMessage error={error} />
      {loading ? <Loading label="Loading members…" /> : (
        <>
          {isOwner && (
            <form className="panel invite-form" onSubmit={addMember}>
              <div><div className="eyebrow">INVITE A COLLEAGUE</div><strong>Add an existing SprintForge user</strong></div>
              <div className="invite-controls"><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="colleague@company.com" /><button className="button button-primary">Add member</button></div>
            </form>
          )}
          <div className="panel table-panel">
            <div className="table-heading"><h2>Team <span className="count-pill">{members.length}</span></h2><span className="muted">{isOwner ? "Project owner" : "Project member"}</span></div>
            <table>
              <thead><tr><th>Member</th><th>Email</th><th>Access</th></tr></thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td><div className="table-person"><span className="avatar">{member.displayName.slice(0, 1)}</span><strong>{member.displayName}</strong></div></td>
                    <td>{member.email}</td>
                    <td><span className="muted">{member.id === project.ownerId ? "Owner" : "Member"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
