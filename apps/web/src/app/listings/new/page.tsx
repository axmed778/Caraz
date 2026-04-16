'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Brand { id: number; name: string; }
interface Model { id: number; name: string; }
interface City { id: number; name: string; }
interface Color { id: number; name: string; nameAz: string; hexCode: string; }

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

const DRIVE_TYPES = [
  { value: 'FWD', label: 'Ön ötürücü' },
  { value: 'RWD', label: 'Arxa ötürücü' },
  { value: 'AWD', label: 'Tam ötürücü' },
  { value: 'FOUR_WD', label: '4x4' },
];

const BODY_TYPES = [
  { value: 'SEDAN', label: 'Sedan' },
  { value: 'SUV', label: 'SUV' },
  { value: 'HATCHBACK', label: 'Hetçbek' },
  { value: 'COUPE', label: 'Kupe' },
  { value: 'WAGON', label: 'Universal' },
  { value: 'VAN', label: 'Mikroavtobus' },
  { value: 'TRUCK', label: 'Yük' },
  { value: 'CONVERTIBLE', label: 'Kabriolet' },
  { value: 'MINIVAN', label: 'Miniven' },
  { value: 'PICKUP', label: 'Pikap' },
];

export default function NewListingPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    brandId: '',
    modelId: '',
    year: '',
    price: '',
    mileage: '',
    fuelType: '',
    transmission: '',
    driveType: '',
    bodyType: '',
    colorId: '',
    engineVolume: '',
    horsepower: '',
    cityId: '',
    description: '',
    vin: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    api.getReferenceData().then((data: any) => {
      setBrands(data.brands || []);
      setCities(data.cities || []);
      setColors(data.colors || []);
    });
  }, [router]);

  // Load models when brand changes
  useEffect(() => {
    if (form.brandId) {
      api.getModels(Number(form.brandId)).then((data: any) => {
        setModels(data || []);
      });
    } else {
      setModels([]);
    }
    setForm(f => ({ ...f, modelId: '' }));
  }, [form.brandId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const total = imageFiles.length + files.length;
    if (total > 20) {
      setError('Maksimum 20 şəkil yükləyə bilərsiniz');
      return;
    }
    setImageFiles(prev => [...prev, ...files]);

    // Generate previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const set = (key: string, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      // Create listing
      const listingData: any = {
        brandId: Number(form.brandId),
        modelId: Number(form.modelId),
        year: Number(form.year),
        price: Number(form.price),
        mileage: Number(form.mileage),
        fuelType: form.fuelType,
        transmission: form.transmission,
        bodyType: form.bodyType,
        cityId: Number(form.cityId),
      };

      if (form.driveType) listingData.driveType = form.driveType;
      if (form.colorId) listingData.colorId = Number(form.colorId);
      if (form.engineVolume) listingData.engineVolume = Number(form.engineVolume);
      if (form.horsepower) listingData.horsepower = Number(form.horsepower);
      if (form.description) listingData.description = form.description;
      if (form.vin) listingData.vin = form.vin.toUpperCase();

      const listing = await api.createListing(listingData, token);

      // Upload images if any
      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach(file => formData.append('images', file));

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        await fetch(`${apiUrl}/listings/${listing.id}/images`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
      }

      router.push(`/listings/${listing.id}`);
    } catch (err: any) {
      setError(err.message || 'Elan yaradılmadı');
    } finally {
      setLoading(false);
    }
  };

  // Generate year options (2025 down to 1970)
  const years = Array.from({ length: 56 }, (_, i) => 2025 - i);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Yeni elan yerləşdir</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-8">
        {/* Car info */}
        <Section title="Avtomobil məlumatları">
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Marka *" value={form.brandId} onChange={v => set('brandId', v)}
              options={brands.map(b => ({ value: String(b.id), label: b.name }))} placeholder="Seçin" />

            <SelectField label="Model *" value={form.modelId} onChange={v => set('modelId', v)}
              options={models.map(m => ({ value: String(m.id), label: m.name }))} placeholder={form.brandId ? 'Seçin' : 'Əvvəlcə marka seçin'}
              disabled={!form.brandId} />

            <SelectField label="Buraxılış ili *" value={form.year} onChange={v => set('year', v)}
              options={years.map(y => ({ value: String(y), label: String(y) }))} placeholder="Seçin" />

            <SelectField label="Kuzov tipi *" value={form.bodyType} onChange={v => set('bodyType', v)}
              options={BODY_TYPES} placeholder="Seçin" />
          </div>
        </Section>

        {/* Engine & Transmission */}
        <Section title="Mühərrik və ötürücü">
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Yanacaq növü *" value={form.fuelType} onChange={v => set('fuelType', v)}
              options={FUEL_TYPES} placeholder="Seçin" />

            <SelectField label="Sürətlər qutusu *" value={form.transmission} onChange={v => set('transmission', v)}
              options={TRANSMISSIONS} placeholder="Seçin" />

            <SelectField label="Ötürücü" value={form.driveType} onChange={v => set('driveType', v)}
              options={DRIVE_TYPES} placeholder="Seçin (ixtiyari)" />

            <InputField label="Mühərrik həcmi (L)" type="number" step="0.1" value={form.engineVolume}
              onChange={v => set('engineVolume', v)} placeholder="məs. 2.0" />

            <InputField label="At gücü" type="number" value={form.horsepower}
              onChange={v => set('horsepower', v)} placeholder="məs. 150" />
          </div>
        </Section>

        {/* Price & Mileage */}
        <Section title="Qiymət və yürüş">
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Qiymət (AZN) *" type="number" value={form.price}
              onChange={v => set('price', v)} placeholder="məs. 25000" required />

            <InputField label="Yürüş (km) *" type="number" value={form.mileage}
              onChange={v => set('mileage', v)} placeholder="məs. 85000" required />
          </div>
        </Section>

        {/* Location & Color */}
        <Section title="Məkan və rəng">
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Şəhər *" value={form.cityId} onChange={v => set('cityId', v)}
              options={cities.map(c => ({ value: String(c.id), label: c.name }))} placeholder="Seçin" />

            <SelectField label="Rəng" value={form.colorId} onChange={v => set('colorId', v)}
              options={colors.map(c => ({ value: String(c.id), label: c.nameAz || c.name }))} placeholder="Seçin (ixtiyari)" />
          </div>
        </Section>

        {/* VIN */}
        <Section title="VIN (ixtiyari)">
          <InputField label="VIN nömrəsi" value={form.vin}
            onChange={v => set('vin', v)} placeholder="məs. WBA5A7C51GG123456"
            maxLength={17} />
          <p className="text-xs text-gray-400 mt-1">
            VIN daxil etmək elanınıza güvən əlavə edir. Alıcılar VIN tarixçəsini görə biləcək.
          </p>
        </Section>

        {/* Description */}
        <Section title="Açıqlama">
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm min-h-[120px] resize-y"
            placeholder="Avtomobiliniz haqqında ətraflı məlumat yazın..."
            value={form.description}
            onChange={e => set('description', e.target.value)}
            maxLength={5000}
          />
          <p className="text-xs text-gray-400 mt-1">{form.description.length}/5000</p>
        </Section>

        {/* Images */}
        <Section title="Şəkillər">
          <div className="space-y-3">
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-black/60 text-white w-6 h-6 rounded-full text-xs hover:bg-black/80">
                      X
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded">
                        Əsas
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-red-400 transition-colors">
              <input type="file" multiple accept="image/jpeg,image/png,image/webp"
                className="hidden" onChange={handleImageChange} />
              <div className="text-gray-500 text-sm">
                <div className="font-medium mb-1">Şəkil əlavə edin</div>
                <div className="text-xs">JPG, PNG, WebP. Maks 10MB. {imageFiles.length}/20 şəkil</div>
              </div>
            </label>
          </div>
        </Section>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-3 rounded-lg font-semibold transition-colors text-sm">
          {loading ? 'Gözləyin...' : 'Elanı yerləşdir'}
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-semibold text-gray-900 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder, disabled }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm disabled:bg-gray-50"
        value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        required={label.includes('*')}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, placeholder, required, step, maxLength }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; step?: string; maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <input type={type} step={step} maxLength={maxLength}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required || label.includes('*')} />
    </div>
  );
}
