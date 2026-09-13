import { auth } from "@/auth";
import { CodeScreen } from "@/components/attempt/code";
import React from "react";
import { CodingProblem, MCQProblem, Problem } from "@/types/problem";
import MCQScreen from "@/components/attempt/mcq";
import { redirect } from "next/navigation";
import { getBaseUrl } from "@/lib/env";

interface Props {
  params: Promise<{
    testid: string;
    qid: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function TestContentPage(props: Props) {
  const params = await props.params;
  const { testid, qid } = params;
  const session = await auth();

  // Fetch contest data via student API — ?qid trims every other question
  // down to {id, type} server-side, since only the current one is rendered.
  const res = await fetch(`${getBaseUrl()}/api/test/${testid}/data?qid=${qid}`, {
    headers: {
      "Authorization": `Bearer ${session?.backendToken}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  const result = await res.json();
  if (!result.success) {
    redirect(`/test/${testid}`);
  }

  const allProblems = (result.data?.problems || []) as Problem[];
  const currentProblem = allProblems.find(p => String(p.id) === qid);

  if (!currentProblem) {
    redirect(`/test/${testid}`);
  }

  return (
    <div className="w-full h-full">
      {currentProblem.type.toLowerCase() === "coding" ? (
        <CodeScreen problem={currentProblem as CodingProblem} />
      ) : (
        <MCQScreen
          problem={currentProblem as MCQProblem}
          problems={allProblems}
        />
      )}
    </div>
  );
}
