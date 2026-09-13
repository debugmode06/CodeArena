"use client";

import { TYPE_REGISTRY, type EditorKind } from "@pomelo/code-gen";
import { ScalarEditor } from "./scalar";
import { BoolEditor } from "./bool";
import { ListEditor } from "./list";
import { TreeEditor } from "./tree";
import { ListIndexEditor } from "./list-index";
import { MatrixEditor } from "./matrix";
import { GraphEditor } from "./graph";
import type { EditorProps } from "./types";

const EDITORS: Record<EditorKind, (props: EditorProps) => React.ReactNode> = {
    scalar: ScalarEditor,
    bool: BoolEditor,
    list: ListEditor,
    tree: TreeEditor,
    "list+index": ListIndexEditor,
    matrix: MatrixEditor,
    graph: GraphEditor,
};

export function ValueEditor({
    type,
    value,
    onChange,
    variable,
}: {
    type: string;
    value: unknown;
    onChange: (next: unknown) => void;
    variable: string;
}) {
    const record = TYPE_REGISTRY[type];
    if (!record) return null;

    const Editor = EDITORS[record.editor];

    return (
        <div className="space-y-1">
            <Editor value={value} onChange={onChange} record={record} variable={variable} />
            {record.hint && (
                <p className="text-[11px] text-muted-foreground leading-snug">{record.hint}</p>
            )}
        </div>
    );
}
