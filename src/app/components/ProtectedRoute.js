'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  console.log('=== PROTECTED ROUTE DEBUG ===');
  console.log('User:', user);
  console.log('Loading:', loading);
  console.log('Is Authenticated:', isAuthenticated);
  console.log('Is Admin:', isAdmin);
  console.log('Require Admin:', requireAdmin);
  console.log('===========================');

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        console.log('Not authenticated, redirecting to login');
        router.push('/login');
      } else if (requireAdmin && !isAdmin) {
        console.log('Not admin, redirecting to home');
        router.push('/'); // Redirect to home if not admin
      }
    }
  }, [loading, isAuthenticated, isAdmin, requireAdmin, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  return children;
} 