import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './interfaces/auth.interface';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto);

    const { accessToken, refreshToken } =
      await this.authService.generateTokens(user);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  @Get('me')
  getProfile(@Req() req: { user: AuthenticatedUser }) {
    return req.user;
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new UnauthorizedException();
    }

    return this.authService.refreshTokens(body.refreshToken);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return { success: true };
  }

  @Post('change-password')
  async changePassword(
    @Body() dto: { newPassword: string },
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.usersService.changePassword(
      req.user.id,
      dto.newPassword,
      req.user.companyId,
    );
  }

  @Post('admin/reset-password')
  @Roles(UserRole.SUPERADMIN)
  async resetPassword(
    @Body() dto: { userId: string; newPassword: string },
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.usersService.adminResetPassword(
      dto.userId,
      dto.newPassword,
      req.user.companyId,
    );
  }
}
