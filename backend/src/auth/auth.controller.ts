import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  private getCookieOptions(): CookieOptions {
    const sameSite =
      (this.configService.get<string>('COOKIE_SAME_SITE')?.toLowerCase() as
        | 'lax'
        | 'strict'
        | 'none'
        | undefined) ?? 'lax';

    const secure =
      (this.configService.get<string>('COOKIE_SECURE') ?? 'false').toLowerCase() ===
      'true';

    const maxAge = Number(
      this.configService.get<string>('COOKIE_MAX_AGE_MS') ?? `${1000 * 60 * 60}`,
    );

    const domain = this.configService.get<string>('COOKIE_DOMAIN')?.trim();

    return {
      httpOnly: true,
      secure,
      sameSite,
      maxAge,
      path: '/',
      ...(domain ? { domain } : {}),
    };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token } = await this.authService.login(
      dto.email,
      dto.password,
    );

    res.cookie('token', access_token, this.getCookieOptions());

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req) {
    return req.user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', this.getCookieOptions());
    return { success: true };
  }
}
