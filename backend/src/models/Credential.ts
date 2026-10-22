import mongoose, { Schema, Document } from 'mongoose';

export interface ICredential extends Document {
  id: string;
  userId: string;
  website: string;
  username: string;
  encryptedPassword: string;
  iv: string;
  authTag: string;
  createdAt: Date;
  updatedAt: Date;
}

const CredentialSchema = new Schema<ICredential>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    website: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    encryptedPassword: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    authTag: {
      type: String,
      required: true,
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

export const Credential = mongoose.model<ICredential>('Credential', CredentialSchema);
