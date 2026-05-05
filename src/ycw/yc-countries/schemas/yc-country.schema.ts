import { Schema } from 'mongoose';

export const CountrySchema = new Schema({
  countries: [
    {
      code: String,
      name: String,
    },
  ],
  updatedAt: {
    type: Date,
    required: true,
  },
});
