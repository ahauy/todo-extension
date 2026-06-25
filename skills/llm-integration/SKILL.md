---
name: llm-integration
description: Best practices for integrating LLM APIs (OpenAI, Anthropic, Gemini) into Node.js/Next.js apps — token optimization, streaming, caching, cost control, and error handling.
origin: opencode-project-template
---

# LLM Integration Skill

## Overview

Integrating LLM APIs efficiently requires balancing cost, latency, and quality. This skill covers token optimization, streaming responses, prompt caching, and production-ready patterns for Node.js/Next.js apps.

---

## Token Optimization

### 1. Count Tokens Before Sending

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { encoding_for_model } from "tiktoken";

// Estimate tokens before API call
function estimateTokens(text: string, model = "gpt-4"): number {
  const enc = encoding_for_model(model as any);
  const tokens = enc.encode(text);
  enc.free();
  return tokens.length;
}

// Warn if prompt is too large
function validatePromptSize(prompt: string, maxTokens = 4000): void {
  const count = estimateTokens(prompt);
  if (count > maxTokens) {
    throw new Error(`Prompt too large: ${count} tokens (max: ${maxTokens})`);
  }
}
```

### 2. Trim Context Window

```typescript
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// Keep only recent messages within token budget
function trimMessages(
  messages: Message[],
  maxTokens: number = 8000
): Message[] {
  let totalTokens = 0;
  const trimmed: Message[] = [];

  // Always keep system message
  const systemMsg = messages.find((m) => m.role === "system");
  if (systemMsg) {
    totalTokens += estimateTokens(systemMsg.content);
    trimmed.push(systemMsg);
  }

  // Add messages from newest to oldest
  const conversationMsgs = messages
    .filter((m) => m.role !== "system")
    .reverse();

  for (const msg of conversationMsgs) {
    const tokens = estimateTokens(msg.content);
    if (totalTokens + tokens > maxTokens) break;
    totalTokens += tokens;
    trimmed.unshift(msg);
  }

  return trimmed;
}
```

### 3. Compress System Prompts

```typescript
// Bad: verbose system prompt
const verbosePrompt = `
You are a helpful assistant. Your job is to help users with their questions.
You should always be polite and professional. You should provide accurate information.
When you don't know something, you should say so. You should not make up information.
`;

// Good: concise system prompt
const concisePrompt = `You are a helpful assistant. Be accurate, concise. Say "I don't know" when uncertain.`;

// Difference: ~60 tokens vs ~15 tokens per request
```

---

## Streaming Responses

### Next.js App Router Streaming

```typescript
// app/api/chat/route.ts
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const stream = await client.messages.stream({
    model: "claude-3-5-haiku-20241022", // Use cheaper model for simple tasks
    max_tokens: 1024,
    messages,
  });

  // Return as ReadableStream
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
          );
        }
      }
      controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

### Client-side Stream Consumption

```typescript
// hooks/useChat.ts
import { useState, useCallback } from "react";

export function useChat() {
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (messages: Message[]) => {
    setIsLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n").filter(Boolean);

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            const data = JSON.parse(line.slice(6));
            setResponse((prev) => prev + data.text);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { response, isLoading, sendMessage };
}
```

---

## Prompt Caching (Anthropic)

Prompt caching reduces costs by up to 90% for repeated context.

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Cache large, static context (docs, system instructions)
async function queryWithCache(userQuestion: string, largeContext: string) {
  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: "You are a helpful assistant. Answer based on the provided context.",
      },
      {
        type: "text",
        text: largeContext, // This gets cached after first call
        cache_control: { type: "ephemeral" }, // Cache for 5 minutes
      },
    ],
    messages: [{ role: "user", content: userQuestion }],
  });

  // Check cache usage in response
  const usage = response.usage as any;
  console.log("Cache read tokens:", usage.cache_read_input_tokens);
  console.log("Cache write tokens:", usage.cache_creation_input_tokens);

  return response.content[0].type === "text" ? response.content[0].text : "";
}
```

---

## Model Selection Strategy

```typescript
type TaskComplexity = "simple" | "medium" | "complex";

interface ModelConfig {
  model: string;
  maxTokens: number;
  costPer1kInput: number; // USD
}

const MODEL_CONFIGS: Record<TaskComplexity, ModelConfig> = {
  // Simple: classification, extraction, short answers
  simple: {
    model: "claude-3-5-haiku-20241022",
    maxTokens: 512,
    costPer1kInput: 0.0008,
  },
  // Medium: summarization, translation, code review
  medium: {
    model: "claude-3-5-sonnet-20241022",
    maxTokens: 2048,
    costPer1kInput: 0.003,
  },
  // Complex: reasoning, long-form generation, analysis
  complex: {
    model: "claude-opus-4-5",
    maxTokens: 4096,
    costPer1kInput: 0.015,
  },
};

function selectModel(complexity: TaskComplexity): ModelConfig {
  return MODEL_CONFIGS[complexity];
}

// Usage
async function processTask(task: string, complexity: TaskComplexity) {
  const config = selectModel(complexity);
  // Use config.model for the API call
}
```

---

## Response Caching

```typescript
import { createHash } from "crypto";

