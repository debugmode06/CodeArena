import { WireKindPlugin } from './types';
import { asList } from './list';
import { checkToken } from './token';

export const asRows = (value: unknown): unknown[][] =>
    Array.isArray(value) ? value.map(asList) : [];

export const matrix: WireKindPlugin = {
    serialize: (value) => {
        const rows = asRows(value);
        const cols = rows.length > 0 ? rows[0].length : 0;
        const tokens = [String(rows.length), String(cols)];
        rows.forEach((row) => row.forEach((cell) => tokens.push(String(cell))));
        return tokens;
    },
    parse: (reader) => {
        const rows = reader.count();
        const cols = reader.count();
        return Array.from({ length: rows }, () => reader.take(cols));
    },
    validate: (value, ctx) => {
        const rows = asRows(value);
        const cols = rows.length > 0 ? rows[0].length : 0;
        const errors: string[] = [];

        rows.forEach((row, r) => {
            if (row.length !== cols) {
                errors.push(`${ctx.variable} row ${r + 1} has ${row.length} columns but row 1 has ${cols}`);
            }
            row.forEach((cell, c) => {
                errors.push(...checkToken(cell, ctx, `${ctx.variable} row ${r + 1} column ${c + 1}`));
            });
        });

        return errors;
    },
    empty: () => [],
};
