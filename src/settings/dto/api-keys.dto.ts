import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SetApiKeyDto {
  @ApiProperty({
    example: 'sk-1234567890abcdef',
    description: 'API ключ системи',
  })
  @IsString()
  apiKey: string;
}
