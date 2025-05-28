'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import devLog from '../../lib/devLog';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      devLog.log('=== PROTECTED ROUTE DEBUG ===');
      devLog.log('User:', user);
      devLog.log('Loading:', loading);
      devLog.log('Is Authenticated:', isAuthenticated);
      devLog.log('Is Admin:', isAdmin);
      devLog.log('Require Admin:', requireAdmin);
      devLog.log('===========================');

      if (!isAuthenticated) {
        devLog.log('Not authenticated, redirecting to login');
        router.push('/login');
      } else if (requireAdmin && !isAdmin) {
        devLog.log('Not admin, redirecting to home');
        router.push('/');
      }
    }
  }, [loading, isAuthenticated, isAdmin, requireAdmin, router, user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || (requireAdmin && !isAdmin)) {
    return null;
  }

  return children;
} 