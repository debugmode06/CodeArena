const { z } = require("zod");
const {
  SUPPORTED_TYPES,
  validateProblemConfig,
  validateValues,
  parseTokens,
} = require("@pomelo/code-gen");

// Base schema for all questions
const baseQuestionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  marks: z.number().min(0, "Marks must be non-negative"),
  difficulty: z
    .enum(["Easy", "Medium", "Hard"])
    .optional()
    .default("Medium"),
});

// Input variable schema
const inputVariableSchema = z.object({
  variable: z.string().min(1, "Variable name is required"),
  type: z.enum(SUPPORTED_TYPES),
});

// Test case schema
const testCaseSchema = z.object({
  input: z.string().min(1, "Input is required"),
  output: z.string(),
  explanation: z.string().optional(),
  isVisible: z.boolean().optional().default(false),
});

// Coding question schema
const codingQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("coding"),
  inputFormat: z.string().min(1, "Input format is required"),
  outputFormat: z.string().min(1, "Output format is required"),
  constraints: z.string().optional(),
  boilerplateCode: z
    .record(z.string(), z.string())
    .optional(),
  functionName: z.string().min(1, "Function name is required"),
  inputVariables: z
    .array(inputVariableSchema)
    .min(1, "At least one input variable is required"),
  testcases: z.array(testCaseSchema).optional(),
}).superRefine((coding, ctx) => {
  const signatureErrors = validateProblemConfig({
    method: coding.functionName,
    input: coding.inputVariables,
  });

  signatureErrors.forEach((message) => {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["inputVariables"],
      message,
    });
  });

  // Only meaningful once the signature itself is sound — the wire format is
  // read positionally against inputVariables.
  if (signatureErrors.length > 0) return;

  (coding.testcases || []).forEach((testcase, index) => {
    validateValues(parseTokens(testcase.input, coding.inputVariables), coding.inputVariables)
      .forEach(({ message }) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["testcases", index, "input"],
          message,
        });
      });
  });
});

// MCQ question schema
const mcqQuestionSchema = baseQuestionSchema
  .extend({
    type: z.literal("mcq"),
    questionType: z
      .enum(["Single Correct", "Multiple Correct"])
      .optional()
      .default("Single Correct"),
    options: z
      .array(z.string().min(1, "Option text cannot be empty"))
      .min(2, "At least 2 options are required")
      .max(10, "Maximum 10 options allowed"),
    correctAnswer: z.union([
      z.number().int("Correct answer must be an option index").min(0),
      z
        .array(z.number().int("Correct answer must be an option index").min(0))
        .min(1, "At least one correct answer is required"),
    ]),
    multipleCorrect: z.boolean().optional(),
  })
  .superRefine((mcq, ctx) => {
    const indices = Array.isArray(mcq.correctAnswer) ? mcq.correctAnswer : [mcq.correctAnswer];
    indices.forEach((idx) => {
      if (idx >= mcq.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["correctAnswer"],
          message: `Correct answer index ${idx} is out of range for ${mcq.options.length} options`,
        });
      }
    });
  });

// Combined question schema (discriminated union)
const questionSchema = z.discriminatedUnion("type", [
  codingQuestionSchema,
  mcqQuestionSchema,
]);

const singleQuestionSchema = questionSchema;

const bulkImportSchema = z.object({
  questions: z.array(questionSchema),
  meta: z
    .object({
      type: z.string().optional(),
      description: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

// Flexible import that accepts either format
const importInputSchema = z.union([
  bulkImportSchema,
  questionSchema,
]);

// Export schema
const exportPayloadSchema = z.object({
  questions: z.array(questionSchema),
  meta: z.object({
    exportDate: z.string(),
    format: z.literal("v1"),
    count: z.number().min(0),
  }),
});

module.exports = {
  questionSchema,
  singleQuestionSchema,
  bulkImportSchema,
  importInputSchema,
  exportPayloadSchema,
};
