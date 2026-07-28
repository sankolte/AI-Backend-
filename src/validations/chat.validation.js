import { z } from "zod";
import ExpressError from "../utils/expressError.js";

const createChatSchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty").max(100, "Title is too long").optional(),
});

const renameChatSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title is too long"),
});

const getChatsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export const validateCreateChat = (req, res, next) => {
  const result = createChatSchema.safeParse(req.body);
  if (result.error) {
    throw new ExpressError(400, result.error.issues?.[0]?.message || result.error.message);
  }
  req.body = result.data;
  next();
};

export const validateRenameChat = (req, res, next) => {
  const result = renameChatSchema.safeParse(req.body);
  if (result.error) {
    throw new ExpressError(400, result.error.issues?.[0]?.message || result.error.message);
  }
  req.body = result.data;
  next();
};

export const validateGetChatsQuery = (req, res, next) => {
  const result = getChatsQuerySchema.safeParse(req.query);
  if (result.error) {
    throw new ExpressError(400, result.error.issues?.[0]?.message || result.error.message);
  }
  Object.assign(req.query, result.data);
  next();
};
