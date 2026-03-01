import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "@/types";

// ─── Document interface ───────────────────────────────────────────────────────

export interface IUserDocument extends Omit<IUser, "_id" | "passwordHash">, Document {
  passwordHash: string;
  comparePassword(candidate: string): Promise<boolean>;
}

// ─── Sub-schema: Address ──────────────────────────────────────────────────────

const AddressSchema = new Schema(
  {
    label:     { type: String, default: "Home", trim: true },
    street:    { type: String, required: true, trim: true },
    city:      { type: String, required: true, trim: true },
    state:     { type: String, required: true, trim: true },
    pincode:   { type: String, required: true, match: /^\d{6}$/ },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

// ─── Main schema ──────────────────────────────────────────────────────────────

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,                   // index: email (unique)
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,                  // never returned in queries by default
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      match: [/^[6-9]\d{9}$/, "Invalid Indian mobile number"],
      sparse: true,
    },
    addresses: { type: [AddressSchema], default: [] },
  },
  { timestamps: true }
);

// ─── Pre-save hook — hash password if modified ────────────────────────────────

UserSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// ─── Instance method — verify password ───────────────────────────────────────

UserSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

// ─── toJSON — strip passwordHash from all serialised output ──────────────────

UserSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc, ret: Record<string, any>) => {
    delete ret.passwordHash;
    return ret;
  },
});

// ─── Export ───────────────────────────────────────────────────────────────────

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default User;
