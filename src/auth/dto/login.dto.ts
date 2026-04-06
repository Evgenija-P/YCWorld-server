import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'ivanov_i',
    description: 'Логін користувача',
  })
  @IsString({ message: 'Логін має бути рядком' })
  login: string;

  @ApiProperty({
    example: 'password123',
    description: 'Пароль користувача',
  })
  @IsString({ message: 'Пароль має бути рядком' })
  @MinLength(6, { message: 'Пароль має бути не менше 6 символів' })
  password: string;
}
