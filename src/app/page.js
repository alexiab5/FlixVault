"use client";

import { useRouter } from 'next/navigation';
import Image from "next/image";
import RegularButton from '@/components/RegularButton';

export default function Home() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/home'); 
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">

    <h1 className="text-4xl font-bold text-white mb-4">Welcome to FlixVault!</h1>
    <p className="text-lg text-white mb-6">Lights, camera, action – your movie diary awaits!</p>

    <RegularButton text="Create an account" onClick={handleClick}>
    </RegularButton>
  </div>
  );
}
