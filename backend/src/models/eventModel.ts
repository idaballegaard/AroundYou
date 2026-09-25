import { Schema, model } from "mongoose";
import { Event } from "../interfaces/event";

const eventSchema = new Schema<Event>({
  name: { type: String, required: true, min: 6, max: 255 },
  description: { type: String, required: true, min: 3, max: 5_000 },
  heroImage: { type: String, required: true },
  imageArray: { type: [String], default: [] },
  price: { type: Number, required: true, min: 0 },
  link: { type: String, required: true },
  gpsPosition: { type: String, required: true },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  slugArray: { type: [String], default: [] },
  updateAt: { type: Date, default: Date.now },
  isAnnual: { type: Boolean, required: true, default: false },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  openingHours: { type: [String], default: [] },
  isHidden: { type: Boolean, default: false, index: true },
  hiddenAt: { type: Date },
  hiddenBy: { type: String },
});

export const EventModel = model<Event>("Event", eventSchema);
