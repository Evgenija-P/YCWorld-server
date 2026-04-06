import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser, JwtPayload } from './interfaces/auth.interface';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  user: AuthenticatedUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async generateTokens(user: AuthenticatedUser) {
    const payload: JwtPayload = {
      sub: user.id,
      login: user.login,
      fullName: user.fullName,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      companyId: user.companyId,
    };

    const accessTokenExpiresIn = 15 * 60; // секунди

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: accessTokenExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
    };
  }

  async validateUser(loginDto: LoginDto): Promise<AuthenticatedUser> {
    const { login, password } = loginDto;

    const user = await this.usersService.findByLogin(login);

    if (!user) {
      throw new UnauthorizedException('Користувача не знайдено');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Невірний пароль');
    }

    return {
      id: user._id.toString(),
      login: user.login,
      fullName: user.fullName,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      companyId: user.companyId,
    };
  }

  async login(user: AuthenticatedUser) {
    const payload: JwtPayload = {
      sub: user.id,
      login: user.login,
      fullName: user.fullName,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      companyId: user.companyId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload =
        await this.jwtService.verifyAsync<JwtPayload>(refreshToken);

      const user = await this.usersService.findByLogin(payload.login);

      if (!user) {
        throw new UnauthorizedException();
      }

      return this.generateTokens({
        id: user._id.toString(),
        login: user.login,
        fullName: user.fullName,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        companyId: user.companyId,
      });
    } catch {
      throw new UnauthorizedException();
    }
  }
}
