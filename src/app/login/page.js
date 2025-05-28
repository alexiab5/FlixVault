"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import RegularButton from '../components/RegularButton';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        // Check if user is admin and redirect accordingly
        const user = JSON.parse(localStorage.getItem('user'));
        if (user?.role === 'ADMIN') {
          router.push('/admin/monitored-users');
        } else {
          router.push('/diary');
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[url('/images/dynamic-gradient-grainy-bg.jpg')] bg-cover bg-center bg-fixed">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Welcome Back!</h1>
        <p className="text-white/80 text-xl">Continue your cinematic journey with FlixVault</p>
      </div>
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-lg shadow-lg w-full max-w-md">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-white mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/20 text-white border-white/20 px-3 py-2 rounded"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-white mb-2">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/20 text-white border-white/20 px-3 py-2 rounded"
              placeholder="Enter your password"
            />
          </div>
          <RegularButton
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Logging in...' : 'Login'}
          </RegularButton>
        </form>
        <p className="mt-4 text-center text-white">
          Don&apos;t have an account?{' '}
          <button
            onClick={() => router.push('/register')}
            className="text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}