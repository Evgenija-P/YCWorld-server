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

  async validateUser(loginDto: LoginDto): Promise<AuthenticatedUser> {
    const { login, password }: LoginDto = loginDto;

    const user = await this.usersService.findByLogin(login);

    if (!user) {
      throw new UnauthorizedException('Користувача не знайдено');
    }

    const passwordHash: string = user.passwordHash;

    const isPasswordValid = await bcrypt.compare(password, passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Невірний пароль');
    }

    return {
      id: user._id.toString(),
      login: user.login,
      fullName: user.fullName,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async login(user: AuthenticatedUser) {
    const payload: JwtPayload = {
      sub: user.id,
      login: user.login,
      fullName: user.fullName,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
    };
  }
}
