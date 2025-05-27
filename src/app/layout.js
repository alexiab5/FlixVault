import { Geist, Geist_Mono } from "next/font/google";
import OfflineStatusBanner from '@/components/OfflineStatusBanner';
import "./globals.css";
import { ReviewDiaryProvider } from "../context/ReviewDiaryContext";
import { AuthProvider } from '../context/AuthContext';
import { startMonitoringService } from '../lib/monitoringService';
import HeaderWrapper from '@/components/HeaderWrapper';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Only start monitoring service in production and when not in a build context
if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
  startMonitoringService();
}

export const metadata = {
  title: "FlixVault",
  description: "FlixVault - movie diary",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} h-full min-h-screen overflow-x-hidden pt-16`}>
        <AuthProvider>
          <ReviewDiaryProvider>
            <HeaderWrapper />
            <OfflineStatusBanner />
            {children}
          </ReviewDiaryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
