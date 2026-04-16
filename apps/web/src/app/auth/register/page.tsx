'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', phone: '', firstName: '', lastName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokens = await api.register(form);
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Qeydiyyat alınmadı');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, label: string, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      <input
        type={type} required={required}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold mb-6">Qeydiyyat</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {field('firstName', 'Ad')}
            {field('lastName', 'Soyad')}
          </div>
          {field('email', 'E-poçt', 'email', true)}
          {field('phone', 'Telefon (+994...)', 'tel')}
          {field('password', 'Şifrə (min 8 simvol)', 'password', true)}

          <button
            type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
          >
            {loading ? 'Gözləyin...' : 'Qeydiyyatdan keç'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Hesabınız var?{' '}
          <Link href="/auth/login" className="text-red-600 hover:underline font-medium">
            Giriş
          </Link>
        </p>
      </div>
    </div>
  );
}
