import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UsersService } from '../users/users.service';

@ApiTags('Company')
@ApiBearerAuth('JWT-auth')
@Controller('company')
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Створити компанію' })
  @ApiBody({ type: CreateCompanyDto })
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.companyService.create(dto.name);
  }

  @Get()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Отримати всі компанії' })
  findAll() {
    return this.companyService.findAll();
  }

  @Get('company/:companyId')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Користувачі по компанії' })
  @ApiParam({ name: 'companyId' })
  findByCompanyId(@Param('companyId') companyId: string) {
    return this.usersService.findUsersByCompany(companyId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Оновити компанію' })
  @ApiParam({ name: 'id' })
  async update(@Param('id') id: string, @Body() dto: { name: string }) {
    return this.companyService.update(id, dto.name);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Видалити компанію' })
  @ApiParam({ name: 'id', example: '65f1c9e2b3a...' })
  remove(@Param('id') id: string) {
    if (id === 'root') {
      throw new Error('Cannot delete root company');
    }

    return this.companyService.remove(id);
  }
}
