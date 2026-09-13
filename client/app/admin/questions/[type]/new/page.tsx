// app/questions/[type]/new/page.tsx
import QuestionForm from "@/components/admin/question/question-form";
import { notFound } from "next/navigation";

const VALID_TYPES = ["coding", "mcq"] as const;

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!VALID_TYPES.includes(type as typeof VALID_TYPES[number])) return notFound();

  return <QuestionForm type={type as "coding" | "mcq"} isCreating={true} />;
}
