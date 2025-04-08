"use client"

import OfflineStatusBanner from '@/components/OfflineStatusBanner';
import Header from '@/components/Header';

export default function ClientLayout({ children }) {
  return (
    <>
      <OfflineStatusBanner />
      <Header />
      {children}
    </>
  );
}