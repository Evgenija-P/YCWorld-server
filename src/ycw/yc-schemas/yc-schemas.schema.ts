import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type YcSchemasDocument = YcSchemasCache & Document;

@Schema()
export class YcSchemasCache {
  @Prop({ type: [{ name: String, type: String }], default: [] })
  schemas: { name: string; type: string | null }[];

  @Prop({ type: Date })
  updatedAt: Date;
}

export const YcSchemasCacheSchema =
  SchemaFactory.createForClass(YcSchemasCache);
