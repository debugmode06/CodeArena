"use client";

import React from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";
  const router = useRouter();

  const handleJoinClick = () => {
    if (!isSignedIn) {
      router.push("/auth/login");
    } else {
      router.push("/join");
    }
  };

  return (
    <section className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-5">
      <div className="text-center space-y-4 mx-auto">
        <Image 
          src="/icon.svg" 
          alt="Pomelo Icon" 
          width={120} 
          height={120} 
          className="mx-auto -mt-24 drop-shadow-md" 
          priority
        />
        
        <div className="flex items-center justify-center gap-4 py-6">
          <div className="h-[2px] w-32 bg-linear-to-r from-transparent via-primary/50 to-primary/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
          <div className="h-[2px] w-32 bg-linear-to-l from-transparent via-primary/50 to-primary/80" />
        </div>

        <h1 className="text-6xl font-bold text-foreground">
          Powerful, Effortless Coding Events.
        </h1>
        <p className="text-lg text-muted-foreground max-w-[600px] mx-auto">
          Host or join programming contests, assessments, and challenges with a
          modern, reliable platform.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Button onClick={handleJoinClick}>
            Join a Test
          </Button>
        </div>
      </div>
    </section>
  );
}
