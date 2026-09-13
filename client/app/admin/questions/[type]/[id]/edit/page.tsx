// app/questions/[type]/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import QuestionForm from "@/components/admin/question/question-form";
import { db } from "@/lib/db";
import { QuestionSchema } from "@/types/problem";

const VALID_TYPES = ["coding", "mcq"] as const;

interface MongoQuestion {
  _id: string;
  id?: string;
  type: "coding" | "mcq";
  title: string;
  description: string;
  marks?: number;
  points?: number;
  difficulty?: string;
  questionType?: string;
  inputFormat?: string;
  outputFormat?: string;
  // Coding fields
  boilerplateCode?: Record<string, string>;
  constraints?: string | string[];
  functionName?: string;
  inputVariables?: { variable: string; type: string }[];
  testcases?: { input: Record<string, unknown>; output: string }[];
  // MCQ fields
  options?: (string | { id: string; text: string })[];
  correctAnswer?: string;
}

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  if (!VALID_TYPES.includes(type as "coding" | "mcq")) return notFound();

  let data: MongoQuestion | null = null;
  try {
    data = await db.findOne<MongoQuestion>("questions", { _id: id });
  } catch (e) {
    console.error(e);
  }

  if (!data || data.type !== type) return notFound();

  // Ensure data has string ID if component expects it, logic might need adjustment depending on QuestionForm props
  // MongoDB _id is generic, QuestionForm might expect specific shape.
  const mappedData: Record<string, unknown> = {
    ...data,
    id: data._id || data.id,
    // Map mismatched fields
    points: data.marks || data.points || 0,
    difficulty: data.difficulty?.toLowerCase() || "easy",
    // Coding specific
    inputFormat: data.inputFormat || "",
    outputFormat: data.outputFormat || "",
    boilerplate: data.boilerplateCode || {},
    constraints: typeof data.constraints === 'string'
      ? (data.constraints.includes('\n')
          ? data.constraints.split('\n').map((s: string) => s.trim()).filter(Boolean)
          : data.constraints.split(',').map((s: string) => s.trim()).filter(Boolean)) // legacy comma-joined fallback
      : (Array.isArray(data.constraints) ? data.constraints : [""]),
    functionName: data.functionName || "",
    inputVariables: data.inputVariables || [],
    testCases: data.testcases || [],

    // MCQ specific
    options: Array.isArray(data.options)
      ? data.options.map((opt, index) =>
        typeof opt === "string"
          ? { id: String(index), text: opt }
          : opt
      )
      : [
        { id: "0", text: "" },
        { id: "1", text: "" },
        { id: "2", text: "" },
        { id: "3", text: "" },
      ],
    correctAnswer: data.correctAnswer || "",
    questionType: data.questionType === "Multiple Correct" ? "multiple" : "single"
  };

  return (
    <QuestionForm
      type={type as "coding" | "mcq"}
      isCreating={false}
      initialData={mappedData as Partial<QuestionSchema>}
    />
  );
}
