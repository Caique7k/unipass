import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransportModule } from './transport/transport.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
    ConfirmationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
