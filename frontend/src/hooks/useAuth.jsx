import { createContext, useContext, useMemo, useState } from 'react';
import api from '../services/api.js';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('dispatch_user')); } catch { return null; } });
  const [loading, setLoading] = useState(false);
  async function signIn(path, data) { setLoading(true); try { const result = (await api.post(`/auth/${path}`, data)).data; localStorage.setItem('dispatch_token', result.token); localStorage.setItem('dispatch_user', JSON.stringify(result.user)); setUser(result.user); return result.user; } finally { setLoading(false); } }
  function signOut() { localStorage.removeItem('dispatch_token'); localStorage.removeItem('dispatch_user'); setUser(null); }
  const value = useMemo(() => ({ user, loading, login: (data) => signIn('login', data), register: (data) => signIn('register', data), logout: signOut }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
