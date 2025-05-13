import { Geist, Geist_Mono } from "next/font/google";
import Header from '@/components/Header';
import OfflineStatusBanner from '@/components/OfflineStatusBanner';
import "./globals.css";
import { ReviewDiaryProvider } from "../context/ReviewDiaryContext";
import { AuthProvider } from '../context/AuthContext';
import { startMonitoringService } from '../lib/monitoringService';

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
      <body className="h-full min-h-screen bg-[url('/images/dynamic-gradient-grainy-bg.jpg')] bg-cover bg-center bg-fixed overflow-x-hidden pt-16">
        <AuthProvider>
          <ReviewDiaryProvider>
            <OfflineStatusBanner />
            <Header />
            {children}
          </ReviewDiaryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
