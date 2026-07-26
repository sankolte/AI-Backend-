import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-demo-key-1234567890",
});

/**
 * Calls OpenAI chat completion endpoint with streaming enabled.
 * @param {Array<{role: "user" | "assistant" | "system", content: string}>} messages
 * @param {string} [model="gpt-4o-mini"]
 * @returns {Promise<AsyncIterable<import('openai/resources/chat/completions').ChatCompletionChunk>>}
 */
export async function getAICompletionStream(messages, model = "gpt-4o-mini") {
  const stream = await openai.chat.completions.create({
    model,
    messages,
    stream: true,
  });

  return stream;
}
