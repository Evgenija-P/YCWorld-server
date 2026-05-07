import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type YcDatasetsDocument = YcDatasetsCache & Document;

export type DatasetItem = {
  value: string;
  label: string;

  description: string | null;

  countries: string[];
  types: string[];

  isPep: boolean | null;
};

@Schema()
export class YcDatasetsCache {
  @Prop({
    type: [
      {
        value: {
          type: String,
          required: true,
        },

        label: {
          type: String,
          required: true,
        },

        description: {
          type: String,
          default: null,
        },

        countries: {
          type: [String],
          default: [],
        },

        types: {
          type: [String],
          default: [],
        },

        isPep: {
          type: Boolean,
          default: null,
        },
      },
    ],

    default: [],
  })
  datasets: DatasetItem[];

  @Prop({
    type: Date,
    required: true,
  })
  updatedAt: Date;
}

export const YcDatasetsCacheSchema =
  SchemaFactory.createForClass(YcDatasetsCache);
