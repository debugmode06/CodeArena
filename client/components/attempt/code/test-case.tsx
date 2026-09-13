"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CodeXml, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";

import { toast } from "@/components/ui/banner";
import { CodingProblem } from "@/types/problem";
import { useAttemptRuntime, TestCaseResult } from "../attempt-runtime";

export default function TestCasePanel({
  problem,
  code,
  language,
}: {
  problem: CodingProblem;
  code: string;
  language: string;
}) {
  const runtime = useAttemptRuntime();
  const [view, setView] = useState<"initial" | "sample" | "hidden">("initial");
  const [runningAction, setRunningAction] = useState<"run" | "submit" | null>(null);
  const [phase, setPhase] = useState<"queued" | "executing" | null>(null);
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [score, setScore] = useState<number | null>(null);

  // Preview is admin-only and receives hidden test data, so it always uses the
  // detailed view. A contest submit stays on the summary view.
  const isPreview = runtime.mode === "preview";

  const execute = async (action: "run" | "submit") => {
    setRunningAction(action);
    setPhase("queued");
    setResults([]);
    setScore(null);
    setActiveTestCase(0);
    setView(action === "run" || isPreview ? "sample" : "hidden");
    try {
      const data = await runtime.execute(action, String(problem.id), code, language, () =>
        setPhase("executing")
      );
      if (data.success) {
        setResults(data.results || []);
        setScore(action === "submit" && typeof data.score === "number" ? data.score : null);
      } else if (data.systemFault) {
        toast.error("Execution engine unavailable", {
          description:
            action === "submit"
              ? "Nothing was submitted and your previous result is unchanged. Try again in a moment."
              : "Could not run your code. Try again in a moment.",
        });
      } else {
        toast.error(
          data.error || data.message || `Failed to ${action === "run" ? "run" : "submit"} code`
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
    } finally {
      setRunningAction(null);
      setPhase(null);
    }
  };

  const isRunning = runningAction !== null;
  const handleRun = () => execute("run");
  const handleSubmit = () => execute("submit");

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b flex items-center justify-between text-sm h-11 bg-muted">
        <Label className="flex items-center gap-2">
          <CodeXml className="h-4 w-4" />
          Test Cases
        </Label>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRun}
            disabled={isRunning}
          >
            {runningAction === "run" ? "Running..." : "Run"}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isRunning}
          >
            {runningAction === "submit" ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1 min-h-0 p-4">
        {isRunning && (
          <div className="flex flex-col items-center justify-center text-center h-full gap-3 py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              {phase === "executing" ? "Executing" : "Queued"}
            </p>
          </div>
        )}

        {!isRunning && view === "initial" && (
          <div className="flex flex-col items-center justify-center text-center text-sm text-muted-foreground h-full gap-2 py-10">
            <EyeOff className="w-6 h-6" />
            <p>You haven’t run your code yet.</p>
          </div>
        )}

        {!isRunning && view === "sample" && results.length > 0 && (
          <div className="flex flex-col space-y-4">
            {score !== null && (
              <div className="flex items-center justify-between rounded-md border px-3 py-2 bg-muted/30">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Score
                </span>
                <span className="text-sm font-bold">
                  {score} / {problem.marks}
                </span>
              </div>
            )}

            <div className="grid gap-2 max-h-32 overflow-y-auto pb-2 border-b border-border/50 [grid-template-columns:repeat(auto-fill,minmax(6.5rem,1fr))]">
              {results.map((tc, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestCase(idx)}
                  className={`px-2 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
                    activeTestCase === idx
                      ? tc.passed
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                      : tc.passed
                        ? "bg-primary/5 text-primary/60 border border-primary/10 hover:bg-primary/10"
                        : "bg-destructive/5 text-destructive/60 border border-destructive/10 hover:bg-destructive/10"
                  }`}
                >
                  {tc.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  Case {idx + 1}
                  {tc.isVisible === false && <EyeOff className="w-3 h-3 opacity-70" />}
                </button>
              ))}
            </div>

            {results[activeTestCase]?.isVisible === false && (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
                <EyeOff className="h-3.5 w-3.5 shrink-0" />
                Hidden test case. Candidates never see this data.
              </div>
            )}

            <div className="pt-2">
              {results[activeTestCase] && (
                <div className="space-y-5">
                  {results[activeTestCase].input && (
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">Input</Label>
                      <pre className="bg-muted px-4 py-3 rounded-lg font-mono text-[13px] whitespace-pre-wrap break-words border border-border/50">
                        {results[activeTestCase].input}
                      </pre>
                    </div>
                  )}

                  {results[activeTestCase].expectedOutput && (
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">Expected Output</Label>
                      <pre className="bg-muted px-4 py-3 rounded-lg font-mono text-[13px] whitespace-pre-wrap break-words border border-border/50">
                        {results[activeTestCase].expectedOutput}
                      </pre>
                    </div>
                  )}

                  {results[activeTestCase].actualOutput !== undefined && (
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">Your Output</Label>
                      <pre className="bg-muted px-4 py-3 rounded-lg font-mono text-[13px] whitespace-pre-wrap break-words border border-border/50">
                        {results[activeTestCase].actualOutput !== ""
                          ? results[activeTestCase].actualOutput 
                          : <span className="text-muted-foreground italic">No output</span>}
                      </pre>
                    </div>
                  )}
                  
                  {!results[activeTestCase].passed && results[activeTestCase].error && (
                    <div className="space-y-1.5">
                      <Label className="text-destructive font-semibold uppercase tracking-wider text-[11px]">Error Logs</Label>
                      <pre className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg font-mono text-[13px] overflow-x-auto border border-destructive/20 whitespace-pre-wrap">
                        {results[activeTestCase].error}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {!isRunning && view === "hidden" && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 border rounded-md py-2 px-3 flex items-center justify-between bg-primary/5 border-primary/10">
                <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Passed</div>
                <div className="text-sm font-bold text-primary">
                  {results.filter(r => r.passed).length}
                </div>
              </div>
              <div className="flex-1 border rounded-md py-2 px-3 flex items-center justify-between bg-destructive/5 border-destructive/10">
                <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Failed</div>
                <div className="text-sm font-bold text-destructive">
                  {results.filter(r => !r.passed).length}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {results.map((tc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border rounded-md px-4 py-3 bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    {tc.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                    <div className="text-sm font-medium text-foreground">
                      {`Hidden Testcase ${idx + 1}`}
                    </div>
                  </div>
                  <Badge variant={tc.passed ? "default" : "destructive"}>
                    {tc.passed ? "Passed" : tc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
