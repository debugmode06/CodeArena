import { WireKindPlugin } from './types';
import { asList, validateList } from './list';
import { checkIndex } from './token';

export interface ListIndexValue {
    items: unknown[];
    pos: unknown;
}

const asCompound = (value: unknown): ListIndexValue =>
    (value && typeof value === 'object' ? value : { items: [], pos: '-1' }) as ListIndexValue;

export const listIndex: WireKindPlugin = {
    serialize: (value) => {
        const { items, pos } = asCompound(value);
        const list = asList(items);
        return [String(list.length), ...list.map(String), String(pos ?? -1)];
    },
    parse: (reader) => {
        const items = reader.take(reader.count());
        return { items, pos: reader.next() ?? '-1' };
    },
    validate: (value, ctx) => {
        const { items, pos } = asCompound(value);
        const list = asList(items);
        return [
            ...validateList(list, ctx, `${ctx.variable} element`),
            // -1 means "no cycle"; anything else must name a node that exists.
            ...checkIndex(pos, -1, list.length - 1, `${ctx.variable} cycle position`),
        ];
    },
    empty: () => ({ items: [], pos: '-1' }),
};
