import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { UserRole } from '../enums/user-role.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    example: 'Шевченко Тарас Григорович',
    description: "Повне ім'я користувача",
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    example: 'admin',
    description: 'Роль користувача',
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({
    example: '65f1c9e2b3a...',
    description: 'ID компанії',
  })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiProperty({ example: true, description: 'Стан користувача' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: 'password123',
    description: 'Пароль користувача',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
