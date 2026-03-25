import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransportModule } from './transport/transport.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DashboardModule } from './dashboard/dashboard.module';
import { StudentsModule } from './students/students.module';
import { RfidModule } from './rfid/rfid.module';
import { BusesModule } from './buses/buses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TransportModule,
    AuthModule,
    DashboardModule,
    StudentsModule,
    RfidModule,
    BusesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
