// Clerk auth middleware - verifies JWT and protects routes
import { getAuth } from "@clerk/express";
import ExpressError from "../utils/expressError.js";

// middleware to check if user is authenticated via Clerk
const requireAuth = (req, res, next) => {
    const auth = getAuth(req);

    if (!auth || !auth.userId) {
        throw new ExpressError(401, "Unauthorized - please login first");
    }

    // attach clerkId to request for downstream controllers
    req.clerkId = auth.userId;
    next();
};

export default requireAuth;
