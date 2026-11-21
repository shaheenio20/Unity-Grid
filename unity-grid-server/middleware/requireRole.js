import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/betterAuth.js";
import { User } from "../models/User.js";

export const requireRole = (allowedRoles = []) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req, res, next) => {
    try {
      let user = req.user;

      if (!user) {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(req.headers),
        });

        if (!session || !session.user) {
          return res.status(401).json({
            success: false,
            message: "Unauthorized: Please log in to continue.",
          });
        }

        user = session.user;
        req.user = session.user;
        req.session = session.session;
      }

      // Always fetch latest role from MongoDB User collection
      const userId = user.id || user._id;
      let currentRole = "Student";
      if (userId) {
        const dbUser = await User.findById(userId).lean();
        if (dbUser && dbUser.role) {
          currentRole = dbUser.role;
        } else if (user.role) {
          currentRole = user.role;
        }
      }
      req.user.role = currentRole;

      if (roles.length > 0) {
        if (!roles.includes(currentRole)) {
          return res.status(403).json({
            success: false,
            message: `Forbidden: Requires [${roles.join(", ")}] permissions. Current role: ${currentRole}`,
          });
        }
      }

      next();
    } catch (error) {
      console.error("Authorization check failed:", error);
      return res.status(500).json({
        success: false,
        message: "Authorization verification failed.",
      });
    }
  };
};

export const requireAuth = requireRole([]);
