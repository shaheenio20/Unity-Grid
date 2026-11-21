import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db } from "./db.js";

const secret = process.env.BETTER_AUTH_SECRET;

if (!secret || secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be configured with at least 32 characters.");
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  secret,
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  trustedOrigins: [
    process.env.CLIENT_URL || "http://localhost:5173",
  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "Student",
        required: false,
      },
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
