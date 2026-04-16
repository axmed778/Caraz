import { Module } from '@nestjs/common';
import { VinService } from './vin.service';
import { VinController } from './vin.controller';

@Module({
  controllers: [VinController],
  providers: [VinService],
  exports: [VinService],
})
export class VinModule {}
