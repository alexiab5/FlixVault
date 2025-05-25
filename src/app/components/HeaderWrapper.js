"use client";

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function HeaderWrapper({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <>
      {!isAuthPage && <Header />}
      {children}
    </>
  );
} 