import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BoostService } from './boost.service';
import { RequestBoostDto } from './boost.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Boost')
@Controller('boost')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class BoostController {
  constructor(private boostService: BoostService) {}

  @Post('request')
  @ApiOperation({ summary: 'Request a featured boost for a listing' })
  async requestBoost(
    @CurrentUser('id') userId: string,
    @Body() dto: RequestBoostDto,
  ) {
    return { data: await this.boostService.requestBoost(userId, dto) };
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Get my boost requests' })
  async myRequests(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return { data: await this.boostService.getMyRequests(userId, page, limit) };
  }

  @Get('admin/pending')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] Get pending boost requests' })
  async adminPending(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return { data: await this.boostService.adminGetPending(page, limit) };
  }

  @Put('admin/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] Approve a boost request' })
  async approve(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.boostService.adminApprove(id, adminId);
  }

  @Put('admin/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[Admin] Reject a boost request' })
  async reject(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.boostService.adminReject(id, adminId);
  }
}
