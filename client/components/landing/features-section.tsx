"use client";

import React from "react";
import {
  Trophy,
  Lock,
  LayoutDashboard,
  UserPlus,
  ListOrdered,
  Brush,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  [
    {
      title: "For Participants",
      description: "Join contests, solve challenges, and track your progress in real time.",
      icon: <Trophy className="text-muted-foreground mb-2" size={32} />,
    },
    {
      title: "Secure & Private",
      description: "All data and submissions are protected and confidential.",
      icon: <Lock className="text-muted-foreground mb-2" size={32} />,
    },
  ],
  [
    {
      title: "For Organizers",
      description: "Create events, upload problems, and manage contests with powerful tools.",
      icon: <LayoutDashboard className="text-muted-foreground mb-2" size={32} />,
    },
    {
      title: "Easy Signups",
      description: "Get participants onboarded instantly with a seamless registration process.",
      icon: <UserPlus className="text-muted-foreground mb-2" size={32} />,
    },
  ],
  [
    {
      title: "Real-Time Ranking",
      description: "Automatic, live leaderboard updates for every contest.",
      icon: <ListOrdered className="text-muted-foreground mb-2" size={32} />,
    },
    {
      title: "Custom Branding",
      description: "Apply your own logo and colors for a personalized experience.",
      icon: <Brush className="text-muted-foreground mb-2" size={32} />,
    },
  ],
];

export default function FeaturesSection() {
  return (
    <section className="py-10 bg-background transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((column, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-8 h-full">
              {column.map((feature) => (
                <Card key={feature.title} className="flex-1 h-full flex flex-col bg-background">
                  <CardContent className="flex flex-row items-start gap-4 p-6 h-full">
                    <div className="shrink-0">{feature.icon}</div>
                    <div className="text-left">
                      <h3 className="font-bold text-lg text-foreground mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-tight">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
