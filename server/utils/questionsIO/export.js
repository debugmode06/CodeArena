/**
 * Transforms a MongoDB question document to export JSON format
 * @param {any} mongoDoc - MongoDB question document
 * @returns {any} Question object ready for export
 */
function exportSingleQuestion(mongoDoc) {
  const { _id, createdAt, updatedAt, __v, ...questionData } = mongoDoc;

  if (questionData.type === "coding") {
    return {
      type: "coding",
      title: questionData.title,
      description: questionData.description,
      marks: questionData.marks,
      difficulty: questionData.difficulty,
      constraints: questionData.constraints,
      inputFormat: questionData.inputFormat,
      outputFormat: questionData.outputFormat,
      boilerplateCode: questionData.boilerplateCode,
      functionName: questionData.functionName,
      inputVariables: questionData.inputVariables,
      testcases: questionData.testcases,
    };
  } else if (questionData.type === "mcq") {
    const isMultiple = questionData.questionType === "Multiple Correct" || questionData.multipleCorrect;
    let correctAnswer = questionData.correctAnswer;

    if (typeof questionData.correctAnswer === "string") {
      const indices = questionData.correctAnswer
        .split(",")
        .map(idx => parseInt(idx.trim(), 10))
        .filter(idx => !isNaN(idx));

      correctAnswer = isMultiple ? indices : indices[0];
    }

    return {
      type: "mcq",
      title: questionData.title,
      description: questionData.description,
      marks: questionData.marks,
      difficulty: questionData.difficulty,
      questionType: questionData.questionType,
      options: questionData.options,
      correctAnswer: correctAnswer,
      multipleCorrect: questionData.multipleCorrect,
    };
  }

  throw new Error(`Unknown question type: ${questionData.type}`);
}

/**
 * Exports multiple questions as a bulk payload
 * @param {any[]} mongoDocuments - Array of MongoDB question documents
 * @returns {any} ExportPayload with all questions and metadata
 */
function exportBulkQuestions(mongoDocuments) {
  const questions = mongoDocuments.map((doc) => exportSingleQuestion(doc));

  return {
    questions,
    meta: {
      exportDate: new Date().toISOString(),
      format: "v1",
      count: questions.length,
    },
  };
}

/**
 * Converts export payload to JSON string (for download)
 * @param {any} payload - ExportPayload to serialize
 * @param {boolean} pretty - Whether to pretty-print JSON
 * @returns {string} JSON string
 */
function exportPayloadToJSON(payload, pretty = true) {
  return pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
}

/**
 * Generates a filename for exported questions
 * @param {string} [questionTitle] - Optional title of single question for filename
 * @param {number} [count] - Number of questions exported
 * @returns {string} Suggested filename
 */
function generateExportFilename(questionTitle, count) {
  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  if (questionTitle && count === 1) {
    const sanitized = questionTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `question-${sanitized}-${timestamp}.json`;
  }

  return `questions-export-${timestamp}.json`;
}

module.exports = {
  exportSingleQuestion,
  exportBulkQuestions,
  exportPayloadToJSON,
  generateExportFilename,
};
