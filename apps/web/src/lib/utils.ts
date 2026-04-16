export function formatPrice(price: number): string {
  return new Intl.NumberFormat('az-AZ').format(price);
}

export function formatMileage(mileage: number): string {
  return `${new Intl.NumberFormat('az-AZ').format(mileage)} km`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function buildSearchParams(filters: Record<string, any>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value != null && value !== '') {
      params.set(key, String(value));
    }
  }
  return params.toString();
}
