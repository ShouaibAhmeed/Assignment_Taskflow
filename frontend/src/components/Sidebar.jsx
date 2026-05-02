import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user ? (user.first_name?.[0] || '') + (user.last_name?.[0] || user.username?.[0] || '') : '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">⚡ TaskFlow</div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="icon">📊</span> Dashboard
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="icon">📁</span> Projects
        </NavLink>
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials.toUpperCase()}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.first_name || user?.username}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>
        <button className="sidebar-link" onClick={handleLogout} style={{ marginTop: 8 }}>
          <span className="icon">🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}
