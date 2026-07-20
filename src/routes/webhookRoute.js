// Clerk webhook route - receives events from Clerk
import express from "express";
import { handleClerkWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// webhook endpoint needs raw body for svix signature verification
// express.raw() is applied here so it doesn't conflict with express.json() on other routes
router.post(
    "/clerk",
    express.raw({ type: "application/json" }),
    handleClerkWebhook
);

export default router;
