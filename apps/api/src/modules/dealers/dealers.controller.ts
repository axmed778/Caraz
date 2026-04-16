import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DealersService } from './dealers.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Dealers')
@Controller('dealers')
export class DealersController {
  constructor(private dealersService: DealersService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create dealer profile' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: { name: string; description?: string; address?: string; cityId?: number; phone?: string; website?: string },
  ) {
    return { data: await this.dealersService.create(userId, dto) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dealer profile' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return { data: await this.dealersService.findById(id) };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update dealer profile' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return { data: await this.dealersService.update(id, userId, dto) };
  }

  @Get(':id/listings')
  @ApiOperation({ summary: 'Get dealer listings' })
  async getDealerListings(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return { data: await this.dealersService.getDealerListings(id, page, limit) };
  }
}
