import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, AuthenticatedUser } from '../interfaces/auth.interface';
import { UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/enums/user-role.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'fallback_secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('USER_INACTIVE');
    }

    if (!Object.values(UserRole).includes(user.role as UserRole)) {
      throw new UnauthorizedException('Invalid role');
    }

    return {
      id: user._id.toString(),
      login: user.login,
      fullName: user.fullName,
      role: user.role as UserRole,
      mustChangePassword: user.mustChangePassword,
      companyId: user.companyId,
    };
  }
}
