const mongoose = require('mongoose');
const { SUPPORTED_TYPES } = require('@pomelo/code-gen');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  title: String,
  description: String,
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
  },
  marks: Number,
  // MCQ specific fields
  questionType: {
    type: String,
    enum: ['Single Correct', 'Multiple Correct', 'Coding'],
  },
  options: {
    type: [String],
    default: undefined
  },
  correctAnswer: String,
  // Coding specific fields
  constraints: String,
  inputFormat: String,
  outputFormat: String,
  boilerplateCode: {
    c: String,
    cpp: String,
    java: String,
    python: String,
  },
  functionName: String,
  inputVariables: [{
    variable: String,
    type: {
      type: String,
      enum: SUPPORTED_TYPES
    }
  }],
  testcases: [{
    input: String,
    output: String,
    explanation: String,
    isVisible: {
      type: Boolean,
      default: false
    }
  }],
}, { timestamps: true });

module.exports = mongoose.models.Question || mongoose.model('Question', questionSchema);
