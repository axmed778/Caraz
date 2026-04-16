import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ListingsModule } from './modules/listings/listings.module';
import { SearchModule } from './modules/search/search.module';
import { ImagesModule } from './modules/images/images.module';
import { DealersModule } from './modules/dealers/dealers.module';
import { ReferenceModule } from './modules/reference/reference.module';
import { VinModule } from './modules/vin/vin.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { BoostModule } from './modules/boost/boost.module';
import { AdminModule } from './modules/admin/admin.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    SearchModule,
    ImagesModule,
    DealersModule,
    ReferenceModule,
    VinModule,
    FavoritesModule,
    NotificationsModule,
    MessagingModule,
    BoostModule,
    AdminModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
