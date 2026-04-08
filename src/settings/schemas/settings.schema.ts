import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type SettingsDocument = Settings & Document;

@Schema()
export class Settings {
  @ApiProperty({
    example: 'abc-defgh-jgklmn-opqr-stuv',
    description: 'Ключ до доступу до API YCWorld',
  })
  @Prop({ type: String, default: null })
  apiKey: string | null;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
