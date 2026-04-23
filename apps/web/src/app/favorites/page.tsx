'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<any>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/auth/login'); return; }

    api.getFavorites(token).then(setFavorites).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  const handleUnsave = async (listingId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    await api.unsaveListing(listingId, token);
    setFavorites((prev: any) => ({
      ...prev,
      items: prev.items.filter((f: any) => f.listing.id !== listingId),
      total: prev.total - 1,
    }));
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400">Yüklənir...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Sevimlilər ({favorites.total})</h1>

      {favorites.items.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-3">Hələ heç bir sevimli elan yoxdur</p>
          <Link href="/listings" className="text-red-600 hover:underline font-medium">Elanları axtarın</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.items.map((fav: any) => {
            const l = fav.listing;
            return (
              <div key={l.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <Link href={`/listings/${l.id}`}>
                  <div className="aspect-video bg-gray-100">
                    {l.coverImageUrl ? (
                      <img src={l.coverImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Şəkil yox</div>
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <Link href={`/listings/${l.id}`} className="font-medium text-sm hover:text-red-600">
                    {l.brandName} {l.modelName} ({l.year})
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-red-600 font-bold">{Number(l.price).toLocaleString()} {l.currency}</span>
                    <button onClick={() => handleUnsave(l.id)}
                      className="text-xs text-gray-400 hover:text-red-600">Sil</button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {Number(l.mileage).toLocaleString()} km · {l.cityName}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
