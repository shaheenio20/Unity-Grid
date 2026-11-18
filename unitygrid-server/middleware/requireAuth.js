import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/betterAuth.js";

export const requireAuth = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized: Please log in." });
    }

    req.user = session.user;
    req.session = session.session;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid session." });
  }
};