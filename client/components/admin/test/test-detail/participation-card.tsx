import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Test } from "@/types/test";

interface ParticipationStatisticsCardProps {
  test: Test;
}

export function ParticipationStatisticsCard({
  test,
}: ParticipationStatisticsCardProps) {
  const { status, participantsInProgress, participantsCompleted } = test;

  const inProgress = participantsInProgress;
  const completed = participantsCompleted;

  const total = inProgress + completed;

  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary/70" />
          Participation Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">
            Total Participants
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-foreground">
            {total}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">
              In Progress
            </span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary/70 rounded-full"></div>
              <span className="text-foreground font-semibold">
                {inProgress}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Completed</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-foreground font-semibold">{completed}</span>
            </div>
          </div>
        </div>

        {status !== "waiting" && total > 0 && (
          <div className="pt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>{status === "completed" ? "Completion" : "Progress"}</span>
              <span>{Math.round((completed / total) * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  status === "completed"
                    ? "bg-primary"
                    : "bg-gradient-to-r from-primary/70 to-primary"
                }`}
                style={{
                  width: `${(completed / total) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
