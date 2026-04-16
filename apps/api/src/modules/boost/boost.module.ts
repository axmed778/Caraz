import { Module } from '@nestjs/common';
import { BoostController } from './boost.controller';
import { BoostService } from './boost.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [BoostController],
  providers: [BoostService],
  exports: [BoostService],
})
export class BoostModule {}
