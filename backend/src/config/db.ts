import mongoose from 'mongoose';
import { ENV } from './env';

export const connectDb = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', false);
    // Disable buffering so unhandled timeout crashes don't occur when offline
    mongoose.set('bufferCommands', false);

    console.log(`Attempting to connect to MongoDB at: ${ENV.MONGODB_URI.replace(/:([^:@]+)@/, ':****@')}`);
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log('✅ Successfully connected to MongoDB database (MERN Stack)');
  } catch (err: any) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    console.warn('⚠️ Backend is running, but database operations require MongoDB to be accessible.');
    console.warn('👉 Verify MONGODB_URI in Render Dashboard -> Environment, and check MongoDB Atlas Network Access (0.0.0.0/0).');
  }
};

export const isDbConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export const initDb = connectDb;
