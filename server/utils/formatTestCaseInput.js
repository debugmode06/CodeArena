// Formats a test case's input for display as a LeetCode-style example
// (e.g. "nums = [2, 7, 11, 15], target = 9"), independent of the
// stdin formatting used at execution time (see submitCon.js).

const { parseTokens } = require("@pomelo/code-gen");

const formatValue = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map(formatValue).join(', ')}]`;
  }
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(([key, inner]) => `${key}: ${formatValue(inner)}`)
      .join(', ');
  }
  return String(value ?? '');
};

function formatTestCaseInput(input, inputVariables = []) {
  if (!inputVariables || inputVariables.length === 0) {
    return typeof input === 'string' ? input : JSON.stringify(input);
  }

  // Legacy/bulk-imported test cases store `input` as a raw stdin-style string
  // rather than an object keyed by variable name.
  const values = typeof input === 'string'
    ? parseTokens(input, inputVariables)
    : (input || {});

  return inputVariables
    .map((v) => `${v.variable} = ${formatValue(values[v.variable])}`)
    .join(', ');
}

module.exports = { formatTestCaseInput };
