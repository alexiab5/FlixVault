"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Image from "next/image";
import RegularButton from '@/components/RegularButton';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/diary');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  const handleClick = () => {
    router.push('/home'); 
  };

  return null;
}
