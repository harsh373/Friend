import { Schema, model } from "mongoose";

export interface ReflectionPattern {
  text: string;
  sourceDates: string[];
}

export interface WeeklyReflectionFields {
  // Monday of the week, same identity the weekly plan uses.
  weekStart: string;
  patterns: ReflectionPattern[];
  reflection: string;
  // How many written entries the week had when this was generated, to flag it as out of date later.
  entryCount: number;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const patternSchema = new Schema<ReflectionPattern>(
  {
    text: { type: String, required: true, maxlength: 400 },
    sourceDates: { type: [String], default: [] },
  },
  { _id: false },
);

const weeklyReflectionSchema = new Schema<WeeklyReflectionFields>(
  {
    weekStart: { type: String, required: true, unique: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    patterns: { type: [patternSchema], default: [] },
    reflection: { type: String, default: "", maxlength: 1500 },
    entryCount: { type: Number, default: 0 },
    generatedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

export const WeeklyReflection = model<WeeklyReflectionFields>("WeeklyReflection", weeklyReflectionSchema);