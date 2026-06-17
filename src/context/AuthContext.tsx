import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { UserRole } from '../types';

interface AuthContextType {
  role: UserRole | null;
  userName: string;
  login: (role: UserRole, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  role: null,
  userName: '',
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem('fleetops-role');
    return saved === 'admin' || saved === 'maintenance' || saved === 'driver' ? saved : null;
  });
  const [userName, setUserName] = useState(() => localStorage.getItem('fleetops-username') || '');

  const login = useCallback((r: UserRole, name: string) => {
    setRole(r);
    setUserName(name);
    localStorage.setItem('fleetops-role', r);
    localStorage.setItem('fleetops-username', name);
  }, []);

  const logout = useCallback(() => {
    setRole(null);
    setUserName('');
    localStorage.removeItem('fleetops-role');
    localStorage.removeItem('fleetops-username');
  }, []);

  return (
    <AuthContext.Provider value={{ role, userName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
