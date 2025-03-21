"use client";

import Link from 'next/link';
import { useState, useEffect } from "react";

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);

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
       <header
      className={`text-white p-2 fixed top-0 left-0 right-0 z-50 ${
        isScrolled ? "bg-black/5 backdrop-blur-sm shadow-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
            <p className="text-xl font-bold  ">FlixVault</p>
            <nav className="space-x-4">
            <Link href="/login" className="hover:underline">
                Log In
            </Link>
            <Link href="/" className="hover:underline">
                Home
            </Link>
            <Link href="/diary" className="hover:underline">
                Diary
            </Link>
            <Link href="/lists" className="hover:underline">
                Lists
            </Link>
            <Link href="/statistics" className="hover:underline">
                Statistics
            </Link>
            </nav>
          </div>
        </header>
      );
}