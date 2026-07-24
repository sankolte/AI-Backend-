import wrapAsync from "../utils/wrapAsync.js";
import {
  createChat as createChatService,
  getUserChats as getUserChatsService,
  getChatById as getChatByIdService,
  renameChat as renameChatService,
  deleteChat as deleteChatService,
  sendMessage as sendMessageService,
  getMessages as getMessagesService,
} from "../services/chat.service.js";

// POST /api/v1/chats - Create new chat
export const createChat = wrapAsync(async (req, res) => {
  const clerkId = req.clerkId;
  const chat = await createChatService(clerkId, req.body);
  res.status(201).json({ message: "Chat created successfully", chat });
});

// GET /api/v1/chats - List user's chats (paginated)
export const getUserChats = wrapAsync(async (req, res) => {
  const clerkId = req.clerkId;
  const result = await getUserChatsService(clerkId, req.query);
  res.status(200).json(result);
});

// GET /api/v1/chats/:chatId - Get single chat with messages
export const getChatById = wrapAsync(async (req, res) => {
  const clerkId = req.clerkId;
  const { chatId } = req.params;
  const chat = await getChatByIdService(clerkId, chatId);
  res.status(200).json(chat);
});

// PATCH /api/v1/chats/:chatId - Rename chat
export const renameChat = wrapAsync(async (req, res) => {
  const clerkId = req.clerkId;
  const { chatId } = req.params;
  const chat = await renameChatService(clerkId, chatId, req.body);
  res.status(200).json({ message: "Chat renamed successfully", chat });
});

// DELETE /api/v1/chats/:chatId - Delete chat
export const deleteChat = wrapAsync(async (req, res) => {
  const clerkId = req.clerkId;
  const { chatId } = req.params;
  const result = await deleteChatService(clerkId, chatId);
  res.status(200).json(result);
});

// POST /api/v1/chats/:chatId/messages - Send message
export const sendMessage = wrapAsync(async (req, res) => {
  const clerkId = req.clerkId;
  const { chatId } = req.params;
  const message = await sendMessageService(clerkId, chatId, req.body);
  res.status(201).json({ message: "Message sent successfully", data: message });
});

// GET /api/v1/chats/:chatId/messages - Get messages (cursor-based pagination)
export const getMessages = wrapAsync(async (req, res) => {
  const clerkId = req.clerkId;
  const { chatId } = req.params;
  const result = await getMessagesService(clerkId, chatId, req.query);
  res.status(200).json(result);
});
