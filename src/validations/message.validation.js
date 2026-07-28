import { z } from "zod";
import ExpressError from "../utils/expressError.js";

const sendMessageSchema = z.object({
  role: z.enum(["user", "assistant"]).default("user"),
  content: z.string().trim().min(1, "Message content is required"),
  model: z.string().optional().default("gpt-4o-mini"),
});

const getMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
});

export const validateSendMessage = (req, res, next) => {
  const result = sendMessageSchema.safeParse(req.body);
  if (result.error) {
    throw new ExpressError(400, result.error.issues?.[0]?.message || result.error.message);
  }
  req.body = result.data;
  next();
};

export const validateGetMessagesQuery = (req, res, next) => {
  const result = getMessagesQuerySchema.safeParse(req.query);
  if (result.error) {
    throw new ExpressError(400, result.error.issues?.[0]?.message || result.error.message);
  }
  Object.assign(req.query, result.data);
  next();
};
