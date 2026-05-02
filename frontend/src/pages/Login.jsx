import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">⚡ TaskFlow</h1>
        <p className="auth-subtitle">Welcome back! Sign in to continue.</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input id="login-username" className="form-input" type="text" placeholder="Enter your username"
              value={username} onChange={e => setUsername(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="login-password" className="form-input" type="password" placeholder="Enter your password"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button id="login-submit" className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
