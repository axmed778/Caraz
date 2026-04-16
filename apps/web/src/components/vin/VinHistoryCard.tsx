import { formatPrice } from '@/lib/utils';

interface VinHistoryCardProps {
  vin: string;
  history: any;
}

export function VinHistoryCard({ vin, history }: VinHistoryCardProps) {
  if (!history) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4">
        <div className="text-green-700 font-medium text-sm">İlk dəfə CarAZ-da yerləşdirilir</div>
        <div className="text-green-600 text-xs mt-0.5">VIN: {vin}</div>
      </div>
    );
  }

  const isClean = !history.hasRollbackAnomaly && history.totalListings === 1;
  const isSuspicious = history.hasRollbackAnomaly;

  return (
    <div className={`border rounded-lg p-4 ${
      isSuspicious ? 'border-red-200 bg-red-50' :
      isClean ? 'border-green-200 bg-green-50' :
      'border-yellow-200 bg-yellow-50'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className={`font-semibold text-sm ${
            isSuspicious ? 'text-red-700' : isClean ? 'text-green-700' : 'text-yellow-700'
          }`}>
            {isSuspicious ? '⚠️ Maşın tarixçəsində uyğunsuzluq var' :
             isClean ? '✓ İlk dəfə yerləşdirilir' :
             'ℹ️ Əvvəlki elan tarixçəsi'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">VIN: {vin}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs mb-4">
        <div>
          <div className="text-gray-500">Cəmi elan sayı</div>
          <div className="font-semibold">{history.totalListings}</div>
        </div>
        <div>
          <div className="text-gray-500">Bazarda olduğu gün</div>
          <div className="font-semibold">{history.totalDaysOnMarket}</div>
        </div>
        {history.lowestPrice && (
          <div>
            <div className="text-gray-500">Ən aşağı qiymət</div>
            <div className="font-semibold text-red-600">{formatPrice(history.lowestPrice)} AZN</div>
          </div>
        )}
      </div>

      {history.hasRollbackAnomaly && (
        <div className="bg-red-100 border border-red-200 rounded p-2 mb-3 text-xs text-red-700">
          Spidometrdə azalma aşkar edilib — mümkün saxtakarlıq
        </div>
      )}

      {history.listings.length > 0 && (
        <div className="space-y-2">
          {history.listings.map((entry: any, i: number) => (
            <div key={i} className="text-xs border-l-2 border-gray-300 pl-2">
              <div className="font-medium">
                {formatPrice(entry.listedPrice)} AZN
                {entry.finalPrice && entry.finalPrice !== entry.listedPrice && (
                  <span className="text-gray-500"> → {formatPrice(entry.finalPrice)} AZN</span>
                )}
              </div>
              <div className="text-gray-500">
                {new Date(entry.listedAt).toLocaleDateString('az-AZ')}
                {entry.daysListed ? ` · ${entry.daysListed} gün` : ' · Aktiv elan'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
