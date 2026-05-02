import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: '', status: 'todo', priority: 'medium', due_date: '' });
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [editingTask, setEditingTask] = useState(null);

  const isAdmin = project?.my_role === 'admin';

  const fetchAll = useCallback(() => {
    Promise.all([
      api.get(`/projects/${id}/`),
      api.get(`/projects/${id}/members/`),
      api.get(`/projects/${id}/tasks/`),
    ]).then(([pRes, mRes, tRes]) => {
      setProject(pRes.data);
      setMembers(mRes.data);
      setTasks(tRes.data.results || tRes.data);
    }).catch(() => navigate('/projects')).finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) { setError('Task title is required.'); return; }
    setError('');
    try {
      const payload = { ...taskForm };
      if (!payload.assigned_to) delete payload.assigned_to;
      if (!payload.due_date) delete payload.due_date;
      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}/`, payload);
      } else {
        await api.post(`/projects/${id}/tasks/`, payload);
      }
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assigned_to: '', status: 'todo', priority: 'medium', due_date: '' });
      setEditingTask(null);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed.');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/`, { status: newStatus });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.detail || 'Cannot update status.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${taskId}/`); fetchAll(); } catch { alert('Failed to delete.'); }
  };

  const searchUsers = async (q) => {
    setMemberSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const r = await api.get(`/auth/users/search/?q=${q}`);
      setSearchResults(r.data);
    } catch { setSearchResults([]); }
  };

  const addMember = async (userId) => {
    try {
      await api.post(`/projects/${id}/members/`, { user_id: userId, role: 'member' });
      setShowMemberModal(false); setMemberSearch(''); setSearchResults([]);
      fetchAll();
    } catch (err) { alert(err.response?.data?.detail || 'Failed to add member.'); }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try { await api.delete(`/projects/${id}/members/${userId}/`); fetchAll(); } catch (err) { alert(err.response?.data?.detail || 'Failed.'); }
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title, description: task.description || '',
      assigned_to: task.assigned_to || '', status: task.status,
      priority: task.priority, due_date: task.due_date || '',
    });
    setShowTaskModal(true);
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this entire project? This cannot be undone.')) return;
    try { await api.delete(`/projects/${id}/`); navigate('/projects'); } catch { alert('Failed to delete project.'); }
  };

  const filteredTasks = tasks.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    return true;
  });

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!project) return null;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')} style={{ marginBottom: 12 }}>← Back</button>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-subtitle">{project.description || 'No description'}</p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>🗑 Delete</button>
          </div>
        )}
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
          📋 Tasks ({tasks.length})
        </button>
        <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
          👥 Members ({members.length})
        </button>
      </div>

      {activeTab === 'tasks' && (
        <div>
          <div className="task-filters">
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select className="form-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <div style={{ flex: 1 }} />
            {isAdmin && <button className="btn btn-primary" onClick={() => { setEditingTask(null); setTaskForm({ title: '', description: '', assigned_to: '', status: 'todo', priority: 'medium', due_date: '' }); setShowTaskModal(true); }}>+ Add Task</button>}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="card"><div className="empty-state"><div className="icon">📋</div><h3>No tasks found</h3><p>{tasks.length === 0 ? 'Create your first task.' : 'Try adjusting filters.'}</p></div></div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>Task</th><th>Assignee</th><th>Status</th><th>Priority</th><th>Due Date</th>{isAdmin && <th>Actions</th>}</tr></thead>
                <tbody>
                  {filteredTasks.map(t => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.title}</div>
                        {t.is_overdue && <span className="badge badge-overdue" style={{ marginTop: 4 }}>OVERDUE</span>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{t.assigned_to_detail?.full_name || '—'}</td>
                      <td>
                        <select className="form-select" value={t.status} onChange={e => handleStatusChange(t.id, e.target.value)}
                          style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem', background: 'var(--bg-glass)' }}>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </td>
                      <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                      <td style={{ color: t.is_overdue ? 'var(--danger)' : 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {t.due_date || '—'}
                      </td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-icon" title="Edit" onClick={() => openEditTask(t)}>✏️</button>
                            <button className="btn-icon" title="Delete" onClick={() => handleDeleteTask(t.id)}>🗑</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div>
          {isAdmin && <button className="btn btn-primary" onClick={() => setShowMemberModal(true)} style={{ marginBottom: 16 }}>+ Add Member</button>}
          <div className="members-list">
            {members.map(m => (
              <div key={m.id} className="member-item">
                <div className="member-avatar">{(m.user.full_name || m.user.username)[0].toUpperCase()}</div>
                <div className="member-info">
                  <div className="member-name">{m.user.full_name || m.user.username}</div>
                  <div className="member-email">{m.user.email}</div>
                </div>
                <span className={`badge badge-${m.role}`}>{m.role}</span>
                {isAdmin && m.user.id !== user?.id && (
                  <button className="btn-icon" onClick={() => removeMember(m.user.id)} title="Remove">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="modal-overlay" onClick={() => { setShowTaskModal(false); setEditingTask(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editingTask ? 'Edit Task' : 'Create Task'}</h2>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="Task title" value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Task details..." value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select className="form-select" value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}>
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.user.id} value={m.user.id}>{m.user.full_name || m.user.username}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={taskForm.due_date}
                    onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowTaskModal(false); setEditingTask(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingTask ? 'Save Changes' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Add Team Member</h2>
            <div className="form-group">
              <label className="form-label">Search by username or email</label>
              <input className="form-input" placeholder="Type at least 2 characters..."
                value={memberSearch} onChange={e => searchUsers(e.target.value)} autoFocus />
            </div>
            {searchResults.length > 0 && (
              <div className="members-list">
                {searchResults.map(u => (
                  <div key={u.id} className="member-item" style={{ cursor: 'pointer' }} onClick={() => addMember(u.id)}>
                    <div className="member-avatar">{(u.full_name || u.username)[0].toUpperCase()}</div>
                    <div className="member-info">
                      <div className="member-name">{u.full_name || u.username}</div>
                      <div className="member-email">{u.email}</div>
                    </div>
                    <span style={{ color: 'var(--accent-purple-light)', fontSize: '0.82rem', fontWeight: 600 }}>+ Add</span>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
