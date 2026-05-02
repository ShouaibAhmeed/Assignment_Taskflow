import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokens = JSON.parse(localStorage.getItem('tokens') || 'null');
    if (tokens?.access) {
      api.get('/auth/me/')
        .then(res => { setUser(res.data); localStorage.setItem('user', JSON.stringify(res.data)); })
        .catch(() => { logout(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login/', { username, password });
    const tokens = { access: res.data.access, refresh: res.data.refresh };
    localStorage.setItem('tokens', JSON.stringify(tokens));
    const me = await api.get('/auth/me/');
    setUser(me.data);
    localStorage.setItem('user', JSON.stringify(me.data));
    return me.data;
  };

  const signup = async (data) => {
    const res = await api.post('/auth/signup/', data);
    const tokens = res.data.tokens;
    localStorage.setItem('tokens', JSON.stringify(tokens));
    setUser(res.data.user);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('tokens');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
