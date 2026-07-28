import express from "express";
import "dotenv/config";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import ExpressError from "./utils/expressError.js";

import userRoute from "./routes/userRoute.js";
import webhookRoute from "./routes/webhookRoute.js";
import chatRoutes from "./routes/chat.routes.js";

const app = express();

// CORS configuration: allow local dev and deployed Vercel domains
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.startsWith("http://localhost:") ||
        origin.endsWith(".vercel.app") ||
        origin === process.env.FRONTEND_URL
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

// Clerk webhook route MUST come before express.json()
app.use("/api/webhook", webhookRoute);

// Parse JSON bodies
app.use(express.json());

// Clerk middleware
app.use(clerkMiddleware());

// Root endpoint
app.get("/", (req, res) => {
  res.json({ status: 200, message: "AI Backend API is up and running on Vercel" });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: 200, msg: "Backend API is up and running" });
});

// User routes
app.use("/api/user", userRoute);

// Chat & message routes
app.use("/api/v1/chats", chatRoutes);

// 404 handler
app.use((req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Backend Error:", err);
  let { statusCode, message } = err;
  if (!statusCode) {
    statusCode = 500;
    message = err.message || "Internal server error";
  }

  res.status(statusCode).json({ message, statusCode });
});

export default app;
