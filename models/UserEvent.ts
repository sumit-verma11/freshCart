import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserEvent extends Document {
  productId:  mongoose.Types.ObjectId;
  event:      "view" | "cart" | "purchase";
  userId?:    mongoose.Types.ObjectId;
  timestamp:  Date;
}

const UserEventSchema = new Schema<IUserEvent>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    event:     { type: String, enum: ["view", "cart", "purchase"], required: true },
    userId:    { type: Schema.Types.ObjectId, ref: "User", default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Fast lookups for "N people added this today"
UserEventSchema.index({ productId: 1, event: 1, timestamp: -1 });
// Auto-delete docs older than 30 days
UserEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const UserEvent: Model<IUserEvent> =
  mongoose.models.UserEvent ||
  mongoose.model<IUserEvent>("UserEvent", UserEventSchema);

export default UserEvent;
