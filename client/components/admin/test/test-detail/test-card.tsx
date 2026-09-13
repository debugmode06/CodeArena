"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, FileText, Calendar } from "lucide-react";
import { Test } from "@/types/test";

interface TestInformationCardProps {
  test: Test;
}

export function TestInformationCard({ test }: TestInformationCardProps) {
  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Test Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">Duration</span>
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="h-4 w-4 text-primary/70" />
            <span className="font-semibold">{test.duration}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">
            Total Questions
          </span>
          <div className="flex items-center gap-2 text-foreground">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-semibold">{test.totalQuestions}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">Starts At</span>
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4 text-primary/50" />
            <span className="font-semibold text-sm sm:text-base">
              {new Date(test.startsAt).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">Ends At</span>
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4 text-primary/50" />
            <span className="font-semibold text-sm sm:text-base">
              {new Date(test.endsAt || "").toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between overflow-hidden gap-4">
          <span className="text-muted-foreground font-medium whitespace-nowrap">Join Code</span>
          <span className="text-primary font-bold font-mono text-lg tracking-widest bg-primary/10 px-3 py-1 rounded-md border border-primary/20 truncate">
            {test.joinId}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
