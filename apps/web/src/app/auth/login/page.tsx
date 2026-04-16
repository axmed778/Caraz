'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokens = await api.login(form);
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Giriş alınmadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold mb-6">Giriş</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-poçt</label>
            <input
              type="email" required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifrə</label>
            <input
              type="password" required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
          >
            {loading ? 'Gözləyin...' : 'Giriş et'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Hesabınız yoxdur?{' '}
          <Link href="/auth/register" className="text-red-600 hover:underline font-medium">
            Qeydiyyat
          </Link>
        </p>
      </div>
    </div>
  );
}
