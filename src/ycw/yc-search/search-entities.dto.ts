import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Хелпер: приводить значення до масиву рядків.
 * Axios з фронту може передати:
 *  - масив:  countries[]=ru&countries[]=gb  → ['ru', 'gb']  ✅ вже масив
 *  - рядок:  countries=ru,gb               → 'ru,gb'       потребує split
 *  - один:   countries=ru                  → 'ru'          потребує wrap
 */
function toStringArray({ value }: { value: unknown }): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string')
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  return undefined;
}

export class SearchEntitiesDto {
  @ApiProperty({
    description: 'Пошуковий рядок: назва, ЄДРПОУ, ПІБ, телефон тощо',
    example: 'Roman Borisovich Rotenberg',
  })
  @IsString()
  searchString: string;

  @ApiProperty({
    description: 'Тип сутності: Company, Person, Sanction тощо (з /yc/schemas)',
    example: 'Person',
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
  @Transform(toStringArray)
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
  @Transform(toStringArray)
  @IsArray()
  @IsString({ each: true })
  countries?: string[];

  @ApiProperty({
    description: 'Кількість результатів на сторінці (за замовчуванням 10)',
    example: 15,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiProperty({
    description: 'Зміщення від початку списку. Offset = (page - 1) * pageSize',
    example: 14,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiProperty({
    description: 'Тільки PEP (Politically Exposed Persons)',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPep?: boolean;
}
