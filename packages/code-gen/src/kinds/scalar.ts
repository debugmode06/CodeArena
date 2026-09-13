import { WireKindPlugin } from './types';
import { checkToken } from './token';

export const scalar: WireKindPlugin = {
    serialize: (value) => [String(value ?? '')],
    parse: (reader) => reader.next() ?? '',
    validate: (value, ctx) => checkToken(value, ctx, ctx.variable),
    empty: () => '',
};
