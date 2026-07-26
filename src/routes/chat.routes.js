import express from "express";
import requireAuth from "../middlewares/authMiddleware.js";
import {
  validateCreateChat,
  validateRenameChat,
  validateGetChatsQuery,
} from "../validations/chat.validation.js";
import {
  validateSendMessage,
  validateGetMessagesQuery,
} from "../validations/message.validation.js";
import {
  createChat,
  getUserChats,
  getChatById,
  renameChat,
  deleteChat,
  sendMessage,
  getMessages,
  streamMessage,
} from "../controllers/chat.controller.js";

const router = express.Router();

// Enforce Clerk authentication for all chat & message endpoints
router.use(requireAuth);

// Chat endpoints
router.post("/", validateCreateChat, createChat);
router.get("/", validateGetChatsQuery, getUserChats);
router.get("/:chatId", getChatById);
router.patch("/:chatId", validateRenameChat, renameChat);
router.delete("/:chatId", deleteChat);

// Message endpoints (nested under chats)
router.post("/:chatId/messages/stream", validateSendMessage, streamMessage);
router.post("/:chatId/messages", validateSendMessage, sendMessage);
router.get("/:chatId/messages", validateGetMessagesQuery, getMessages);

export default router;
