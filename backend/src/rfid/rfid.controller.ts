import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { RfidService } from './rfid.service';
import { LinkRfidDto } from './dto/link-rfid.dto';
import { JwtAuthGuard } from 'src/auth/dto/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('rfid')
export class RfidController {
  constructor(private readonly rfidService: RfidService) {}

  @Post('link')
  link(@Body() dto: LinkRfidDto, @Req() req: any) {
    const companyId = req.user.companyId;

    return this.rfidService.link(companyId, dto);
  }
}
