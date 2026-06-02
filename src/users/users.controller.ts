import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Створити користувача' })
  @ApiBody({ type: CreateUserDto })
  async createUser(
    @Body() dto: CreateUserDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.usersService.create(dto, req.user);
  }

  // 🔹 SUPERADMIN — всі користувачі
  @Get('all')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Отримати всіх користувачів (SUPERADMIN)' })
  async findAllUsers() {
    return this.usersService.findAllUsers();
  }

  // 🔹 ADMIN — тільки своя компанія
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Отримати користувачів своєї компанії (ADMIN)' })
  async findMyCompanyUsers(@Req() req: Request & { user: AuthenticatedUser }) {
    return this.usersService.findByCompany(req.user.companyId);
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Отримати користувача' })
  @ApiParam({ name: 'id', example: '65f1c9e2b3a...' })
  async findUserById(@Param('id') userId: string) {
    return this.usersService.findById(userId);
  }

  // 🔹 update користувача
  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Оновити користувача' })
  @ApiParam({ name: 'id', example: '65f1c9e2b3a...' })
  @ApiBody({ type: UpdateUserDto })
  async updateUser(
    @Param('id') userId: string,
    @Body() dto: UpdateUserDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.usersService.updateUser(userId, dto, req.user);
  }

  // 🔹 toggle active
  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Змінити статус користувача (активний/заблокований)',
  })
  @ApiParam({ name: 'id', example: '65f1c9e2b3a...' })
  async toggleActive(
    @Param('id') userId: string,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.usersService.toggleActive(userId, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Видалити користувача' })
  @ApiParam({ name: 'id', example: '65f1c9e2b3a...' })
  async deleteUser(
    @Param('id') userId: string,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.usersService.deleteUser(userId, req.user);
  }
}
