import {
  Controller, Get, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Public platform overview stats' })
  async overview() {
    return { data: await this.analyticsService.getPublicOverview() };
  }

  @Get('price-stats')
  @ApiOperation({ summary: 'Price stats for a brand/model (min, max, avg)' })
  @ApiQuery({ name: 'brandId', required: false, type: Number })
  @ApiQuery({ name: 'modelId', required: false, type: Number })
  async priceStats(
    @Query('brandId') brandId?: string,
    @Query('modelId') modelId?: string,
  ) {
    return {
      data: await this.analyticsService.getPriceStats(
        brandId ? Number(brandId) : undefined,
        modelId ? Number(modelId) : undefined,
      ),
    };
  }

  @Get('market-trends')
  @ApiOperation({ summary: 'Monthly price trends for last 6 months' })
  @ApiQuery({ name: 'brandId', required: false, type: Number })
  @ApiQuery({ name: 'modelId', required: false, type: Number })
  async marketTrends(
    @Query('brandId') brandId?: string,
    @Query('modelId') modelId?: string,
  ) {
    return {
      data: await this.analyticsService.getMarketTrends(
        brandId ? Number(brandId) : undefined,
        modelId ? Number(modelId) : undefined,
      ),
    };
  }

  @Get('listings/:id/stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get stats for your own listing (views, saves, conversations)" })
  async listingStats(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.analyticsService.getListingStats(id, userId);
    if (!data) return { data: null };
    return { data };
  }
}
