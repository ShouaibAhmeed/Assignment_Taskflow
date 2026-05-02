import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [form, setForm] = useState({ username: '', email: '', first_name: '', last_name: '', password: '', password2: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.email || !form.password || !form.password2) {
      setError('Please fill in all required fields.'); return;
    }
    if (form.password !== form.password2) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await signup(form);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const msg = Object.values(data).flat().join(' ');
        setError(msg);
      } else { setError('Registration failed. Please try again.'); }
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">⚡ TaskFlow</h1>
        <p className="auth-subtitle">Create your account to get started.</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input className="form-input" placeholder="John" value={form.first_name} onChange={update('first_name')} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-input" placeholder="Doe" value={form.last_name} onChange={update('last_name')} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Username *</label>
            <input id="signup-username" className="form-input" placeholder="johndoe" value={form.username} onChange={update('username')} />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input id="signup-email" className="form-input" type="email" placeholder="john@example.com" value={form.email} onChange={update('email')} />
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input id="signup-password" className="form-input" type="password" placeholder="Min 8 characters" value={form.password} onChange={update('password')} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password *</label>
            <input id="signup-password2" className="form-input" type="password" placeholder="Confirm password" value={form.password2} onChange={update('password2')} />
          </div>
          <button id="signup-submit" className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
