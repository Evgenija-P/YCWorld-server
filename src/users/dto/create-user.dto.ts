import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({
    example: 'shevchenko.taras',
    description: 'Логін користувача',
  })
  @IsString()
  login: string;

  @ApiProperty({
    example: 'Шевченко Тарас Григорович',
    description: "Повне ім'я користувача",
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    example: 'password123',
    description: 'Пароль користувача',
  })
  @IsString({ message: 'Пароль має бути рядком' })
  @MinLength(6, { message: 'Пароль має бути не менше 6 символів' })
  password: string;

  @ApiProperty({
    example: 'admin',
    description: 'Роль користувача',
    enum: UserRole,
    required: false,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    example: '65f1c9e2b3a...',
    description: 'ID компанії',
  })
  @IsString()
  companyId: string;
}
