import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, IsArray, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SearchEntitiesDto {
  @ApiProperty({
    description: 'Пошуковий рядок: назва, ЄДРПОУ, ПІБ, телефон тощо',
    example: 'Нафтогаз',
  })
  @IsString()
  searchString: string;

  @ApiProperty({
    description: 'Тип сутності: Company, Person, Sanction тощо (з /yc/schemas)',
    example: 'Company',
    required: false,
  })
  @IsOptional()
  @IsString()
  schemaName?: string;

  @ApiProperty({
    description: 'ID датасетів для фільтрації (з /yc/datasets)',
    example: ['DataSet/51033569560'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dataSetIds?: string[];

  @ApiProperty({
    description: 'Коди країн для фільтрації (з /yc/countries)',
    example: ['ua', 'ru'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  countries?: string[];

  @ApiProperty({ description: 'Кількість результатів на сторінці', example: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiProperty({ description: 'Зміщення (пагінація)', example: 0, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiProperty({ description: 'Фільтр тільки PEP', example: false, required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPep?: boolean;
}
