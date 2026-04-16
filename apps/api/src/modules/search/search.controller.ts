import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search listings with filters' })
  async search(@Query() query: Record<string, any>) {
    return { data: await this.searchService.search(query) };
  }

  @Get('counts')
  @ApiOperation({ summary: 'Get filter result counts (for UI facets)' })
  async counts(@Query() query: Record<string, any>) {
    return { data: await this.searchService.getFilterCounts(query) };
  }
}
