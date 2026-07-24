import prisma from "../../DB/db.config.js";
import ExpressError from "../utils/expressError.js";

/**
 * Helper to get internal database user ID from Clerk user ID.
 * Auto-provisions user in Postgres DB if authenticated via Clerk but not yet synced.
 */
async function getUserIdByClerkId(clerkId) {
  let user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        name: "User",
        email: `${clerkId}@clerk.user`,
      },
      select: { id: true },
    });
  }

  return user.id;
}

/**
 * Helper to verify chat existence and ownership
 */
async function verifyChatOwnership(chatId, userId) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
  });

  if (!chat) {
    throw new ExpressError(404, "Chat not found");
  }

  if (chat.userId !== userId) {
    throw new ExpressError(403, "Forbidden: You do not have access to this chat");
  }

  return chat;
}

/**
 * Create a new chat for the authenticated user
 */
export async function createChat(clerkId, data = {}) {
  const userId = await getUserIdByClerkId(clerkId);

  const chat = await prisma.chat.create({
    data: {
      title: data.title || "New Conversation",
      userId,
    },
  });

  return chat;
}

/**
 * List paginated chats belonging to the user
 */
export async function getUserChats(clerkId, { page = 1, limit = 20 } = {}) {
  const userId = await getUserIdByClerkId(clerkId);

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [totalChats, chats] = await Promise.all([
    prisma.chat.count({ where: { userId } }),
    prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limitNum,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    }),
  ]);

  return {
    chats,
    pagination: {
      total: totalChats,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalChats / limitNum),
    },
  };
}

/**
 * Get single chat with messages after verifying ownership
 */
export async function getChatById(clerkId, chatId) {
  const userId = await getUserIdByClerkId(clerkId);
  await verifyChatOwnership(chatId, userId);

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return chat;
}

/**
 * Rename chat after verifying ownership
 */
export async function renameChat(clerkId, chatId, { title }) {
  const userId = await getUserIdByClerkId(clerkId);
  await verifyChatOwnership(chatId, userId);

  const updatedChat = await prisma.chat.update({
    where: { id: chatId },
    data: { title },
  });

  return updatedChat;
}

/**
 * Delete chat (cascading deletes messages automatically via Prisma schema)
 */
export async function deleteChat(clerkId, chatId) {
  const userId = await getUserIdByClerkId(clerkId);
  await verifyChatOwnership(chatId, userId);

  await prisma.chat.delete({
    where: { id: chatId },
  });

  return { message: "Chat deleted successfully" };
}

/**
 * Send message to a chat after verifying ownership
 */
export async function sendMessage(clerkId, chatId, { role = "user", content }) {
  const userId = await getUserIdByClerkId(clerkId);
  await verifyChatOwnership(chatId, userId);

  const message = await prisma.message.create({
    data: {
      chatId,
      role,
      content,
    },
  });

  // Touch the chat's updatedAt field
  await prisma.chat.update({
    where: { id: chatId },
    data: { updatedAt: new Date() },
  });

  return message;
}

/**
 * Get cursor-paginated messages for a chat after verifying ownership
 */
export async function getMessages(clerkId, chatId, { limit = 50, cursor } = {}) {
  const userId = await getUserIdByClerkId(clerkId);
  await verifyChatOwnership(chatId, userId);

  const limitNum = Number(limit) || 50;

  const queryOptions = {
    where: { chatId },
    orderBy: { createdAt: "asc" },
    take: limitNum + 1,
  };

  if (cursor) {
    queryOptions.cursor = { id: cursor };
    queryOptions.skip = 1;
  }

  const messages = await prisma.message.findMany(queryOptions);

  let nextCursor = null;
  if (messages.length > limitNum) {
    const extraItem = messages.pop();
    nextCursor = messages[messages.length - 1]?.id || null;
  }

  return {
    messages,
    nextCursor,
  };
}
