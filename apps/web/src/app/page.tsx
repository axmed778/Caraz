import { api } from '@/lib/api';
import { SearchBar } from '@/components/search/SearchBar';
import { ListingCard } from '@/components/listings/ListingCard';
import Link from 'next/link';

export default async function HomePage() {
  const [referenceData, featuredListings] = await Promise.all([
    api.getReferenceData().catch(() => ({ brands: [], cities: [], colors: [] })),
    api.getListings({ sortBy: 'date_desc', limit: 12 }).catch(() => ({ items: [] })),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">
            Azərbaycanda ən rahat avtomobil bazarı
          </h1>
          <p className="text-gray-400 mb-8 text-lg">
            {featuredListings?.total?.toLocaleString() ?? '0'} elan sizi gözləyir
          </p>
          <SearchBar brands={referenceData.brands} cities={referenceData.cities} />
        </div>
      </section>

      {/* Latest Listings */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Son elanlar</h2>
          <Link href="/listings" className="text-red-600 hover:text-red-700 font-medium">
            Hamısına bax →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {featuredListings?.items?.map((listing: any) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-red-600">10K+</div>
            <div className="text-gray-600 mt-1">Aktiv elan</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-red-600">5K+</div>
            <div className="text-gray-600 mt-1">Qeydiyyatlı istifadəçi</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-red-600">500+</div>
            <div className="text-gray-600 mt-1">Satıcı</div>
          </div>
        </div>
      </section>
    </div>
  );
}
