import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { CreateListingBodyDto, UpdateListingBodyDto, ListingQueryDto } from './listings.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private listingsService: ListingsService) {}

  @Get()
  @ApiOperation({ summary: 'Search and filter listings' })
  async findAll(@Query() query: ListingQueryDto) {
    return { data: await this.listingsService.findAll(query) };
  }

  @Get('user/me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user listings' })
  async myListings(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return { data: await this.listingsService.findByUser(userId, page, limit) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get listing by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return { data: await this.listingsService.findOne(id) };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new listing' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateListingBodyDto,
  ) {
    return { data: await this.listingsService.create(userId, dto) };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a listing' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateListingBodyDto,
  ) {
    return { data: await this.listingsService.update(id, userId, dto) };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a listing (soft delete)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.listingsService.remove(id, userId);
  }
}
