import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type YcDatasetsDocument = YcDatasetsCache & Document;

@Schema()
export class YcDatasetsCache {
  @Prop({ type: [Object], default: [] })
  datasets: Record<string, unknown>[];

  @Prop({ type: Date })
  updatedAt: Date;
}

export const YcDatasetsCacheSchema =
  SchemaFactory.createForClass(YcDatasetsCache);
