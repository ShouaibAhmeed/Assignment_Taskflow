import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = () => {
    api.get('/projects/').then(r => setProjects(r.data.results || r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Project name is required.'); return; }
    setCreating(true); setError('');
    try {
      await api.post('/projects/', form);
      setShowModal(false); setForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.name?.[0] || 'Failed to create project.');
    } finally { setCreating(false); }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage your team projects and track progress.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon">📁</div>
            <h3>No projects yet</h3>
            <p>Create your first project to start managing tasks.</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
          </div>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <div key={p.id} className="card project-card" onClick={() => navigate(`/projects/${p.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div className="project-card-name">{p.name}</div>
                {p.my_role && <span className={`badge badge-${p.my_role}`}>{p.my_role}</span>}
              </div>
              <p className="project-card-desc">{p.description || 'No description'}</p>
              <div className="project-card-meta">
                <span>👥 {p.member_count} members</span>
                <span>📋 {p.task_count} tasks</span>
                <span>📅 {new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create New Project</h2>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input className="form-input" placeholder="e.g. Website Redesign" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="What is this project about?"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
