import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransportModule } from './transport/transport.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DashboardModule } from './dashboard/dashboard.module';
import { StudentsModule } from './students/students.module';
import { RfidModule } from './rfid/rfid.module';
import { BusesModule } from './buses/buses.module';
import { DevicesModule } from './devices/devices.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { LocationModule } from './location/location.module';
import { RoutesModule } from './routes/routes.module';
import { RouteSchedulesModule } from './route-schedules/route-schedules.module';
import { ConfirmationsModule } from './confirmations/confirmations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationPromptsModule } from './notification-prompts/notification-prompts.module';
import { GroupsModule } from './groups/groups.module';
import { SecurityModule } from './security/security.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: Number(
              configService.get<string>('RATE_LIMIT_TTL_MS') ?? `${60_000}`,
            ),
            limit: Number(
              configService.get<string>('RATE_LIMIT_LIMIT') ?? '120',
            ),
          },
        ],
      }),
    }),
    SecurityModule,
    TransportModule,
    AuthModule,
    DashboardModule,
    StudentsModule,
    RfidModule,
    BusesModule,
    DevicesModule,
    UsersModule,
    CompaniesModule,
    LocationModule,
    RoutesModule,
    RouteSchedulesModule,
    GroupsModule,
    ConfirmationsModule,
    NotificationsModule,
    NotificationPromptsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
