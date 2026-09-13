export type WireKind = 'scalar' | 'bool' | 'list' | 'list_index' | 'matrix' | 'graph';
export type EditorKind = 'scalar' | 'bool' | 'list' | 'tree' | 'list+index' | 'matrix' | 'graph';
export type TokenKind = 'int' | 'number' | 'char' | 'text';

export interface TypeRecord {
    editor: EditorKind;
    wire: WireKind;
    token: TokenKind;
    group: string;
    hint?: string;
    allowNull?: true;
    structure?: string;
    element?: string;
    edgeWidth?: number;
}

const LIST_HINT = 'One entry per element, in order.';
const TREE_HINT = 'Level order, left to right. Mark a slot null when a child is absent.';
const GRAPH_HINT = 'Nodes are numbered 0 … n-1. Each edge references two of them.';

export const TYPE_REGISTRY: Record<string, TypeRecord> = {
    int: { editor: 'scalar', wire: 'scalar', token: 'int', group: 'Primitive' },
    long: { editor: 'scalar', wire: 'scalar', token: 'int', group: 'Primitive' },
    float: { editor: 'scalar', wire: 'scalar', token: 'number', group: 'Primitive' },
    double: { editor: 'scalar', wire: 'scalar', token: 'number', group: 'Primitive' },
    bool: { editor: 'bool', wire: 'bool', token: 'int', group: 'Primitive' },
    char: { editor: 'scalar', wire: 'scalar', token: 'char', group: 'Primitive' },
    string: { editor: 'scalar', wire: 'scalar', token: 'text', group: 'Primitive', hint: 'A single token — no spaces.' },

    int_array: { editor: 'list', wire: 'list', token: 'int', group: 'Array', hint: LIST_HINT },
    float_array: { editor: 'list', wire: 'list', token: 'number', group: 'Array', hint: LIST_HINT },
    string_array: { editor: 'list', wire: 'list', token: 'text', group: 'Array', hint: 'One token per element — no spaces.' },
    int_matrix: { editor: 'matrix', wire: 'matrix', token: 'int', group: 'Array', hint: 'Every row must have the same number of columns.' },

    int_linked_list: { structure: 'linked_list', element: 'int', editor: 'list', wire: 'list', token: 'int', group: 'Linked list', hint: LIST_HINT },
    string_linked_list: { structure: 'linked_list', element: 'string', editor: 'list', wire: 'list', token: 'text', group: 'Linked list', hint: LIST_HINT },
    int_linked_list_cyclic: { structure: 'linked_list_cyclic', element: 'int', editor: 'list+index', wire: 'list_index', token: 'int', group: 'Linked list', hint: 'The tail links back to the chosen node, or nowhere.' },
    int_doubly_linked_list: { structure: 'doubly_linked_list', element: 'int', editor: 'list', wire: 'list', token: 'int', group: 'Linked list', hint: LIST_HINT },

    int_binary_tree: { structure: 'binary_tree', element: 'int', editor: 'tree', wire: 'list', token: 'int', allowNull: true, group: 'Tree', hint: TREE_HINT },
    int_binary_tree_parent: { structure: 'binary_tree_parent', element: 'int', editor: 'tree', wire: 'list', token: 'int', allowNull: true, group: 'Tree', hint: TREE_HINT },
    int_nary_tree: { structure: 'nary_tree', element: 'int', editor: 'tree', wire: 'list', token: 'int', allowNull: true, group: 'Tree', hint: 'Root, then null, then each node’s children followed by null.' },

    int_graph: { structure: 'graph', editor: 'graph', wire: 'graph', token: 'int', edgeWidth: 2, group: 'Graph', hint: `${GRAPH_HINT} Edges are undirected.` },
    int_digraph: { structure: 'digraph', editor: 'graph', wire: 'graph', token: 'int', edgeWidth: 2, group: 'Graph', hint: `${GRAPH_HINT} Edges point from the first node to the second.` },
    int_weighted_graph: { structure: 'weighted_graph', editor: 'graph', wire: 'graph', token: 'int', edgeWidth: 3, group: 'Graph', hint: `${GRAPH_HINT} Edges are undirected and carry a weight.` },
    int_weighted_digraph: { structure: 'weighted_digraph', editor: 'graph', wire: 'graph', token: 'int', edgeWidth: 3, group: 'Graph', hint: `${GRAPH_HINT} Edges point from the first node to the second and carry a weight.` },
};

// structName is the identifier the preamble defines; shape distinguishes definitions
// that share that name but differ in their fields. Two types may coexist in one
// question only if equal structName implies equal shape.
export const STRUCTURE_DEFS: Record<string, { structName: string; shape: string }> = {
    linked_list: { structName: 'ListNode', shape: 'ListNode' },
    linked_list_cyclic: { structName: 'ListNode', shape: 'ListNode' },
    doubly_linked_list: { structName: 'DListNode', shape: 'DListNode' },
    binary_tree: { structName: 'TreeNode', shape: 'TreeNode' },
    binary_tree_parent: { structName: 'TreeNode', shape: 'TreeNodeParent' },
    nary_tree: { structName: 'Node', shape: 'Node' },
    graph: { structName: 'Graph', shape: 'Graph' },
    digraph: { structName: 'Graph', shape: 'Graph' },
    weighted_graph: { structName: 'WGraph', shape: 'WGraph' },
    weighted_digraph: { structName: 'WGraph', shape: 'WGraph' },
};

export const STRUCT_NAMES = [
    ...new Set(Object.values(STRUCTURE_DEFS).map((def) => def.structName)),
];

// Identical shape + identical element means identical preamble text, so one emission serves both.
export function preambleId(type: string): string {
    const record = typeRecord(type);
    if (!record.structure) return type;
    return `${STRUCTURE_DEFS[record.structure].shape}:${record.element || ''}`;
}

export function typeRecord(type: string): TypeRecord {
    const record = TYPE_REGISTRY[type];
    if (!record) {
        throw new Error(`Unsupported type "${type}"`);
    }
    return record;
}
