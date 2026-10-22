import mongoose, { Schema, Document } from 'mongoose';

export interface IMfaSetting extends Document {
  id: string;
  userId: string;
  secret: string;
  backupCodes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MfaSettingSchema = new Schema<IMfaSetting>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    secret: {
      type: String,
      required: true,
    },
    backupCodes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const MfaSetting = mongoose.model<IMfaSetting>('MfaSetting', MfaSettingSchema);
