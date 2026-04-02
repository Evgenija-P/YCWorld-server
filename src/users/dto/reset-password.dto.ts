import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  userId: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
