'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditListingPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [listing, setListing] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);

  const [form, setForm] = useState({
    price: '',
    mileage: '',
    cityId: '',
    colorId: '',
    description: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/auth/login'); return; }

    Promise.all([
      api.getListing(id),
      api.getReferenceData(),
    ]).then(([l, ref]) => {
      setListing(l);
      setCities(ref.cities || []);
      setColors(ref.colors || []);
      setForm({
        price: String(l.price),
        mileage: String(l.mileage),
        cityId: String(l.cityId || ''),
        colorId: String(l.colorId || ''),
        description: l.description || '',
      });
    }).catch(() => router.push('/dashboard'));
  }, [id, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/auth/login'); return; }

    try {
      const data: any = {};
      if (form.price !== String(listing.price)) data.price = Number(form.price);
      if (form.mileage !== String(listing.mileage)) data.mileage = Number(form.mileage);
      if (form.cityId) data.cityId = Number(form.cityId);
      if (form.colorId) data.colorId = Number(form.colorId);
      if (form.description !== (listing.description || '')) data.description = form.description;

      if (Object.keys(data).length === 0) {
        router.push(`/listings/${id}`);
        return;
      }

      await api.updateListing(id, data, token);
      router.push(`/listings/${id}`);
    } catch (err: any) {
      setError(err.message || 'Yeniləmə uğursuz oldu');
    } finally {
      setLoading(false);
    }
  };

  if (!listing) return <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-400">Yüklənir...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Elanı redaktə et</h1>
      <p className="text-gray-500 text-sm mb-6">
        {listing.brandName} {listing.modelName} ({listing.year})
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>
      )}

      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Qiymət (AZN)</label>
            <input type="number" className="w-full border rounded-lg px-3 py-2.5 text-sm"
              value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Yürüş (km)</label>
            <input type="number" className="w-full border rounded-lg px-3 py-2.5 text-sm"
              value={form.mileage} onChange={e => setForm(f => ({ ...f, mileage: e.target.value }))} required />
            <p className="text-xs text-gray-400 mt-1">Yürüş yalnız artırıla bilər</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Şəhər</label>
            <select className="w-full border rounded-lg px-3 py-2.5 text-sm"
              value={form.cityId} onChange={e => setForm(f => ({ ...f, cityId: e.target.value }))}>
              <option value="">Seçin</option>
              {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Rəng</label>
            <select className="w-full border rounded-lg px-3 py-2.5 text-sm"
              value={form.colorId} onChange={e => setForm(f => ({ ...f, colorId: e.target.value }))}>
              <option value="">Seçin</option>
              {colors.map((c: any) => <option key={c.id} value={c.id}>{c.nameAz || c.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Açıqlama</label>
          <textarea className="w-full border rounded-lg px-3 py-2.5 text-sm min-h-[120px] resize-y"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            maxLength={5000} />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-3 rounded-lg font-semibold text-sm transition-colors">
            {loading ? 'Gözləyin...' : 'Yadda saxla'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 border rounded-lg text-sm hover:bg-gray-50">Ləğv et</button>
        </div>
      </form>
    </div>
  );
}
