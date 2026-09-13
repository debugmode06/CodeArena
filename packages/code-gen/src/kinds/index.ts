import { WireKind } from '../registry';
import { WireKindPlugin } from './types';
import { scalar } from './scalar';
import { bool } from './bool';
import { list } from './list';
import { listIndex } from './list-index';
import { matrix } from './matrix';
import { graph } from './graph';

export const WIRE_KINDS: Record<WireKind, WireKindPlugin> = {
    scalar,
    bool,
    list,
    list_index: listIndex,
    matrix,
    graph,
};

export function wireKind(kind: WireKind): WireKindPlugin {
    const plugin = WIRE_KINDS[kind];
    if (!plugin) {
        throw new Error(`No plugin registered for wire kind "${kind}"`);
    }
    return plugin;
}

export * from './types';
export * from './token';
export type { GraphValue } from './graph';
export type { ListIndexValue } from './list-index';
