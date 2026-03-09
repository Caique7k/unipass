import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransportModule } from './transport/transport.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [TransportModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
