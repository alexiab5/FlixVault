'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import devLog from '../lib/devLog';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on mount
    const token = Cookies.get('token');
    const storedUser = localStorage.getItem('user');
    
    devLog.log('=== AUTH CONTEXT DEBUG ===');
    devLog.log('Token:', token);
    devLog.log('Stored User:', storedUser);
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        devLog.log('Parsed User:', parsedUser);
        devLog.log('User Role:', parsedUser?.role);
        devLog.log('Is Admin Check:', parsedUser?.role === 'ADMIN');
        setUser(parsedUser);
      } catch (error) {
        devLog.error('Error parsing user data:', error);
      }
    }
    devLog.log('========================');
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      devLog.log('=== LOGIN DEBUG ===');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      devLog.log('Login response:', data);
      devLog.log('User role from login:', data.user?.role);
      devLog.log('Is admin check from login:', data.user?.role === 'ADMIN');
      devLog.log('===================');

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      Cookies.set('token', data.token, { expires: 1 }); // Expires in 1 day
      setUser(data.user);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();
      devLog.log('Register response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      Cookies.set('token', data.token, { expires: 1 }); // Expires in 1 day
      setUser(data.user);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    Cookies.remove('token');
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 