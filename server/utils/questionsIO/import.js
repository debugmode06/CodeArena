const {
  importInputSchema,
} = require("./validators");
const { getJudge } = require("@pomelo/code-gen");

/**
 * Validates import JSON against schema
 * @param {unknown} jsonData - Parsed JSON data to validate
 * @returns {any} ValidationResult with errors if any
 */
function validateImportJSON(jsonData) {
  try {
    const result = importInputSchema.safeParse(jsonData);

    if (!result.success) {
      const errors = result.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          message:
            error instanceof Error
              ? error.message
              : "Unknown validation error",
        },
      ],
    };
  }
}

/**
 * Converts import JSON to MongoDB insert queries
 * @param {unknown} jsonData - Parsed JSON data to transform
 * @returns {any} ImportTransformResult with queries and any warnings
 */
function transformAndCreateInsertQueries(jsonData) {
  const validation = validateImportJSON(jsonData);
  if (!validation.valid) {
    return {
      valid: false,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  try {
    let questions = [];
    const warnings = [];

    // Handle both single question and bulk format
    if (Array.isArray(jsonData)) {
      questions = jsonData;
    } else if (
      typeof jsonData === "object" &&
      jsonData !== null &&
      "questions" in jsonData
    ) {
      const bulkData = jsonData;
      if (Array.isArray(bulkData.questions)) {
        questions = bulkData.questions;
      }
    } else if (typeof jsonData === "object" && jsonData !== null) {
      questions = [jsonData];
    }

    if (questions.length === 0) {
      return {
        valid: false,
        errors: [{ message: "No valid questions found in import data" }],
      };
    }

    const queries = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      try {
        const mongoDoc = transformQuestionToMongo(question);
        queries.push(mongoDoc);
      } catch (error) {
        return {
          valid: false,
          errors: [
            {
              index: i,
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to transform question",
            },
          ],
        };
      }
    }

    // Check for potential issues
    const titles = queries.map((q) => q.title);
    const duplicates = titles.filter(
      (title, index) => titles.indexOf(title) !== index
    );
    if (duplicates.length > 0) {
      warnings.push(
        `Found ${duplicates.length} duplicate question title(s). Questions were imported, but consider updating titles for clarity.`
      );
    }

    return {
      valid: true,
      errors: [],
      warnings,
      queries,
      count: queries.length,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          message:
            error instanceof Error
              ? error.message
              : "Failed to transform questions",
        },
      ],
    };
  }
}

/**
 * Transforms a single question from import format to MongoDB format
 * @param {any} question - Question object to transform
 * @returns {Record<string, unknown>} MongoDB document ready for insertion
 */
function transformQuestionToMongo(question) {
  const baseDoc = {
    type: question.type,
    title: question.title,
    description: question.description,
    marks: question.marks,
    difficulty: question.difficulty || "Medium",
  };

  if (question.type === "coding") {
    const coding = question;
    
    // Auto-generate boilerplate code if not provided or empty
    let boilerplateCode = coding.boilerplateCode;
    if (!boilerplateCode || Object.keys(boilerplateCode).length === 0) {
      boilerplateCode = {};
      const supportedLangs = ['c', 'cpp', 'java', 'python'];
      const inputs = (coding.inputVariables || []).map(v => ({
        variable: v.variable,
        type: v.type
      }));

      supportedLangs.forEach(lang => {
        try {
          const judge = getJudge(lang);
          boilerplateCode[lang] = judge.generateBoilerplate({
            method: coding.functionName,
            input: inputs
          });
        } catch (err) {
          console.warn(`Skipping boilerplate for ${lang}: ${err.message}`);
        }
      });
    }

    return {
      ...baseDoc,
      questionType: "Coding",
      constraints: coding.constraints || "",
      inputFormat: coding.inputFormat,
      outputFormat: coding.outputFormat,
      boilerplateCode,
      functionName: coding.functionName,
      inputVariables: coding.inputVariables,
      testcases: coding.testcases || [],
    };
  } else if (question.type === "mcq") {
    const mcq = question;

    // correctAnswer is an option index (or array of indices)
    const answerArray = Array.isArray(mcq.correctAnswer) ? mcq.correctAnswer : [mcq.correctAnswer];

    // Sort indices for consistency and remove duplicates
    const uniqueIndices = [...new Set(answerArray)].sort((a, b) => a - b);
    const correctAnswerValue = uniqueIndices.join(",");
    const multipleCorrect = uniqueIndices.length > 1;

    return {
      ...baseDoc,
      questionType: mcq.questionType || (multipleCorrect ? "Multiple Correct" : "Single Correct"),
      options: mcq.options,
      correctAnswer: correctAnswerValue,
      multipleCorrect,
    };
  }

  throw new Error(`Unknown question type: ${question.type}`);
}

/**
 * Parses raw JSON string for import
 * @param {string} jsonString - Raw JSON string
 * @returns {unknown} Parsed data
 */
function parseImportJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(
      `Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Complete import workflow: parse → validate → transform
 * @param {string} jsonString - Raw JSON string from file/textarea
 * @returns {any} ImportTransformResult with full validation and transformation
 */
function processImportJSON(jsonString) {
  try {
    const parsed = parseImportJSON(jsonString);
    return transformAndCreateInsertQueries(parsed);
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          message:
            error instanceof Error ? error.message : "Failed to process JSON",
        },
      ],
    };
  }
}

module.exports = {
  validateImportJSON,
  transformAndCreateInsertQueries,
  parseImportJSON,
  processImportJSON,
};
