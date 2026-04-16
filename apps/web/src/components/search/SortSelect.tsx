'use client';

export function SortSelect({ current }: { current?: string }) {
  const options = [
    { value: 'date_desc', label: 'Ən yeni' },
    { value: 'price_asc', label: 'Ucuz əvvəl' },
    { value: 'price_desc', label: 'Baha əvvəl' },
    { value: 'mileage_asc', label: 'Az yürüş' },
    { value: 'year_desc', label: 'Yeni il' },
  ];
  return (
    <form>
      <select name="sortBy" defaultValue={current || 'date_desc'}
        className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        onChange={(e) => {
          const url = new URL(window.location.href);
          url.searchParams.set('sortBy', e.target.value);
          window.location.href = url.toString();
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </form>
  );
}
