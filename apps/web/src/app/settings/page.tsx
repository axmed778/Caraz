'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/auth/login'); return; }

    api.getMe(token).then(me => {
      if (!me) { router.push('/auth/login'); return; }
      setUser(me);
      setForm({
        firstName: me.profile?.firstName || '',
        lastName: me.profile?.lastName || '',
        phone: me.phone || '',
      });
      setLoading(false);
    }).catch(() => router.push('/auth/login'));
  }, [router]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.updateProfile({
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        phone: form.phone || undefined,
      }, token);
      setSuccess('Profil yeniləndi');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Yeniləmə uğursuz oldu');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Şifrə ən azı 8 simvol olmalıdır');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Şifrələr uyğun gəlmir');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setChangingPassword(true);
    try {
      await api.updateProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }, token);
      setPasswordSuccess('Şifrə dəyişdirildi');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Şifrə dəyişdirilmədi');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      api.logout(refreshToken).catch(() => {});
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/');
  };

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-400">Yüklənir...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Tənzimləmələr</h1>

      {/* Profile Section */}
      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-4">Profil məlumatları</h2>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">E-poçt</label>
            <input type="email" value={user?.email || ''} disabled
              className="w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500" />
            <p className="text-xs text-gray-400 mt-1">E-poçt ünvanı dəyişdirilə bilməz</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Ad</label>
              <input type="text" className="w-full border rounded-lg px-3 py-2.5 text-sm"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                placeholder="Adınız" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Soyad</label>
              <input type="text" className="w-full border rounded-lg px-3 py-2.5 text-sm"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                placeholder="Soyadınız" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Telefon</label>
            <input type="tel" className="w-full border rounded-lg px-3 py-2.5 text-sm"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+994XXXXXXXXX" />
          </div>

          <button type="submit" disabled={saving}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors">
            {saving ? 'Gözləyin...' : 'Yadda saxla'}
          </button>
        </form>
      </section>

      <hr className="my-8" />

      {/* Password Section */}
      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-4">Şifrəni dəyiş</h2>

        {passwordSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{passwordSuccess}</div>
        )}
        {passwordError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{passwordError}</div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Cari şifrə</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2.5 text-sm"
              value={passwordForm.currentPassword}
              onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
              required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Yeni şifrə</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2.5 text-sm"
              value={passwordForm.newPassword}
              onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
              required minLength={8} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Yeni şifrəni təsdiqləyin</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2.5 text-sm"
              value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
              required />
          </div>
          <button type="submit" disabled={changingPassword}
            className="bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors">
            {changingPassword ? 'Gözləyin...' : 'Şifrəni dəyiş'}
          </button>
        </form>
      </section>

      <hr className="my-8" />

      {/* Logout */}
      <section>
        <button onClick={handleLogout}
          className="text-red-600 hover:text-red-700 font-medium text-sm">
          Hesabdan çıx
        </button>
      </section>
    </div>
  );
}
