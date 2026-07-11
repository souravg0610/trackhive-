import { useState, useCallback } from 'react';
import { apiSignOut } from '../lib/apiClient';

export interface AuthState {
  email: string;
  name: string;
}

export function useAuth() {
 const [auth, setAuth] = useState<AuthState>(() => {
  const token = localStorage.getItem('th_token');
  if (!token) return { email: '', name: '' };
  return {
    email: localStorage.getItem('th_user_email') ?? '',
    name:  localStorage.getItem('th_user_name')  ?? '',
  };
});

  const login = useCallback((email: string, fullName?: string) => {
    const name = fullName ?? email.split('@')[0];
    localStorage.setItem('th_user_email', email);
    localStorage.setItem('th_user_name', name);
    setAuth({ email, name });
  }, []);

  const logout = useCallback(() => {
    apiSignOut();           // clears th_token + th_refresh_token
    localStorage.clear();   // wipes everything — clean slate
    window.location.href = '/'; // hard reload — no stale React state
  }, []);

  const loginAsDemo = useCallback(() => {
    login('demo@trackhive.com', 'Demo Admin');
  }, [login]);

  return { auth, login, logout, loginAsDemo, isLoggedIn: !!auth.email };
}