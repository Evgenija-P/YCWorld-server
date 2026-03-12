import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'ivanov_i' })
  @IsString()
  login: string;

  @ApiProperty({ example: 'Іванов Іван Іванович' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'pass123456' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}
