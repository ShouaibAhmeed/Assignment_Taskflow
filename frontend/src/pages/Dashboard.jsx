import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  const d = data || { projects: { total: 0 }, all_tasks: { total: 0, todo: 0, in_progress: 0, done: 0, overdue: 0 }, my_tasks: { total: 0 }, recent_tasks: [], overdue_tasks: [] };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.first_name || user?.username} 👋</h1>
        <p className="page-subtitle">Here's an overview of your team's progress.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-value">{d.projects.total}</div>
          <div className="stat-label">Total Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{d.all_tasks.total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{d.all_tasks.done}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{d.all_tasks.overdue}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div className="section-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📊 Task Breakdown</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ProgressBar label="To Do" value={d.all_tasks.todo} total={d.all_tasks.total} color="var(--status-todo)" />
            <ProgressBar label="In Progress" value={d.all_tasks.in_progress} total={d.all_tasks.total} color="var(--status-progress)" />
            <ProgressBar label="Done" value={d.all_tasks.done} total={d.all_tasks.total} color="var(--status-done)" />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🎯 My Tasks</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Assigned to me</span>
              <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>{d.my_tasks.total}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <MiniStat label="To Do" value={d.my_tasks.todo} color="var(--status-todo)" />
              <MiniStat label="In Progress" value={d.my_tasks.in_progress} color="var(--status-progress)" />
              <MiniStat label="Done" value={d.my_tasks.done} color="var(--status-done)" />
              {d.my_tasks.overdue > 0 && <MiniStat label="Overdue" value={d.my_tasks.overdue} color="var(--danger)" />}
            </div>
          </div>
        </div>
      </div>

      {d.overdue_tasks.length > 0 && (
        <div className="card" style={{ marginTop: 24, borderColor: 'rgba(239,68,68,0.3)' }}>
          <div className="card-header">
            <h2 className="card-title">🔴 Overdue Tasks</h2>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>Task</th><th>Project</th><th>Due Date</th><th>Status</th></tr></thead>
              <tbody>
                {d.overdue_tasks.map(t => (
                  <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects`)}>
                    <td style={{ fontWeight: 600 }}>{t.title}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{t.project_name}</td>
                    <td><span className="badge badge-overdue">{t.due_date}</span></td>
                    <td><span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h2 className="card-title">🕐 Recent Activity</h2>
        </div>
        {d.recent_tasks.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <h3>No tasks yet</h3>
            <p>Create a project and start adding tasks!</p>
            <button className="btn btn-primary" onClick={() => navigate('/projects')}>Go to Projects</button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Updated</th></tr></thead>
              <tbody>
                {d.recent_tasks.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500 }}>{t.title}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{t.project_name}</td>
                    <td><span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span></td>
                    <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{new Date(t.updated_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total, color }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: 8, background: 'var(--bg-glass)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ background: 'var(--bg-glass)', borderRadius: 8, padding: '8px 14px', flex: 1, minWidth: 80, textAlign: 'center' }}>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  );
}
