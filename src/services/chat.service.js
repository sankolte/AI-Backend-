import prisma from "../../DB/db.config.js";
import ExpressError from "../utils/expressError.js";
import { getAICompletionStream } from "./ai.service.js";

/**
 * Helper to get internal database user ID from Clerk user ID.
 * Auto-provisions user in Postgres DB if authenticated via Clerk but not yet synced.
 */
async function getUserIdByClerkId(clerkId) {
  if (!clerkId) {
    throw new ExpressError(401, "Authentication required: missing clerkId");
  }

  let user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    const fallbackEmail = `${clerkId}@clerk.user`;
    const existingEmailUser = await prisma.user.findUnique({
      where: { email: fallbackEmail },
      select: { id: true },
    });

    if (existingEmailUser) {
      user = await prisma.user.update({
        where: { id: existingEmailUser.id },
        data: { clerkId },
        select: { id: true },
      });
    } else {
      user = await prisma.user.create({
        data: {
          clerkId,
          name: "User",
          email: fallbackEmail,
        },
        select: { id: true },
      });
    }
  }

  return user.id;
}

/**
 * Helper to verify chat existence and ownership
 */
async function verifyChatOwnership(chatId, userId) {
  if (!chatId || typeof chatId !== "string") {
    throw new ExpressError(400, "Invalid conversation ID");
  }

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

/**
 * Handle streaming AI response for a chat message via SSE
 */
export async function streamMessage(clerkId, chatId, { content, model = "gpt-4o-mini" }, res) {
  const userId = await getUserIdByClerkId(clerkId);
  await verifyChatOwnership(chatId, userId);

  // 1. Save user message to database
  const userMessage = await prisma.message.create({
    data: {
      chatId,
      role: "user",
      content,
    },
  });

  // 2. Fetch recent conversation context (latest 15 messages)
  const rawPastMessages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: {
      role: true,
      content: true,
    },
  });

  // Reverse so context is ordered chronologically (oldest to newest)
  const pastMessages = rawPastMessages.reverse();

  // Format messages for OpenAI API
  const formattedMessages = pastMessages.map((msg) => ({
    role: msg.role === "assistant" ? "assistant" : "user",
    content: msg.content,
  }));

  // 3. Set SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (res.flushHeaders) res.flushHeaders();

  // Emit user_message event
  res.write(`data: ${JSON.stringify({ type: "user_message", data: userMessage })}\n\n`);

  let fullAssistantContent = "";

  try {
    // 4. Call AI completion stream with requested model
    const stream = await getAICompletionStream(formattedMessages, model);

    for await (const chunk of stream) {
      const deltaContent = chunk.choices[0]?.delta?.content || "";
      if (deltaContent) {
        fullAssistantContent += deltaContent;
        res.write(
          `data: ${JSON.stringify({ type: "chunk", content: deltaContent })}\n\n`
        );
      }
    }

    // 5. Save assistant response to DB
    const assistantMessage = await prisma.message.create({
      data: {
        chatId,
        role: "assistant",
        content: fullAssistantContent,
      },
    });

    // Touch chat updatedAt
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Send completion event and DONE signal
    res.write(
      `data: ${JSON.stringify({ type: "done", data: assistantMessage })}\n\n`
    );
    res.write(`data: [DONE]\n\n`);
  } catch (error) {
    console.error("Error during AI streaming:", error);
    res.write(
      `data: ${JSON.stringify({ type: "error", message: error.message || "AI stream error" })}\n\n`
    );
  } finally {
    res.end();
  }
}

