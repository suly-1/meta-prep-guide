/**
 * OpenAI browser client helper
 * API key is stored in localStorage — never sent to any server
 */

const STORAGE_KEY = "meta_prep_openai_key";

export function getOpenAIKey(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setOpenAIKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key.trim());
}

export function clearOpenAIKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasOpenAIKey(): boolean {
  const key = getOpenAIKey();
  return !!key && key.startsWith("sk-");
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callOpenAI(
  messages: Message[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const key = getOpenAIKey();
  if (!key) throw new Error("NO_KEY");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 401) throw new Error("INVALID_KEY");
    if (response.status === 429) throw new Error("RATE_LIMIT");
    throw new Error(err?.error?.message ?? "AI request failed");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── AI feature helpers ─────────────────────────────────────────────────────────

export async function reviewCode(
  code: string,
  problem: { title: string; description: string; topic: string },
  language: string
): Promise<string> {
  return callOpenAI([
    {
      role: "system",
      content: `You are a Meta senior engineer conducting a code review for an L6/L7 interview. 
Evaluate the solution on: correctness, time/space complexity, code quality, edge cases, and FAANG-level signals (scalability, clean abstractions).
Format your response with these sections:
## Overall Score: X/10
## Correctness
## Complexity Analysis  
## Code Quality
## Edge Cases
## L6/L7 Signal
## What to Improve`,
    },
    {
      role: "user",
      content: `Problem: ${problem.title}\nTopic: ${problem.topic}\nDescription: ${problem.description}\n\nCandidate's ${language} solution:\n\`\`\`${language}\n${code}\n\`\`\``,
    },
  ]);
}

export async function getHint(
  code: string,
  problem: { title: string; description: string; hints: string[] },
  level: 1 | 2 | 3
): Promise<string> {
  const levelDesc =
    level === 1
      ? "subtle nudge (no code)"
      : level === 2
        ? "algorithmic direction"
        : "concrete approach with pseudocode";
  return callOpenAI(
    [
      {
        role: "system",
        content: `You are a FAANG-style interviewer giving a level-${level} hint: ${levelDesc}. Be concise and helpful without giving away the full solution.`,
      },
      {
        role: "user",
        content: `Problem: ${problem.title}\nDescription: ${problem.description}\n\nCurrent code:\n\`\`\`\n${code || "(empty)"}\n\`\`\`\n\nGive a level ${level} hint.`,
      },
    ],
    { maxTokens: 300 }
  );
}

export async function scoreSTAR(
  question: string,
  answer: string
): Promise<string> {
  return callOpenAI([
    {
      role: "system",
      content: `You are a Meta recruiter scoring a behavioral answer using the STAR framework for L6/L7 level.
Score each dimension 1-5 and give specific feedback.
Format:
## STAR Score: X/20
**Situation** (X/5): ...
**Task** (X/5): ...
**Action** (X/5): ...
**Result** (X/5): ...
## IC Level Signal: L4 / L5 / L6 / L7
## Key Strengths
## What to Add`,
    },
    {
      role: "user",
      content: `Behavioral question: "${question}"\n\nCandidate's answer:\n${answer}`,
    },
  ]);
}

export async function generateFollowUps(
  problem: { title: string; description: string },
  code: string
): Promise<string> {
  return callOpenAI(
    [
      {
        role: "system",
        content:
          "You are a FAANG-style interviewer. Generate 4 follow-up questions an interviewer would ask after seeing this solution. Focus on scalability, edge cases, and design decisions. Format as a numbered list.",
      },
      {
        role: "user",
        content: `Problem: ${problem.title}\nSolution:\n\`\`\`\n${code}\n\`\`\``,
      },
    ],
    { maxTokens: 400 }
  );
}
