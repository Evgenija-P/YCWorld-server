import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type YcSchemasDocument = YcSchemasCache & Document;

@Schema()
export class YcSchemasCache {
  @Prop({
    type: [
      {
        value: { type: String, required: true },

        label: { type: String, required: true },

        type: { type: String, default: null },
      },
    ],

    default: [],
  })
  schemas: {
    value: string;
    label: string;
    type: string | null;
  }[];

  @Prop({ type: Date })
  updatedAt: Date;
}

export const YcSchemasCacheSchema =
  SchemaFactory.createForClass(YcSchemasCache);
