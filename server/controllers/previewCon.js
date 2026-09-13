const Question = require("../models/Question");
const { languageIds } = require("../utils/languages");
const { toProblemView } = require("../utils/toProblemView");
const {
    streamExecution,
    scoreResults,
    DISCLOSURE,
    MAX_CODE_LENGTH,
} = require("./submitCon");

const resolveQuestion = async (req, res) => {
    const question = await Question.findById(req.params.id);
    if (!question) {
        res.status(404).json({ success: false, error: "Question not found" });
        return null;
    }
    return question;
};

const resolveExecutionRequest = (req, res) => {
    const { language, isBase64 } = req.body;
    let { code } = req.body;

    if (isBase64 && code) {
        code = Buffer.from(code, "base64").toString("utf-8");
    }

    if (!code || !language) {
        res.status(400).json({ success: false, error: "Missing required fields" });
        return null;
    }

    if (code.length > MAX_CODE_LENGTH) {
        res.status(400).json({ success: false, error: "Code exceeds maximum allowed length" });
        return null;
    }

    const languageId = languageIds[language.toLowerCase()];
    if (!languageId) {
        res.status(400).json({ success: false, error: "Unsupported language" });
        return null;
    }

    return { code, language, languageId };
};

// @desc    Question in the candidate-facing shape, for admin preview
const getQuestionPreview = async (req, res, next) => {
    try {
        const question = await resolveQuestion(req, res);
        if (!question) return;

        return res.json({
            success: true,
            problem: toProblemView(question, { includeAnswerKey: true }),
        });
    } catch (error) {
        return next(error);
    }
};

// @desc    Run preview code against visible test cases. Never persisted.
const runPreview = async (req, res, next) => {
    try {
        const question = await resolveQuestion(req, res);
        if (!question) return;

        const execution = resolveExecutionRequest(req, res);
        if (!execution) return;

        const testcases = Array.isArray(question.testcases) ? question.testcases : [];
        const visible = testcases.filter(tc => tc.isVisible);
        const testToRun = visible.length > 0 ? visible : (testcases[0] ? [testcases[0]] : []);

        if (testToRun.length === 0) {
            return res.status(400).json({ success: false, error: "No test cases configured" });
        }

        await streamExecution(res, {
            question,
            ...execution,
            testCases: testToRun,
            disclosure: DISCLOSURE.FULL,
            buildDone: (results) => ({
                results,
                passedCount: results.filter(r => r.passed).length,
                totalCount: results.length
            })
        });
    } catch (error) {
        if (res.headersSent) {
            res.write(JSON.stringify({ type: "error", error: error.message }) + "\n");
            return res.end();
        }
        next(error);
    }
};

// @desc    Run preview code against all test cases and score it. Never persisted.
const submitPreview = async (req, res, next) => {
    try {
        const question = await resolveQuestion(req, res);
        if (!question) return;

        const execution = resolveExecutionRequest(req, res);
        if (!execution) return;

        const allTestCases = Array.isArray(question.testcases) ? question.testcases : [];
        if (allTestCases.length === 0) {
            return res.status(400).json({ success: false, error: "No test cases configured" });
        }

        await streamExecution(res, {
            question,
            ...execution,
            testCases: allTestCases,
            disclosure: DISCLOSURE.FULL,
            buildDone: (results) => {
                const { score, overallStatus } = scoreResults(question, results);
                return { results, score, overallStatus };
            }
        });
    } catch (error) {
        if (res.headersSent) {
            res.write(JSON.stringify({ type: "error", error: error.message }) + "\n");
            return res.end();
        }
        next(error);
    }
};

module.exports = { getQuestionPreview, runPreview, submitPreview };
