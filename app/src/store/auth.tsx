import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserInfo } from '../types';

interface AuthState {
  token: string | null;
  userInfo: UserInfo | null;
  isLoggedIn: boolean;
  login: (token: string, userInfo: UserInfo) => void;
  logout: () => void;
  updateUserInfo: (partial: Partial<UserInfo>) => void;
}

const AuthContext = createContext<AuthState>({
  token: null,
  userInfo: null,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
  updateUserInfo: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
    const stored = localStorage.getItem('userInfo');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((newToken: string, newUserInfo: UserInfo) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
    setToken(newToken);
    setUserInfo(newUserInfo);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    setToken(null);
    setUserInfo(null);
  }, []);

  const updateUserInfo = useCallback((partial: Partial<UserInfo>) => {
    setUserInfo(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem('userInfo', JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    // 同步 localStorage token 到全局（供 request.ts 使用）
    if (token) {
      localStorage.setItem('token', token);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, userInfo, isLoggedIn: !!token, login, logout, updateUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
