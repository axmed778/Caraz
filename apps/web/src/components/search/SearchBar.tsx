'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildSearchParams } from '@/lib/utils';

interface SearchBarProps {
  brands: Array<{ id: number; name: string }>;
  cities: Array<{ id: number; name: string }>;
}

export function SearchBar({ brands, cities }: SearchBarProps) {
  const router = useRouter();
  const [filters, setFilters] = useState({
    brandId: '', cityId: '', priceMin: '', priceMax: '',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = buildSearchParams(filters);
    router.push(`/listings?${qs}`);
  };

  return (
    <form onSubmit={handleSearch} className="bg-white rounded-xl p-4 shadow-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <select
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 w-full"
          value={filters.brandId}
          onChange={e => setFilters(f => ({ ...f, brandId: e.target.value }))}
        >
          <option value="">Marka</option>
          {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        <select
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 w-full"
          value={filters.cityId}
          onChange={e => setFilters(f => ({ ...f, cityId: e.target.value }))}
        >
          <option value="">Şəhər</option>
          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <input
          type="number"
          placeholder="Min qiymət"
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm w-full"
          value={filters.priceMin}
          onChange={e => setFilters(f => ({ ...f, priceMin: e.target.value }))}
        />

        <input
          type="number"
          placeholder="Max qiymət"
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm w-full"
          value={filters.priceMax}
          onChange={e => setFilters(f => ({ ...f, priceMax: e.target.value }))}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
      >
        Axtar
      </button>
    </form>
  );
}
