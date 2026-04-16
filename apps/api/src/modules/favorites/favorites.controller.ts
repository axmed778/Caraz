import {
  Controller, Get, Post, Delete,
  Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Favorites')
@Controller('favorites')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get saved listings' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return { data: await this.favoritesService.findAll(userId, page, limit) };
  }

  @Post(':listingId')
  @ApiOperation({ summary: 'Save a listing' })
  async save(
    @CurrentUser('id') userId: string,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ) {
    return this.favoritesService.save(userId, listingId);
  }

  @Delete(':listingId')
  @ApiOperation({ summary: 'Unsave a listing' })
  async unsave(
    @CurrentUser('id') userId: string,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ) {
    return this.favoritesService.unsave(userId, listingId);
  }

  @Get(':listingId/check')
  @ApiOperation({ summary: 'Check if a listing is saved' })
  async check(
    @CurrentUser('id') userId: string,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ) {
    return { saved: await this.favoritesService.isSaved(userId, listingId) };
  }
}
