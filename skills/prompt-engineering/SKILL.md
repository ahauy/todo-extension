---
name: prompt-engineering
description: Write effective prompts that produce better results with fewer tokens — structured prompting, few-shot examples, chain-of-thought, output formatting, and cost-reduction techniques.
origin: opencode-project-template
---

# Prompt Engineering Skill

## Overview

Good prompts get better results with fewer tokens. This skill covers structured prompting patterns, output control, and techniques to reduce token usage without sacrificing quality.

---

## Core Principles

### Be Specific, Not Verbose

```typescript
// ❌ Bad: Vague and wordy
const badPrompt = `
Please help me with the following task. I would like you to look at the code I'm going to provide
and tell me if there are any issues with it. I'm particularly interested in knowing about bugs,
performance issues, security vulnerabilities, and any other problems you might find.
Here is the code: ${code}
`;
// ~60 tokens of preamble

// ✅ Good: Direct and structured
const goodPrompt = `Review this code for bugs, performance, and security issues:

\`\`\`typescript
${code}
\`\`\`

Format: bullet list, severity (high/medium/low) per issue.`;
// ~20 tokens of preamble, clearer output
```

### Constrain the Output

```typescript
// ❌ Bad: Open-ended → unpredictable length
"Summarize this article."

// ✅ Good: Constrained → predictable, cheaper
"Summarize this article in 3 bullet points, max 15 words each."

// ❌ Bad: Asks for explanation when you just need a value
"What sentiment is this review? Explain your reasoning."

// ✅ Good: Extract only what you need
"Classify sentiment. Reply with exactly one word: positive, negative, or neutral."
```

---

## Structured Prompting Patterns

### 1. Role + Task + Format

```typescript
function buildPrompt(role: string, task: string, format: string, input: string): string {
  return `${role}

Task: ${task}

${format}

Input:
${input}`;
}

// Example
const prompt = buildPrompt(
  "You are a senior TypeScript developer.",
  "Review the following function for correctness and suggest improvements.",
  "Output format:\n- Issues: [list]\n- Suggestions: [list]\n- Verdict: pass/fail",
  codeSnippet
);
```

### 2. Few-Shot Examples

```typescript
// Few-shot: show examples to guide output format
const classifyPrompt = `Classify customer feedback as: bug, feature-request, or praise.

Examples:
Input: "The app crashes when I upload files"
Output: bug

Input: "Would love dark mode support"
Output: feature-request

Input: "Love the new dashboard design!"
Output: praise

Input: "${userFeedback}"
Output:`;

// Model learns the exact format from examples → no post-processing needed
```

### 3. Chain-of-Thought (for complex reasoning)

```typescript
// Add "think step by step" only when reasoning matters
const complexPrompt = `You are a code reviewer.

Analyze this function for potential race conditions. Think through:
1. What shared state exists?
2. What operations are non-atomic?
3. What concurrent scenarios could cause issues?

Then give your verdict.

Code:
${code}`;

// Note: CoT increases output tokens — only use when accuracy > cost
```

### 4. XML Tags for Structure (Anthropic)

```typescript
// Anthropic models respond well to XML-tagged sections
const structuredPrompt = `<context>
${backgroundInfo}
</context>

<task>
Extract all action items from the meeting notes above.
</task>

<format>
JSON array: [{"owner": string, "task": string, "deadline": string | null}]
</format>

<notes>
${meetingNotes}
</notes>`;
```

---

## Output Format Control

### Force JSON Output

```typescript
// OpenAI: use response_format
const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  response_format: { type: "json_object" },
  messages: [
    {
      role: "system",
      content: "You are a data extractor. Always respond with valid JSON.",
    },
    {
      role: "user",
      content: `Extract name, email, phone from: "${contactText}"`,
    },
  ],
});

// Anthropic: instruct in prompt + parse
const anthropicPrompt = `Extract contact info from the text below.

Respond with ONLY valid JSON, no explanation:
{"name": string, "email": string | null, "phone": string | null}

Text: ${contactText}`;
```

### Limit Response Length

```typescript
// In prompt
"Answer in max 2 sentences."
"List up to 5 items."
"One-word answer only."

// In API params
await client.messages.create({
  max_tokens: 100, // Hard limit
  messages: [{ role: "user", content: prompt }],
});
```

---

## Token Reduction Techniques

### 1. Abbreviate Repeated Context

```typescript
// ❌ Bad: Repeat full schema every message
const schema = `
The user object has: id (string, UUID), email (string, required), 
name (string, required), createdAt (Date), updatedAt (Date), 
role (enum: admin|user|guest), isActive (boolean)...
`;

