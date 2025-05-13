"use client";

import Link from 'next/link';
import { useState, useEffect } from "react";
import { useAuth } from '../../context/AuthContext';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const { user, logout, isAuthenticated } = useAuth();

    useEffect(() => {
      const handleScroll = () => {
        if (window.scrollY > 10) {
          setIsScrolled(true);
        } else {
          setIsScrolled(false);
        }
      };
  
      window.addEventListener("scroll", handleScroll);
      
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }, []);

    return (
      <>
        <header
          className={`text-white p-2 fixed top-0 left-0 right-0 z-50 ${
            isScrolled ? "bg-black/5 backdrop-blur-sm shadow-md" : "bg-transparent"
          }`}
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
              FlixVault
            </Link>
            <nav className="space-x-4">
              {isAuthenticated ? (
                <>
                  <Link href="/diary" className="hover:underline">Diary</Link>
                  <Link href="/statistics" className="hover:underline">Statistics</Link>
                  <button 
                    onClick={logout}
                    className="hover:underline"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:underline">Log In</Link>
                  <Link href="/register" className="hover:underline">Register</Link>
                </>
              )}
            </nav>
          </div>
        </header>
      </>
    );
  }
  