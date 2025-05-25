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

// Start the monitoring service in both development and production
startMonitoringService();

export const metadata = {
  title: "FlixVault",
  description: "FlixVault - movie diary",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true"/>
        <link 
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet"
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet"
        />
      </head>
      <body className="h-full min-h-screen overflow-x-hidden pt-16">
        <AuthProvider>
          <ReviewDiaryProvider>
            <OfflineStatusBanner />
            <HeaderWrapper>
              {children}
            </HeaderWrapper>
          </ReviewDiaryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
