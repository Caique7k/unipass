import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
