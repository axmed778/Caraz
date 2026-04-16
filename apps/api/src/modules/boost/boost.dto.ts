import { IsUUID, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BoostDuration } from '@caraz/database';

export class RequestBoostDto {
  @ApiProperty()
  @IsUUID()
  listingId: string;

  @ApiProperty({ enum: BoostDuration, description: 'DAYS_7 = 5 AZN, DAYS_14 = 9 AZN, DAYS_30 = 18 AZN' })
  @IsEnum(BoostDuration)
  duration: BoostDuration;

  @ApiPropertyOptional({ description: 'Bank transfer receipt or note for admin' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  paymentNote?: string;
}