interface CacheEntry {
  response: string;
  timestamp: number;
  tokens: number;
}

class LLMCache {
  private cache = new Map<string, CacheEntry>();
  private ttlMs: number;

  constructor(ttlMinutes = 60) {
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  private hashKey(prompt: string, model: string): string {
    return createHash("sha256")
      .update(`${model}:${prompt}`)
      .digest("hex")
      .slice(0, 16);
  }

  get(prompt: string, model: string): string | null {
    const key = this.hashKey(prompt, model);
    const entry = this.cache.get(key);

    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  set(prompt: string, model: string, response: string, tokens: number): void {
    const key = this.hashKey(prompt, model);
    this.cache.set(key, { response, timestamp: Date.now(), tokens });
  }
}

// Singleton cache
export const llmCache = new LLMCache(60); // 1 hour TTL

// Cached API call
async function cachedCompletion(prompt: string, model: string): Promise<string> {
  const cached = llmCache.get(prompt, model);
  if (cached) {
    console.log("Cache hit — saved API call");
    return cached;
  }

  // Make actual API call
  const response = await makeAPICall(prompt, model);
  llmCache.set(prompt, model, response.text, response.tokens);
  return response.text;
}
```

---

## Rate Limiting & Retry

```typescript
import pRetry from "p-retry";
import pLimit from "p-limit";

// Limit concurrent requests
const limit = pLimit(5); // Max 5 concurrent API calls

async function rateLimitedCall<T>(fn: () => Promise<T>): Promise<T> {
  return limit(fn);
}

// Retry with exponential backoff
async function resilientAPICall(prompt: string): Promise<string> {
  return pRetry(
    async () => {
      const response = await client.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });
      return response.content[0].type === "text" ? response.content[0].text : "";
    },
    {
      retries: 3,
      onFailedAttempt: (error) => {
        console.log(`Attempt ${error.attemptNumber} failed. Retrying...`);
        // Handle rate limit (429) with longer wait
        if (error.message.includes("429")) {
          return new Promise((resolve) => setTimeout(resolve, 60000));
        }
      },
    }
  );
}
```

---

## Cost Tracking

```typescript
interface UsageRecord {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  estimatedCostUSD: number;
  timestamp: Date;
}

const PRICING: Record<string, { input: number; output: number; cacheRead: number }> = {
  "claude-3-5-haiku-20241022": { input: 0.0008, output: 0.004, cacheRead: 0.00008 },
  "claude-3-5-sonnet-20241022": { input: 0.003, output: 0.015, cacheRead: 0.0003 },
  "claude-opus-4-5": { input: 0.015, output: 0.075, cacheRead: 0.0015 },
};

function trackUsage(model: string, usage: any): UsageRecord {
  const pricing = PRICING[model] || { input: 0, output: 0, cacheRead: 0 };
  const cost =
    (usage.input_tokens / 1000) * pricing.input +
    (usage.output_tokens / 1000) * pricing.output +
    ((usage.cache_read_input_tokens || 0) / 1000) * pricing.cacheRead;

  const record: UsageRecord = {
    model,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheReadTokens: usage.cache_read_input_tokens || 0,
    estimatedCostUSD: cost,
    timestamp: new Date(),
  };

  console.log(`API call: $${cost.toFixed(6)} (${usage.input_tokens}in + ${usage.output_tokens}out tokens)`);
  return record;
}
```

---

## Common Mistakes

```typescript
// ❌ Bad: Sending full conversation history every time
const allMessages = await db.getMessages(chatId); // Could be 1000+ messages
await client.messages.create({ messages: allMessages });

// ✅ Good: Trim to recent context
const recentMessages = trimMessages(allMessages, 6000);
await client.messages.create({ messages: recentMessages });

// ❌ Bad: Using expensive model for simple tasks
await client.messages.create({
  model: "claude-opus-4-5", // $15/1M tokens
  messages: [{ role: "user", content: "Is this email spam? Yes or No." }],
});

// ✅ Good: Match model to task complexity
await client.messages.create({
  model: "claude-3-5-haiku-20241022", // $0.80/1M tokens
  max_tokens: 10, // Limit output too
  messages: [{ role: "user", content: "Is this email spam? Reply only: yes or no." }],
});

// ❌ Bad: No max_tokens limit
await client.messages.create({ model: "...", messages });

// ✅ Good: Always set max_tokens
await client.messages.create({ model: "...", max_tokens: 1024, messages });
```

---

## Pre-Commit Checklist

- [ ] `max_tokens` set on every API call
- [ ] Model matches task complexity (Haiku for simple, Sonnet for medium, Opus for complex)
- [ ] Context window trimmed for long conversations
- [ ] Streaming used for responses > 500 tokens
- [ ] Caching implemented for repeated/static context
- [ ] Rate limiting in place for batch operations
- [ ] Cost tracking/logging added
- [ ] Error handling covers 429 (rate limit) and 529 (overload)
- [ ] No API keys in source code (use env vars)

---

## Resources

- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [OpenAI Tokenizer](https://platform.openai.com/tokenizer)
- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [tiktoken npm](https://www.npmjs.com/package/tiktoken)
- [Vercel AI SDK](https://sdk.vercel.ai/docs) — streaming helpers for Next.js
