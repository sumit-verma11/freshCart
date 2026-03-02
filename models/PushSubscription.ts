import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPushSubscriptionDocument extends Document {
  userId:    mongoose.Types.ObjectId;
  endpoint:  string;
  p256dh:    string;
  auth:      string;
  createdAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscriptionDocument>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    /** The subscription endpoint URL provided by the browser's push service */
    endpoint: {
      type:     String,
      required: true,
    },
    /** ECDH P-256 public key (base64url-encoded) */
    p256dh: {
      type:     String,
      required: true,
    },
    /** Authentication secret (base64url-encoded) */
    auth: {
      type:     String,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Each user can have multiple devices; each endpoint is globally unique
PushSubscriptionSchema.index({ userId: 1 });
PushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });

const PushSubscription: Model<IPushSubscriptionDocument> =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscriptionDocument>("PushSubscription", PushSubscriptionSchema);

export default PushSubscription;