// ✅ Good: Define once, reference by name
const systemPrompt = `
Schema reference:
- User: {id, email, name, createdAt, updatedAt, role: admin|user|guest, isActive}
- Post: {id, title, content, authorId, publishedAt, tags: string[]}
`;
// Then in messages: "Validate this User object" — model knows the schema
```

### 2. Use Placeholders for Repeated Patterns

```typescript
// Template with minimal boilerplate
function makeReviewPrompt(code: string, language: string): string {
  return `${language} code review — bugs and security only, bullet list:

\`\`\`${language}
${code}
\`\`\``;
}
// ~15 tokens overhead vs ~60 for verbose version
```

### 3. Batch Multiple Tasks

```typescript
// ❌ Bad: 3 separate API calls
const sentiment = await classify(text, "sentiment");
const language = await classify(text, "language");
const topics = await classify(text, "topics");

// ✅ Good: 1 API call, 3 results
const batchPrompt = `Analyze this text and return JSON:
{
  "sentiment": "positive|negative|neutral",
  "language": "ISO 639-1 code",
  "topics": ["topic1", "topic2"] // max 3
}

Text: "${text}"`;
```

### 4. Summarize Before Sending

```typescript
// For long documents, summarize first then query
async function queryLongDocument(doc: string, question: string): Promise<string> {
  // Step 1: Summarize (cheap model, limited output)
  const summary = await client.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: `Summarize the key facts from this document in 300 words:\n\n${doc}`,
    }],
  });

  const summaryText = summary.content[0].type === "text" ? summary.content[0].text : "";

  // Step 2: Answer from summary (much fewer tokens)
  const answer = await client.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 256,
    messages: [{
      role: "user",
      content: `Based on this summary, answer: ${question}\n\nSummary: ${summaryText}`,
    }],
  });

  return answer.content[0].type === "text" ? answer.content[0].text : "";
}
```

---

## System Prompt Best Practices

```typescript
// ✅ Effective system prompt structure
const systemPrompt = `You are a [specific role].

Rules:
- [Most important constraint]
- [Second constraint]
- [Output format requirement]

Never: [what to avoid]`;

// Keep system prompts under 200 tokens for simple agents
// Use bullet points, not paragraphs
// Put output format requirements in system prompt, not user messages
```

---

## Prompt Testing

```typescript
// Test prompts with different inputs before production
interface PromptTest {
  input: string;
  expectedOutput: string;
  maxTokens: number;
}

async function testPrompt(
  promptFn: (input: string) => string,
  tests: PromptTest[]
): Promise<void> {
  for (const test of tests) {
    const prompt = promptFn(test.input);
    const tokenCount = estimateTokens(prompt);

    console.log(`Input tokens: ${tokenCount}`);
    if (tokenCount > test.maxTokens) {
      console.warn(`⚠️ Prompt exceeds ${test.maxTokens} token budget`);
    }

    const response = await makeAPICall(prompt);
    const matches = response.includes(test.expectedOutput);
    console.log(matches ? "✅ Pass" : `❌ Fail — got: ${response}`);
  }
}
```

---

## Common Mistakes

```typescript
// ❌ Asking for explanation when you need a value
"What is the sentiment of this text? Please explain your reasoning in detail."
// → 200+ output tokens

// ✅ Ask for the value directly
"Sentiment of this text (one word: positive/negative/neutral):"
// → 1-3 output tokens

// ❌ Redundant politeness in prompts
"Could you please kindly help me to possibly summarize..."
// → Wasted tokens, no quality benefit

// ✅ Direct instruction
"Summarize in 3 bullet points:"

// ❌ Sending raw HTML/markdown to the model
const rawPage = await fetch(url).then(r => r.text()); // 50KB HTML
await client.messages.create({ messages: [{ role: "user", content: rawPage }] });

// ✅ Extract text first
import { JSDOM } from "jsdom";
const dom = new JSDOM(rawPage);
const text = dom.window.document.body.textContent?.trim() || "";
// Now send ~5KB text instead of 50KB HTML
```

---

## Pre-Commit Checklist

- [ ] System prompt is under 300 tokens (unless RAG/complex agent)
- [ ] Output format explicitly specified in prompt
- [ ] `max_tokens` set appropriately for expected output length
- [ ] No redundant preamble ("Please help me...", "I would like you to...")
- [ ] Batch multiple classifications into one call where possible
- [ ] Long documents summarized before querying
- [ ] Few-shot examples added for non-standard output formats
- [ ] Prompt tested with edge cases (empty input, very long input)

---

## Resources

- [Anthropic Prompt Engineering Guide](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
- [OpenAI Prompt Engineering](https://platform.openai.com/docs/guides/prompt-engineering)
- [Brex Prompt Engineering Guide](https://github.com/brexhq/prompt-engineering)
- [tiktoken](https://www.npmjs.com/package/tiktoken) — token counting
