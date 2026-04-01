import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.USER)
  async createUser(
    @Body() dto: CreateUserDto,
    @Req() req: Request & { user: { companyId: string } },
  ) {
    const currentUser: { companyId: string } = req.user;

    return this.usersService.create({
      ...dto,
      companyId: currentUser.companyId,
    });
  }
}
