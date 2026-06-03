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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RefreshDto } from './dto/refresh.dto';
import { ChangePasswordDto } from '../users/dto/change-password.dto';
import { ResetPasswordDto } from '../users/dto/reset-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginDto })
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

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Отримати профіль' })
  @ApiBearerAuth('JWT-auth')
  @Get('me')
  getProfile(@Req() req: { user: AuthenticatedUser }) {
    return req.user;
  }

  @Public()
  @ApiOperation({ summary: 'Refresh token' })
  @ApiBody({ type: RefreshDto })
  @Post('refresh')
  async refresh(@Body() body: RefreshDto) {
    if (!body.refreshToken) {
      throw new UnauthorizedException();
    }

    return this.authService.refreshTokens(body.refreshToken);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Вийти з системи' })
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return { success: true };
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Змінити пароль' })
  @ApiBody({ type: ChangePasswordDto })
  @Post('change-password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.usersService.changePassword(
      req.user.id,
      dto.newPassword,
      req.user.companyId,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Скинути пароль (SUPERADMIN — будь-який юзер, ADMIN — тільки своя компанія)',
  })
  @ApiBody({ type: ResetPasswordDto })
  @Post('admin/reset-password')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.usersService.adminResetPassword(
      dto.userId,
      dto.newPassword,
      req.user,
    );
  }
}
