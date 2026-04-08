import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { UserRole } from '../enums/user-role.enum';

export type UserDocument = User & Document;

@Schema()
export class User {
  @ApiProperty({
    example: 'shevchenko.taras',
    description: 'Логін користувача',
  })
  @Prop({ required: true, unique: true })
  login: string;

  @ApiProperty({
    example: 'Шевченко Тарас Григорович',
    description: "Повне ім'я користувача",
  })
  @Prop()
  fullName: string;

  @ApiProperty({
    example: 'password123',
    description: 'Пароль користувача',
  })
  @Prop({ required: true })
  passwordHash: string;

  @ApiProperty({
    example: 'admin',
    description: 'Роль користувача',
    enum: UserRole,
  })
  @Prop({ required: true })
  role: string;

  @ApiProperty({
    example: false,
    description: 'Чи потрібно користувачу змінити пароль при наступному вході',
  })
  @Prop({ default: false })
  mustChangePassword: boolean;

  @ApiProperty({ example: 'Компанія', description: 'Компанія користувача' })
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @ApiProperty({ example: true, description: 'Стан користувача' })
  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
