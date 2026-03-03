import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransportModule } from './transport/transport.module';

@Module({
  imports: [TransportModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
