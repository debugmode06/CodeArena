import { WireKindPlugin } from './types';
import { asRows } from './matrix';
import { checkIndex, checkToken, isInteger } from './token';

export interface GraphValue {
    nodes: unknown;
    edges: unknown[][];
}

const asCompound = (value: unknown): GraphValue =>
    (value && typeof value === 'object' ? value : { nodes: '0', edges: [] }) as GraphValue;

export const graph: WireKindPlugin = {
    serialize: (value) => {
        const { nodes, edges } = asCompound(value);
        const rows = asRows(edges);
        const tokens = [String(nodes ?? 0), String(rows.length)];
        rows.forEach((edge) => edge.forEach((cell) => tokens.push(String(cell))));
        return tokens;
    },
    parse: (reader, ctx) => {
        const nodes = reader.next() ?? '0';
        const edgeCount = reader.count();
        const width = ctx.record.edgeWidth ?? 2;
        return { nodes, edges: Array.from({ length: edgeCount }, () => reader.take(width)) };
    },
    validate: (value, ctx) => {
        const { nodes, edges } = asCompound(value);
        const width = ctx.record.edgeWidth ?? 2;
        const errors: string[] = [];

        if (!isInteger(nodes) || Number(nodes) < 0) {
            errors.push(`${ctx.variable} node count must be a non-negative whole number (got "${nodes ?? ''}")`);
            return errors;
        }

        const nodeCount = Number(nodes);

        asRows(edges).forEach((edge, index) => {
            if (edge.length !== width) {
                errors.push(`${ctx.variable} edge ${index + 1} needs ${width} values but has ${edge.length}`);
                return;
            }
            // Endpoints index into the adjacency list the driver allocates, so an
            // out-of-range node is an out-of-bounds write at run time.
            errors.push(...checkIndex(edge[0], 0, nodeCount - 1, `${ctx.variable} edge ${index + 1} from`));
            errors.push(...checkIndex(edge[1], 0, nodeCount - 1, `${ctx.variable} edge ${index + 1} to`));
            if (width > 2) {
                errors.push(...checkToken(edge[2], ctx, `${ctx.variable} edge ${index + 1} weight`));
            }
        });

        return errors;
    },
    empty: () => ({ nodes: '0', edges: [] }),
};
