'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface FilterSidebarProps {
  brands: Array<{ id: number; name: string }>;
  cities: Array<{ id: number; name: string }>;
  currentFilters: Record<string, string>;
}

const FUEL_TYPES = [
  { value: 'PETROL', label: 'Benzin' },
  { value: 'DIESEL', label: 'Dizel' },
  { value: 'ELECTRIC', label: 'Elektrik' },
  { value: 'HYBRID', label: 'Hibrid' },
  { value: 'LPG', label: 'Qaz' },
];

const TRANSMISSIONS = [
  { value: 'AUTOMATIC', label: 'Avtomat' },
  { value: 'MANUAL', label: 'Mexaniki' },
  { value: 'CVT', label: 'Variator' },
  { value: 'ROBOT', label: 'Robot' },
];

const BODY_TYPES = [
  { value: 'SEDAN', label: 'Sedan' },
  { value: 'SUV', label: 'SUV' },
  { value: 'HATCHBACK', label: 'Hetçbek' },
  { value: 'COUPE', label: 'Kupe' },
  { value: 'WAGON', label: 'Universal' },
  { value: 'VAN', label: 'Mikroavtobus' },
];

export function FilterSidebar({ brands, cities, currentFilters }: FilterSidebarProps) {
  const router = useRouter();
  const [filters, setFilters] = useState(currentFilters);

  const apply = (newFilters: Record<string, string>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(newFilters)) {
      if (v) params.set(k, v);
    }
    params.delete('page');
    router.push(`/listings?${params.toString()}`);
  };

  const set = (key: string, value: string) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    apply(updated);
  };

  const clear = () => {
    setFilters({});
    router.push('/listings');
  };

  return (
    <div className="space-y-5 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filtrlər</h3>
        {Object.values(filters).some(Boolean) && (
          <button onClick={clear} className="text-red-600 text-xs hover:underline">
            Təmizlə
          </button>
        )}
      </div>

      {/* Brand */}
      <FilterSection label="Marka">
        <select className="filter-select" value={filters.brandId || ''}
          onChange={e => set('brandId', e.target.value)}>
          <option value="">Hamısı</option>
          {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </FilterSection>

      {/* City */}
      <FilterSection label="Şəhər">
        <select className="filter-select" value={filters.cityId || ''}
          onChange={e => set('cityId', e.target.value)}>
          <option value="">Hamısı</option>
          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </FilterSection>

      {/* Price */}
      <FilterSection label="Qiymət (AZN)">
        <div className="flex gap-2">
          <input type="number" placeholder="Min" className="filter-input w-1/2"
            value={filters.priceMin || ''}
            onChange={e => set('priceMin', e.target.value)} />
          <input type="number" placeholder="Max" className="filter-input w-1/2"
            value={filters.priceMax || ''}
            onChange={e => set('priceMax', e.target.value)} />
        </div>
      </FilterSection>

      {/* Year */}
      <FilterSection label="İl">
        <div className="flex gap-2">
          <input type="number" placeholder="Min" className="filter-input w-1/2"
            value={filters.yearMin || ''}
            onChange={e => set('yearMin', e.target.value)} />
          <input type="number" placeholder="Max" className="filter-input w-1/2"
            value={filters.yearMax || ''}
            onChange={e => set('yearMax', e.target.value)} />
        </div>
      </FilterSection>

      {/* Mileage */}
      <FilterSection label="Max yürüş (km)">
        <input type="number" placeholder="məs. 100000" className="filter-input w-full"
          value={filters.mileageMax || ''}
          onChange={e => set('mileageMax', e.target.value)} />
      </FilterSection>

      {/* Fuel */}
      <FilterSection label="Yanacaq">
        <div className="space-y-1.5">
          {FUEL_TYPES.map(f => (
            <label key={f.value} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="fuelType" value={f.value}
                checked={filters.fuelType === f.value}
                onChange={e => set('fuelType', e.target.value)} />
              {f.label}
            </label>
          ))}
          {filters.fuelType && (
            <button onClick={() => set('fuelType', '')} className="text-xs text-gray-400 hover:text-gray-600">
              Ləğv et
            </button>
          )}
        </div>
      </FilterSection>

      {/* Transmission */}
      <FilterSection label="Sürətlər qutusu">
        <div className="space-y-1.5">
          {TRANSMISSIONS.map(t => (
            <label key={t.value} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="transmission" value={t.value}
                checked={filters.transmission === t.value}
                onChange={e => set('transmission', e.target.value)} />
              {t.label}
            </label>
          ))}
          {filters.transmission && (
            <button onClick={() => set('transmission', '')} className="text-xs text-gray-400 hover:text-gray-600">
              Ləğv et
            </button>
          )}
        </div>
      </FilterSection>

      {/* Body type */}
      <FilterSection label="Kuzov">
        <select className="filter-select" value={filters.bodyType || ''}
          onChange={e => set('bodyType', e.target.value)}>
          <option value="">Hamısı</option>
          {BODY_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
      </FilterSection>

      <style jsx>{`
        .filter-select { @apply w-full border border-gray-200 rounded px-2 py-1.5; }
        .filter-input  { @apply border border-gray-200 rounded px-2 py-1.5; }
      `}</style>
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</div>
      {children}
    </div>
  );
}
