const { formatTestCaseInput } = require('./formatTestCaseInput');

const MAX_EXAMPLES = 3;

function toProblemView(question, { saved, includeAnswerKey = false } = {}) {
    const view = {
        id: question._id,
        type: question.type,
        title: question.title,
        difficulty: question.difficulty,
        description: question.description,
        inputFormat: question.inputFormat,
        outputFormat: question.outputFormat,
        constraints: question.constraints,
        boilerplateCode: question.boilerplateCode,
        questionType: question.questionType,
        options: question.options,
        marks: question.marks,
        savedAnswer: saved ? saved.answer : undefined,
        savedCode: saved ? saved.code : undefined,
        savedLanguage: saved ? saved.language : undefined,
        examples: (question.testcases || [])
            .filter(tc => tc.isVisible)
            .slice(0, MAX_EXAMPLES)
            .map(tc => ({
                input: formatTestCaseInput(tc.input, question.inputVariables),
                output: tc.output,
                explanation: tc.explanation || undefined,
            })),
    };

    if (includeAnswerKey) {
        view.correctAnswer = question.correctAnswer;
    }

    return view;
}

module.exports = { toProblemView };
