import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
  @ApiProperty({
    example: 'Ромашка Трейд',
    description: 'Компанія, яка використовує систему YCWorld',
  })
  @Prop({ required: true, unique: true })
  name: string;

  @ApiProperty({
    example: '65f1c9e2b3a...',
    description: 'ID компанії',
  })
  @Prop({ unique: true })
  code: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
