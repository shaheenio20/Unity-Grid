import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import mongoose from "mongoose";

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI must be configured.");
}

const client = new MongoClient(mongoUri);

export const db = client.db();

export const connectDB = async () => {
  await client.connect();
  await mongoose.connect(mongoUri);
  console.log("MongoDB (Client & Mongoose) connected successfully.");
};
