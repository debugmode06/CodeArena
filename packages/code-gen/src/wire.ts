import { ProblemInput } from './types';
import { typeRecord } from './registry';
import { wireKind, KindContext, TokenReader } from './kinds';

export interface ValueError {
    variable: string;
    message: string;
}

const contextFor = (variable: ProblemInput): KindContext => ({
    variable: variable.variable,
    type: variable.type,
    record: typeRecord(variable.type),
});

function tokenReader(tokens: string[]): TokenReader {
    let p = 0;
    return {
        next: () => (p < tokens.length ? tokens[p++] : undefined),
        count: () => {
            const parsed = parseInt(tokens[p++], 10);
            return isNaN(parsed) ? 0 : parsed;
        },
        take: (n) => {
            const out: string[] = [];
            for (let i = 0; i < n && p < tokens.length; i++) out.push(tokens[p++]);
            return out;
        },
        done: () => p >= tokens.length,
    };
}

// Values are only ever serialized after validateValues has passed, so this assumes
// well-formed input and never throws — a throw here surfaces as a silent submit.
export function serializeValues(
    values: Record<string, unknown>,
    variables: ProblemInput[]
): string {
    const tokens: string[] = [];

    for (const variable of variables || []) {
        const ctx = contextFor(variable);
        tokens.push(...wireKind(ctx.record.wire).serialize(values?.[variable.variable], ctx));
    }

    return tokens.join(' ');
}

export function parseTokens(
    serialized: string,
    variables: ProblemInput[]
): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    if (!serialized || !variables || variables.length === 0) return result;

    const reader = tokenReader(serialized.trim().split(/\s+/));

    for (const variable of variables) {
        if (reader.done()) break;
        const ctx = contextFor(variable);
        result[variable.variable] = wireKind(ctx.record.wire).parse(reader, ctx);
    }

    return result;
}

export function validateValues(
    values: Record<string, unknown>,
    variables: ProblemInput[]
): ValueError[] {
    const errors: ValueError[] = [];

    for (const variable of variables || []) {
        let ctx: KindContext;
        try {
            ctx = contextFor(variable);
        } catch {
            continue; // unknown type — validateProblemConfig already reports it
        }

        const value = values?.[variable.variable];
        if (value === undefined) {
            errors.push({ variable: variable.variable, message: `${variable.variable} has no value` });
            continue;
        }

        for (const message of wireKind(ctx.record.wire).validate(value, ctx)) {
            errors.push({ variable: variable.variable, message });
        }
    }

    return errors;
}

export function emptyValue(type: string): unknown {
    const record = typeRecord(type);
    return wireKind(record.wire).empty({ variable: '', type, record });
}
