const mongoose = require("mongoose");
const { getJudge, validateProblemConfig } = require("@pomelo/code-gen");

// Version 5, not 4: an earlier build shipped this as two separate migrations, so a
// database that already ran the first one must still pick up the merged version.
module.exports = {
  version: 5,
  name: "Regenerate coding boilerplate for the current signatures and struct preambles",
  up: async () => {
    const questions = mongoose.connection.db.collection("questions");
    const cursor = questions.find({ type: "coding" });

    for await (const question of cursor) {
      const stored = question.boilerplateCode || {};
      const config = {
        method: question.functionName,
        input: (question.inputVariables || []).map((v) => ({
          variable: v.variable,
          type: v.type,
        })),
      };

      const errors = validateProblemConfig(config);
      if (errors.length > 0) {
        console.warn(`[Migrations] Skipping question ${question._id}: ${errors.join("; ")}`);
        continue;
      }

      const boilerplateCode = {};
      for (const lang of Object.keys(stored)) {
        boilerplateCode[lang] = getJudge(lang).generateBoilerplate(config);
      }

      await questions.updateOne({ _id: question._id }, { $set: { boilerplateCode } });
    }
  },
};
