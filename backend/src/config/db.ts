import mongoose from 'mongoose';
import { ENV } from './env';

export const connectDb = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('Successfully connected to MongoDB database (MERN Stack)');
  } catch (err: any) {
    console.error(`MongoDB connection error: ${err.message}`);
    console.warn('Backend will start, but database operations require MongoDB to be running.');
  }
};

export const initDb = connectDb;
