import { api } from '@/lib/api';
import { ListingCard } from '@/components/listings/ListingCard';
import { FilterSidebar } from '@/components/search/FilterSidebar';
import { SortSelect } from '@/components/search/SortSelect';
import { Pagination } from '@/components/ui/Pagination';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Avtomobillər' };

interface Props {
  searchParams: Promise<Record<string, string>>;
}

export default async function ListingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [referenceData, results] = await Promise.all([
    api.getReferenceData().catch(() => ({ brands: [], cities: [], colors: [] })),
    api.getListings({ ...params, page }).catch(() => ({ items: [], total: 0, hasNextPage: false })),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <FilterSidebar
            brands={referenceData.brands}
            cities={referenceData.cities}
            currentFilters={params}
          />
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">
              <span className="font-semibold text-gray-900">{results.total?.toLocaleString()}</span> elan tapıldı
            </p>
            <SortSelect current={params.sortBy} />
          </div>

          {results.items?.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg">Heç bir elan tapılmadı</p>
              <p className="text-sm mt-2">Filtrləri dəyişdirərək yenidən cəhd edin</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.items?.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <Pagination
            currentPage={page}
            hasNextPage={results.hasNextPage}
            total={results.total}
            limit={20}
            params={params}
          />
        </div>
      </div>
    </div>
  );
}
