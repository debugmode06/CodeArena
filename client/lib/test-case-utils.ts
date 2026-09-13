// The wire format lives in @pomelo/code-gen so the form, the execution path
// (submitCon.buildStdin) and the example renderer all agree by construction.
export {
    serializeValues as serializeInput,
    parseTokens as deserializeInput,
    emptyValue,
} from "@pomelo/code-gen";

export type { ProblemInput as InputVariable } from "@pomelo/code-gen";
