"use client";

import React, { createContext, useContext, useMemo } from "react";
import { submitMcq } from "@/actions/contest";

export type ExecutionAction = "run" | "submit";

export interface ExecutionResult {
  success: boolean;
  results?: TestCaseResult[];
  score?: number;
  overallStatus?: string;
  passedCount?: number;
  totalCount?: number;
  rateLimited?: boolean;
  systemFault?: boolean;
  error?: string;
  message?: string;
}

export interface TestCaseResult {
  testCase: number;
  passed: boolean;
  status: string;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  error?: string;
  isVisible: boolean;
}

export interface McqSaveResult {
  success: boolean;
  error?: string;
  rateLimited?: boolean;
}

export interface AttemptRuntime {
  mode: "contest" | "preview";
  execute(
    action: ExecutionAction,
    questionId: string,
    code: string,
    language: string,
    onExecuting: () => void
  ): Promise<ExecutionResult>;
  saveMcqAnswer(questionId: string, answers: string[]): Promise<McqSaveResult>;
}

const AttemptRuntimeContext = createContext<AttemptRuntime | null>(null);

export function useAttemptRuntime(): AttemptRuntime {
  const runtime = useContext(AttemptRuntimeContext);
  if (!runtime) {
    throw new Error("useAttemptRuntime must be used within an attempt runtime provider");
  }
  return runtime;
}

function toBase64(str: string) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(str)));
}

async function streamExecution(
  url: string,
  questionId: string,
  code: string,
  language: string,
  onExecuting: () => void
): Promise<ExecutionResult> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      questionId,
      code: toBase64(code),
      language,
      isBase64: true,
    }),
  });

  // Errors (rate limits, validation, auth) come back as a plain JSON body, not as an
  // ndjson frame — parse them here or they fall through as an empty stream.
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return {
      success: false,
      rateLimited: res.status === 429,
      error: body?.error || (res.status === 429
        ? "Too many attempts.. wait a minute"
        : `Request failed (${res.status})`),
    };
  }

  if (!res.body) throw new Error("No response stream");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalData: ExecutionResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const msg = JSON.parse(line);
      // The server writes its first progress frame once it hands the code to the
      // engine, so it marks the move out of the queue.
      if (msg.type === "progress") onExecuting();
      else if (msg.type === "error") throw new Error(msg.error);
      else if (msg.type === "done") finalData = msg;
    }
  }

  return finalData ?? { success: false, error: "Execution ended without a result" };
}

export function ContestAttemptRuntime({
  contestId,
  children,
}: {
  contestId: string;
  children: React.ReactNode;
}) {
  const runtime = useMemo<AttemptRuntime>(() => ({
    mode: "contest",
    execute: (action, questionId, code, language, onExecuting) =>
      streamExecution(`/api/test/${contestId}/${action}`, questionId, code, language, onExecuting),
    saveMcqAnswer: (questionId, answers) => submitMcq(contestId, questionId, answers),
  }), [contestId]);

  return (
    <AttemptRuntimeContext.Provider value={runtime}>
      {children}
    </AttemptRuntimeContext.Provider>
  );
}

export function PreviewAttemptRuntime({
  questionId,
  children,
}: {
  questionId: string;
  children: React.ReactNode;
}) {
  const runtime = useMemo<AttemptRuntime>(() => ({
    mode: "preview",
    execute: (action, _questionId, code, language, onExecuting) =>
      streamExecution(
        `/api/admin/questions/${questionId}/preview/${action}`,
        questionId,
        code,
        language,
        onExecuting
      ),
    saveMcqAnswer: async () => ({ success: true }),
  }), [questionId]);

  return (
    <AttemptRuntimeContext.Provider value={runtime}>
      {children}
    </AttemptRuntimeContext.Provider>
  );
}
