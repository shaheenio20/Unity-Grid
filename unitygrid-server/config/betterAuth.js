import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    process.env.CLIENT_URL || "http://localhost:5173",
  ],
  user: {
    additionalFields: {
      department: {
        type: "string",
        required: false,
      },
      studentId: {
        type: "string",
        required: false,
      },
      bloodGroup: {
        type: "string",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      lastDonatedAt: {
        type: "string",
        required: false,
      },
      isAvailableForDonation: {
        type: "boolean",
        defaultValue: true,
      },
    },
  },
});