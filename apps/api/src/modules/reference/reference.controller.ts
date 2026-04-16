import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReferenceService } from './reference.service';

@ApiTags('Reference')
@Controller('reference')
export class ReferenceController {
  constructor(private referenceService: ReferenceService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reference data (brands, cities, colors) in one request' })
  async getAll() {
    return { data: await this.referenceService.getAll() };
  }

  @Get('brands')
  async getBrands() {
    return { data: await this.referenceService.getBrands() };
  }

  @Get('models')
  async getModels(@Query('brandId') brandId?: string) {
    return { data: await this.referenceService.getModels(brandId ? Number(brandId) : undefined) };
  }

  @Get('cities')
  async getCities() {
    return { data: await this.referenceService.getCities() };
  }

  @Get('colors')
  async getColors() {
    return { data: await this.referenceService.getColors() };
  }
}
