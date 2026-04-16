import { api } from '@/lib/api';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { VinHistoryCard } from '@/components/vin/VinHistoryCard';
import { formatPrice, formatMileage } from '@/lib/utils';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await api.getListing(id).catch(() => null);
  if (!listing) return { title: 'Elan tapılmadı' };
  return {
    title: `${listing.year} ${listing.brandName} ${listing.modelName} — ${formatPrice(listing.price)} ${listing.currency}`,
    description: listing.description?.slice(0, 160),
  };
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const listing = await api.getListing(id).catch(() => null);

  if (!listing) redirect('/listings');

  const specs = [
    { label: 'Buraxılış ili', value: listing.year },
    { label: 'Yürüş', value: formatMileage(listing.mileage) },
    { label: 'Yanacaq', value: fuelTypeLabel(listing.fuelType) },
    { label: 'Sürətlər qutusu', value: transmissionLabel(listing.transmission) },
    { label: 'Ötürücü', value: driveTypeLabel(listing.driveType) },
    { label: 'Kuzov', value: bodyTypeLabel(listing.bodyType) },
    { label: 'Mühərrik', value: listing.engineVolume ? `${listing.engineVolume}L` : null },
    { label: 'At gücü', value: listing.horsepower ? `${listing.horsepower} a.g.` : null },
    { label: 'Rəng', value: listing.colorName },
    { label: 'Şəhər', value: listing.cityName },
  ].filter(s => s.value);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Images + Specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image gallery */}
          <div className="space-y-2">
            {listing.images?.length > 0 ? (
              <>
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={listing.images[0].urlLarge || listing.images[0].urlMedium || listing.images[0].urlOriginal}
                    alt={`${listing.brandName} ${listing.modelName}`}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                </div>
                {listing.images.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {listing.images.slice(1, 6).map((img: any) => (
                      <div key={img.id} className="relative aspect-square rounded overflow-hidden bg-gray-100">
                        <Image
                          src={img.urlThumb || img.urlMedium}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="20vw"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                Şəkil yoxdur
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold">
              {listing.year} {listing.brandName} {listing.modelName}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{listing.cityName}</p>
          </div>

          {/* Specs grid */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-y divide-gray-200">
              {specs.map((spec, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="text-xs text-gray-500 mb-0.5">{spec.label}</div>
                  <div className="font-medium text-sm">{spec.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div>
              <h2 className="font-semibold mb-2">Açıqlama</h2>
              <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                {listing.description}
              </p>
            </div>
          )}

          {/* VIN History */}
          {listing.vin && (
            <VinHistoryCard vin={listing.vin} history={listing.vinHistory} />
          )}
        </div>

        {/* Right: Price + Contact */}
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-5 sticky top-4">
            <div className="text-3xl font-bold text-red-600 mb-1">
              {formatPrice(listing.price)} {listing.currency}
            </div>
            <p className="text-xs text-gray-400 mb-6">
              {new Date(listing.createdAt).toLocaleDateString('az-AZ')} tarixində yerləşdirilib
            </p>

            {/* Seller info */}
            <div className="border-t border-gray-100 pt-4 mb-4">
              {listing.seller?.dealer ? (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Satıcı (Salon)</div>
                  <div className="font-medium">{listing.seller.dealer.name}</div>
                  {listing.seller.dealer.isVerified && (
                    <span className="text-xs text-green-600 font-medium">Təsdiqlənmiş salon</span>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Satıcı (Şəxsi)</div>
                  <div className="font-medium">
                    {listing.seller?.firstName} {listing.seller?.lastName}
                  </div>
                </div>
              )}
            </div>

            {/* Phone — shown to logged-in users via client component */}
            {listing.seller?.phone && (
              <a
                href={`tel:${listing.seller.phone}`}
                className="block w-full bg-red-600 hover:bg-red-700 text-white text-center py-3 rounded-lg font-semibold transition-colors"
              >
                Zəng et
              </a>
            )}

            <div className="text-center text-xs text-gray-400 mt-3">
              {listing.views.toLocaleString()} baxış
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function fuelTypeLabel(v: string) {
  const m: Record<string, string> = { PETROL: 'Benzin', DIESEL: 'Dizel', ELECTRIC: 'Elektrik', HYBRID: 'Hibrid', LPG: 'Qaz' };
  return m[v] || v;
}
function transmissionLabel(v: string) {
  const m: Record<string, string> = { MANUAL: 'Mexaniki', AUTOMATIC: 'Avtomat', CVT: 'Variator', ROBOT: 'Robot' };
  return m[v] || v;
}
function driveTypeLabel(v?: string) {
  if (!v) return null;
  const m: Record<string, string> = { FWD: 'Ön', RWD: 'Arxa', AWD: 'Tam', FOUR_WD: '4x4' };
  return m[v] || v;
}
function bodyTypeLabel(v: string) {
  const m: Record<string, string> = { SEDAN: 'Sedan', SUV: 'SUV', HATCHBACK: 'Hetçbek', COUPE: 'Kupe', WAGON: 'Universal', VAN: 'Mikroavtobus', TRUCK: 'Yük', CONVERTIBLE: 'Kabriolet', MINIVAN: 'Miniven', PICKUP: 'Pikap' };
  return m[v] || v;
}
