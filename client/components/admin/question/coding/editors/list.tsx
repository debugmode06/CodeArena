"use client";

import { ElementList } from "./element-list";
import type { EditorProps } from "./types";

export function ListEditor({ value, onChange }: EditorProps) {
    return <ElementList value={value} onChange={onChange} label="Element" />;
}
