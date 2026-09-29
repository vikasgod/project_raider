import mongoose, { Mongoose } from "mongoose";
type VideoKycStatus = "not_required" | "pending" | "in_progress" | "approved" | "rejected";
export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password?: string;
  role?: "user" | "admin" | "partner";
  isEmailVerified?: boolean;
  otp?: string;
  otpExpiresAt?: Date;
  partnerOnboardingSteps: number;
  mobileNumber?: string;
  partnerStatus: "pending" | "approved" | "rejected";
  rejectionReason: string;
  videoKycStatus: VideoKycStatus;
  videoKycRoomId: string;
  socketId: string | null;
  location ?:{
    type: "Point";
    coordinates: [number, number];
  };
  isOnline: boolean;
  videoKycRejectionReason: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ["user", "admin", "partner"], default: "user" },
  isEmailVerified: { type: Boolean, default: false },
  otp: { type: String },
  partnerOnboardingSteps: { type: Number, min: 0, max: 8, default: 0 },
  mobileNumber: { type: String },
  partnerStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    required: true,
  },
  rejectionReason: {
    type: String
  },
  videoKycStatus: {
    type: String,
    enum: ["not_required", "pending", "in_progress", "approved", "rejected"],
    default: "not_required",
    required: true
  },
  videoKycRoomId: {
    type: String
  },
  videoKycRejectionReason: {
    type: String
  },
  socketId: {
    type: String,
    default: null
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  isOnline: {
    type: Boolean,
    default: false,
    index: true
  },
  createdAt: { type: Date, default: Date.now },
  otpExpiresAt: { type: Date }
}, { timestamps: true });

userSchema.index({location: "2dsphere"});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;