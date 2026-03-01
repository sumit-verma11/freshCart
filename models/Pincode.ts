import mongoose, { Schema, Document, Model } from "mongoose";
import { IPincode } from "@/types";

// ─── Document interface ───────────────────────────────────────────────────────

export interface IPincodeDocument extends Omit<IPincode, "_id">, Document {}

// ─── Schema ───────────────────────────────────────────────────────────────────

const PincodeSchema = new Schema<IPincodeDocument>(
  {
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      unique: true,                             // index: pincode (unique)
      trim: true,
      match: [/^\d{6}$/, "Pincode must be exactly 6 digits"],
    },
    area: {
      type: String,
      required: [true, "Area/locality name is required"],
      trim: true,
      maxlength: 200,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: 100,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      maxlength: 100,
    },
    isServiceable: {
      type: Boolean,
      required: true,
      default: false,   // conservative default — explicitly opt-in each pincode
    },
    estimatedDeliveryHours: {
      min: { type: Number, required: true, min: [0, "min must be ≥ 0"] },
      // Cross-field validation (max ≥ min) is enforced at the API/service layer
      // because Mongoose's this-context in sub-object validators is unreliable.
      max: { type: Number, required: true, min: [0, "max must be ≥ 0"] },
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Common query: "is this pincode serviceable?"
PincodeSchema.index({ pincode: 1, isServiceable: 1 });

// Lookup all serviceable pincodes in a city (admin view)
PincodeSchema.index({ city: 1, isServiceable: 1 });

// ─── Static helpers ───────────────────────────────────────────────────────────

interface IPincodeModel extends Model<IPincodeDocument> {
  isServiceable(pincode: string): Promise<boolean>;
  getDeliveryHours(
    pincode: string
  ): Promise<{ min: number; max: number } | null>;
}

PincodeSchema.statics.isServiceable = async function (
  pincode: string
): Promise<boolean> {
  const doc = await this.findOne({ pincode, isServiceable: true })
    .select("isServiceable")
    .lean();
  return doc !== null;
};

PincodeSchema.statics.getDeliveryHours = async function (
  pincode: string
): Promise<{ min: number; max: number } | null> {
  const doc = await this.findOne({ pincode, isServiceable: true })
    .select("estimatedDeliveryHours")
    .lean() as IPincodeDocument | null;
  return doc ? doc.estimatedDeliveryHours : null;
};

// ─── Export ───────────────────────────────────────────────────────────────────

const Pincode: IPincodeModel =
  (mongoose.models.Pincode as IPincodeModel) ||
  mongoose.model<IPincodeDocument, IPincodeModel>("Pincode", PincodeSchema);

export default Pincode;
