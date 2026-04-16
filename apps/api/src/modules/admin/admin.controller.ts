import {
  Controller, Get, Put, Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AdminService } from './admin.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';

class ResolveAnomalyDto {
  @IsEnum(['CONFIRMED_FRAUD', 'FALSE_POSITIVE'])
  resolution: 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE';
}

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform overview stats' })
  async getStats() {
    return { data: await this.adminService.getStats() };
  }

  // ─── Users ───────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List users' })
  async getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return { data: await this.adminService.getUsers(page, limit, search) };
  }

  @Put('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user and their active listings' })
  async suspendUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.suspendUser(id);
  }

  @Put('users/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a suspended user' })
  async reactivateUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.reactivateUser(id);
  }

  // ─── Listings ────────────────────────────────────────────

  @Get('listings')
  @ApiOperation({ summary: 'List all listings' })
  @ApiQuery({ name: 'status', required: false })
  async getListings(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return { data: await this.adminService.getListings(page, limit, status) };
  }

  @Put('listings/:id/suspend')
  @ApiOperation({ summary: 'Suspend a listing' })
  async suspendListing(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.suspendListing(id);
  }

  @Put('listings/:id/activate')
  @ApiOperation({ summary: 'Activate a listing' })
  async activateListing(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.activateListing(id);
  }

  @Put('listings/:id/feature')
  @ApiOperation({ summary: 'Manually feature a listing for N days' })
  async featureListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('days') days = 7,
  ) {
    return this.adminService.featureListing(id, Number(days));
  }

  // ─── Dealers ─────────────────────────────────────────────

  @Get('dealers')
  @ApiOperation({ summary: 'List dealers' })
  async getDealers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return { data: await this.adminService.getDealers(page, limit) };
  }

  @Put('dealers/:id/verify')
  @ApiOperation({ summary: 'Verify a dealer' })
  async verifyDealer(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.verifyDealer(id);
  }

  // ─── Anomalies ───────────────────────────────────────────

  @Get('anomalies')
  @ApiOperation({ summary: 'List VIN anomalies' })
  @ApiQuery({ name: 'resolved', required: false, type: Boolean })
  async getAnomalies(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('resolved') resolved?: string,
  ) {
    const resolvedBool = resolved === undefined ? undefined : resolved === 'true';
    return { data: await this.adminService.getAnomalies(page, limit, resolvedBool) };
  }

  @Put('anomalies/:id/resolve')
  @ApiOperation({ summary: 'Resolve a VIN anomaly' })
  async resolveAnomaly(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveAnomalyDto,
  ) {
    return this.adminService.resolveAnomaly(id, dto.resolution);
  }
}
