// ─── Auth ────────────────────────────────────────────────

export interface RegisterDto {
  email: string;
  password: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: 'USER' | 'DEALER' | 'ADMIN';
}

// ─── Listings ────────────────────────────────────────────

export interface CreateListingDto {
  brandId: number;
  modelId: number;
  year: number;
  price: number;
  currency?: string;
  mileage: number;
  fuelType: FuelType;
  transmission: Transmission;
  driveType?: DriveType;
  bodyType: BodyType;
  colorId?: number;
  engineVolume?: number;
  horsepower?: number;
  cityId: number;
  description?: string;
  vin?: string;
}

export interface UpdateListingDto extends Partial<CreateListingDto> {}

export interface ListingFilters {
  brandId?: number;
  modelId?: number;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  fuelType?: FuelType;
  transmission?: Transmission;
  bodyType?: BodyType;
  cityId?: number;
  query?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc' | 'mileage_asc' | 'year_desc';
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
}

// ─── Listing response (what the API returns) ────────────

export interface ListingCard {
  id: string;
  price: number;
  currency: string;
  year: number;
  mileage: number;
  fuelType: FuelType;
  transmission: Transmission;
  brandName: string;
  modelName: string;
  cityName: string;
  coverImageUrl: string | null;
  isFeatured: boolean;
  createdAt: string;
}

export interface ListingDetail extends ListingCard {
  driveType: DriveType | null;
  bodyType: BodyType;
  colorName: string | null;
  colorHex: string | null;
  engineVolume: number | null;
  horsepower: number | null;
  description: string | null;
  vin: string | null;
  views: number;
  images: ListingImageDto[];
  seller: SellerInfo;
  vinHistory: VinHistoryBrief | null;
}

export interface ListingImageDto {
  id: string;
  urlOriginal: string;
  urlThumb: string | null;
  urlMedium: string | null;
  urlLarge: string | null;
  sortOrder: number;
  isCover: boolean;
}

export interface SellerInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  dealer: DealerBrief | null;
}

export interface DealerBrief {
  id: string;
  name: string;
  logoUrl: string | null;
  isVerified: boolean;
}

// ─── VIN History ─────────────────────────────────────────

export interface VinHistoryBrief {
  vin: string;
  totalListings: number;
  totalDaysOnMarket: number;
  lowestPrice: number | null;
  highestRecordedMileage: number | null;
  hasRollbackAnomaly: boolean;
  listings: VinListingEntry[];
  mileageTimeline: MileageEntry[];
}

export interface VinListingEntry {
  listedPrice: number;
  finalPrice: number | null;
  listedMileage: number;
  listedAt: string;
  delistedAt: string | null;
  daysListed: number | null;
  isCurrentListing: boolean;
}

export interface MileageEntry {
  recordedMileage: number;
  recordedAt: string;
  source: string;
}

// ─── Dealers ─────────────────────────────────────────────

export interface CreateDealerDto {
  name: string;
  description?: string;
  address?: string;
  cityId?: number;
  phone?: string;
  website?: string;
}

// ─── Reference Data ──────────────────────────────────────

export interface BrandDto {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  modelCount: number;
}

export interface ModelDto {
  id: number;
  brandId: number;
  name: string;
  slug: string;
}

export interface CityDto {
  id: number;
  name: string;
  nameAz: string;
  region: string | null;
}

export interface ColorDto {
  id: number;
  name: string;
  nameAz: string;
  hexCode: string;
}

// ─── Enums (mirrored from Prisma for frontend use) ──────

export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'LPG';
export type Transmission = 'MANUAL' | 'AUTOMATIC' | 'CVT' | 'ROBOT';
export type DriveType = 'FWD' | 'RWD' | 'AWD' | 'FOUR_WD';
export type BodyType = 'SEDAN' | 'SUV' | 'HATCHBACK' | 'COUPE' | 'WAGON' | 'VAN' | 'TRUCK' | 'CONVERTIBLE' | 'MINIVAN' | 'PICKUP';
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'SOLD' | 'DELETED' | 'SUSPENDED';

// ─── API Response Wrapper ────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}
