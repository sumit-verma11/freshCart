import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotificationDocument extends Document {
  email: string;
  productId: mongoose.Types.ObjectId;
  productName: string;
  notified: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    email:       { type: String, required: true, lowercase: true, trim: true },
    productId:   { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    notified:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One alert per email+product pair
NotificationSchema.index({ email: 1, productId: 1 }, { unique: true });
NotificationSchema.index({ productId: 1, notified: 1 });

const Notification: Model<INotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<INotificationDocument>("Notification", NotificationSchema);

export default Notification;
