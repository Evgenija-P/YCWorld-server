import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser, JwtPayload } from './interfaces/auth.interface';

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

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async validateUser(loginDto: LoginDto): Promise<AuthenticatedUser> {
    const { login, password, companyId } = loginDto;

    const user = await this.usersService.findByLogin(login, companyId);

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

      const user = await this.usersService.findByLogin(
        payload.login,
        payload.companyId,
      );

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
