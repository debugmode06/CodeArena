"use client";

import { Input } from "@/components/ui/input";
import type { EditorProps } from "./types";

export function ScalarEditor({ value, onChange, variable }: EditorProps) {
    return (
        <Input
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Value for ${variable}`}
            className="h-8 text-sm"
        />
    );
}
