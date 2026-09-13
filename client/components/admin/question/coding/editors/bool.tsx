"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { EditorProps } from "./types";

export function BoolEditor({ value, onChange }: EditorProps) {
    const checked = value === true || value === "true" || value === "1";

    return (
        <div className="flex items-center gap-2">
            <Checkbox checked={checked} onCheckedChange={(next) => onChange(next === true)} />
            <span className="text-xs text-muted-foreground">{checked ? "true" : "false"}</span>
        </div>
    );
}
