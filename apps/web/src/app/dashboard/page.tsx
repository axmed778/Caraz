'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ListingCard } from '@/components/listings/ListingCard';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState<any>({ items: [], total: 0 });
  const [stats, setStats] = useState({ unreadMessages: 0, savedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/auth/login'); return; }

    Promise.all([
      api.getMe(token).catch(() => null),
      api.getMyListings(token, page).catch(() => ({ items: [], total: 0 })),
      api.getUnreadMessageCount(token).catch(() => ({ count: 0 })),
      api.getFavorites(token, 1).catch(() => ({ total: 0 })),
    ]).then(([me, myListings, unread, favs]) => {
      if (!me) { router.push('/auth/login'); return; }
      setUser(me);
      setListings(myListings);
      setStats({ unreadMessages: unread.count, savedCount: favs.total });
      setLoading(false);
    });
  }, [router, page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Elanı silmək istəyirsiniz?')) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    await api.deleteListing(id, token);
    setListings((prev: any) => ({
      ...prev,
      items: prev.items.filter((l: any) => l.id !== id),
      total: prev.total - 1,
    }));
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400">Yüklənir...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            Salam, {user?.profile?.firstName || user?.email?.split('@')[0]}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
        </div>
        <Link href="/listings/new"
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors">
          + Yeni elan
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Elanlarım" value={listings.total} href="/dashboard" />
        <StatCard label="Sevimlilər" value={stats.savedCount} href="/favorites" />
        <StatCard label="Mesajlar" value={stats.unreadMessages} href="/messages" badge />
        <StatCard label="Profil" value="→" href="/settings" />
      </div>

      {/* My Listings */}
      <div className="mb-6">
        <h2 className="font-semibold text-lg mb-4">Elanlarım ({listings.total})</h2>
        {listings.items.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-3">Hələ heç bir elan yoxdur</p>
            <Link href="/listings/new" className="text-red-600 hover:underline font-medium">
              İlk elanınızı yerləşdirin
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.items.map((listing: any) => (
              <div key={listing.id} className="flex items-center gap-4 border rounded-lg p-3 hover:bg-gray-50">
                <div className="w-24 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {listing.coverImageUrl ? (
                    <img src={listing.coverImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Şəkil yox</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/listings/${listing.id}`} className="font-medium text-sm hover:text-red-600">
                    {listing.brandName} {listing.modelName} ({listing.year})
                  </Link>
                  <p className="text-red-600 font-semibold text-sm">{Number(listing.price).toLocaleString()} {listing.currency}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/listings/${listing.id}/edit`}
                    className="text-xs border rounded px-3 py-1.5 hover:bg-gray-100">Redaktə</Link>
                  <button onClick={() => handleDelete(listing.id)}
                    className="text-xs border border-red-200 text-red-600 rounded px-3 py-1.5 hover:bg-red-50">Sil</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {listings.hasNextPage && (
          <button onClick={() => setPage(p => p + 1)}
            className="mt-4 text-sm text-red-600 hover:underline">Daha çox göstər</button>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, href, badge }: { label: string; value: any; href: string; badge?: boolean }) {
  return (
    <Link href={href} className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-xl font-bold mt-1 flex items-center gap-2">
        {value}
        {badge && Number(value) > 0 && (
          <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">yeni</span>
        )}
      </div>
    </Link>
  );
}
