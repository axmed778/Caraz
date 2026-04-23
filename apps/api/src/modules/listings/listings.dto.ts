import {
  IsInt, IsNumber, IsString, IsOptional, IsEnum,
  Min, Max, MinLength, MaxLength, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FuelType, Transmission, DriveType, BodyType } from '@prisma/client';

export class CreateListingBodyDto {
  @ApiProperty() @IsInt() brandId: number;
  @ApiProperty() @IsInt() modelId: number;
  @ApiProperty() @IsInt() @Min(1900) @Max(2030) year: number;
  @ApiProperty() @IsNumber() @Min(0) price: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiProperty() @IsInt() @Min(0) mileage: number;
  @ApiProperty({ enum: FuelType }) @IsEnum(FuelType) fuelType: FuelType;
  @ApiProperty({ enum: Transmission }) @IsEnum(Transmission) transmission: Transmission;
  @ApiPropertyOptional({ enum: DriveType }) @IsOptional() @IsEnum(DriveType) driveType?: DriveType;
  @ApiProperty({ enum: BodyType }) @IsEnum(BodyType) bodyType: BodyType;
  @ApiPropertyOptional() @IsOptional() @IsInt() colorId?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() engineVolume?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() horsepower?: number;
  @ApiProperty() @IsInt() cityId: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(/^[A-HJ-NPR-Z0-9]{17}$/, { message: 'Invalid VIN format' }) vin?: string;
}

export class UpdateListingBodyDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) price?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) mileage?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() cityId?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() colorId?: number;
}

export class ListingQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() brandId?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() modelId?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() yearMin?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() yearMax?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() priceMin?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() priceMax?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() mileageMax?: number;
  @ApiPropertyOptional({ enum: FuelType }) @IsOptional() @IsEnum(FuelType) fuelType?: FuelType;
  @ApiPropertyOptional({ enum: Transmission }) @IsOptional() @IsEnum(Transmission) transmission?: Transmission;
  @ApiPropertyOptional({ enum: BodyType }) @IsOptional() @IsEnum(BodyType) bodyType?: BodyType;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() cityId?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() query?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sortBy?: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
