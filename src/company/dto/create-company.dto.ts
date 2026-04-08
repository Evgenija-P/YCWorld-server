import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({
    example: 'Google',
    description: 'Назва компанії',
  })
  @IsString()
  name: string;
}
