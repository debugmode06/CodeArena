import { KindContext, WireKindPlugin } from './types';
import { checkToken } from './token';

// Accepts a comma-separated string so legacy/hand-written values still load.
export function asList(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        return value.split(',').map((s) => s.trim()).filter((s) => s !== '');
    }
    return [];
}

export function validateList(value: unknown, ctx: KindContext, label: string): string[] {
    return asList(value).flatMap((item, index) =>
        checkToken(item, ctx, `${label} ${index + 1}`)
    );
}

export const list: WireKindPlugin = {
    serialize: (value) => {
        const items = asList(value);
        return [String(items.length), ...items.map(String)];
    },
    parse: (reader) => reader.take(reader.count()),
    validate: (value, ctx) => validateList(value, ctx, `${ctx.variable} element`),
    empty: () => [],
};
