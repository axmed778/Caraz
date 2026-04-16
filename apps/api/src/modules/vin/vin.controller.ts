import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VinService } from './vin.service';

@ApiTags('VIN')
@Controller('vin')
export class VinController {
  constructor(private vinService: VinService) {}

  @Get(':vin/history')
  @ApiOperation({ summary: 'Get VIN history' })
  async getHistory(@Param('vin') vin: string) {
    const history = await this.vinService.getVinHistory(vin.toUpperCase());
    return { data: history };
  }
}
