'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Props {
  params: Promise<{ id: string }>;
}

export default function DealerPage({ params }: Props) {
  const { id } = use(params);
  const [dealer, setDealer] = useState<any>(null);
  const [listings, setListings] = useState<any>({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDealer(id),
      api.getDealerListings(id, page),
    ]).then(([d, l]) => {
      setDealer(d);
      setListings(l);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id, page]);

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400">Yuklanir...</div>;
  if (!dealer) return <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400">Diler tapilmadi</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Dealer header */}
      <div className="border rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-2xl font-bold text-gray-400 flex-shrink-0">
            {dealer.companyName?.[0]?.toUpperCase() || 'D'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{dealer.companyName}</h1>
              {dealer.verified && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  Təsdiqlənib
                </span>
              )}
            </div>
            {dealer.description && (
              <p className="text-gray-600 text-sm mt-2">{dealer.description}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              {dealer.address && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {dealer.address}
                </span>
              )}
              {dealer.phone && (
                <a href={`tel:${dealer.phone}`} className="flex items-center gap-1 hover:text-red-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {dealer.phone}
                </a>
              )}
              {dealer.website && (
                <a href={dealer.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-red-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Vebsayt
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dealer listings */}
      <h2 className="font-semibold text-lg mb-4">Elanlar ({listings.total})</h2>

      {listings.items.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Bu dilerin hələ elanı yoxdur</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.items.map((l: any) => (
              <Link key={l.id} href={`/listings/${l.id}`}
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gray-100">
                  {l.coverImageUrl ? (
                    <img src={l.coverImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Şəkil yox</div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm">
                    {l.brandName} {l.modelName} ({l.year})
                  </p>
                  <p className="text-red-600 font-bold mt-1">{Number(l.price).toLocaleString()} {l.currency}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {Number(l.mileage).toLocaleString()} km · {l.cityName}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {listings.hasNextPage && (
            <div className="text-center mt-6">
              <button onClick={() => setPage(p => p + 1)}
                className="text-sm text-red-600 hover:underline">Daha çox göstər</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
