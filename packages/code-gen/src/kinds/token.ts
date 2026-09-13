import { TokenKind } from '../registry';
import { KindContext } from './types';

const PATTERNS: Record<TokenKind, RegExp> = {
    int: /^-?\d+$/,
    number: /^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/,
    char: /^\S$/,
    text: /^\S+$/,
};

const DESCRIPTIONS: Record<TokenKind, string> = {
    int: 'a whole number',
    number: 'a number',
    char: 'a single character',
    text: 'a single token with no spaces',
};

export const NULL_TOKEN = 'null';

export function isInteger(value: unknown): boolean {
    return PATTERNS.int.test(String(value ?? '').trim());
}

// Values reach the driver as whitespace-separated tokens, so every value an author
// types has to survive that trip. Checking the token is checking what actually runs.
export function checkToken(value: unknown, ctx: KindContext, where: string): string[] {
    const token = String(value ?? '').trim();

    if (token === '') {
        return [`${where} is empty`];
    }
    if (ctx.record.allowNull && token === NULL_TOKEN) {
        return [];
    }
    if (!PATTERNS[ctx.record.token].test(token)) {
        const nullNote = ctx.record.allowNull ? ` or "${NULL_TOKEN}"` : '';
        return [`${where} must be ${DESCRIPTIONS[ctx.record.token]}${nullNote} (got "${token}")`];
    }
    return [];
}

export function checkIndex(value: unknown, min: number, max: number, where: string): string[] {
    const token = String(value ?? '').trim();
    if (!PATTERNS.int.test(token)) {
        return [`${where} must be a whole number (got "${token}")`];
    }
    const index = Number(token);
    if (index < min || index > max) {
        return [`${where} must be between ${min} and ${max} (got ${index})`];
    }
    return [];
}
