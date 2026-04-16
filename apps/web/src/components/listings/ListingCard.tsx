import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, formatMileage } from '@/lib/utils';

interface ListingCardProps {
  listing: {
    id: string;
    price: number;
    currency: string;
    year: number;
    mileage: number;
    fuelType: string;
    transmission: string;
    brandName: string;
    modelName: string;
    cityName: string;
    coverImageUrl: string | null;
    isFeatured: boolean;
    createdAt: string;
  };
}

const FUEL_LABELS: Record<string, string> = {
  PETROL: 'Benzin', DIESEL: 'Dizel', ELECTRIC: 'Elektrik', HYBRID: 'Hibrid', LPG: 'Qaz',
};
const TRANS_LABELS: Record<string, string> = {
  MANUAL: 'Mexaniki', AUTOMATIC: 'Avtomat', CVT: 'Variator', ROBOT: 'Robot',
};

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-100">
          {listing.coverImageUrl ? (
            <Image
              src={listing.coverImageUrl}
              alt={`${listing.brandName} ${listing.modelName}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
              Şəkil yoxdur
            </div>
          )}
          {listing.isFeatured && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded font-medium">
              VIP
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="text-red-600 font-bold text-lg leading-tight">
            {formatPrice(listing.price)} {listing.currency}
          </div>
          <div className="text-gray-900 font-medium text-sm mt-0.5">
            {listing.year} {listing.brandName} {listing.modelName}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5 flex-wrap">
            <span>{formatMileage(listing.mileage)}</span>
            <span>·</span>
            <span>{FUEL_LABELS[listing.fuelType] || listing.fuelType}</span>
            <span>·</span>
            <span>{TRANS_LABELS[listing.transmission] || listing.transmission}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1.5">{listing.cityName}</div>
        </div>
      </div>
    </Link>
  );
}
