import type { TypeRecord } from "@pomelo/code-gen";

export interface EditorProps {
    value: unknown;
    onChange: (next: unknown) => void;
    record: TypeRecord;
    variable: string;
}
