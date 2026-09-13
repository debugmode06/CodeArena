"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { useTestCompletion } from "./use-test-completion";

const WARNING_THRESHOLD_SECONDS = 5 * 60;

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

interface TestTimerProps {
  initialSecondsRemaining: number;
}

export default function TestTimer({ initialSecondsRemaining }: TestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(Math.max(0, Math.floor(initialSecondsRemaining)));
  const { completeTest } = useTestCompletion();
  const hasAutoSubmitted = useRef(false);

  // Ticks down once per second for the lifetime of the component.
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fires exactly once when the countdown reaches zero.
  useEffect(() => {
    if (secondsLeft > 0 || hasAutoSubmitted.current) return;

    hasAutoSubmitted.current = true;
    completeTest({
      forced: true,
      autoSubmitReason: "TIME_EXPIRED",
      successMessage: "Time's up! Your test has been submitted automatically.",
    });
  }, [secondsLeft, completeTest]);

  const isWarning = secondsLeft <= WARNING_THRESHOLD_SECONDS;

  return (
    <div
      className={`flex items-center gap-1.5 px-3 h-8 border rounded-full text-xs font-medium transition-colors ${
        isWarning
          ? "bg-destructive/20 text-destructive-foreground border-destructive/40 animate-pulse"
          : "bg-primary-foreground/10 text-primary-foreground/90 border-primary-foreground/20"
      }`}
      title="Time remaining"
    >
      <Clock className="h-3.5 w-3.5" />
      <span className="tabular-nums">{formatTime(secondsLeft)}</span>
    </div>
  );
}
