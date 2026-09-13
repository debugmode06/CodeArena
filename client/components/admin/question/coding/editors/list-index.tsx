"use client";

import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { ElementList } from "./element-list";
import type { EditorProps } from "./types";

// The cycle target is a choice among the nodes that exist, so it is a select
// rather than a number field that can point past the end of the list.
export function ListIndexEditor({ value, onChange }: EditorProps) {
    const compound = (value || {}) as { items?: unknown; pos?: unknown };
    const items: string[] = Array.isArray(compound.items) ? compound.items.map(String) : [];
    const pos = String(compound.pos ?? "-1");

    return (
        <div className="space-y-2">
            <ElementList
                value={items}
                onChange={(next) => onChange({ items: next, pos: Number(pos) < next.length ? pos : "-1" })}
                label="Element"
            />
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Tail links to</span>
                <Select value={pos} onValueChange={(next) => onChange({ items, pos: next })}>
                    <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="-1">no cycle</SelectItem>
                        {items.map((item, index) => (
                            <SelectItem key={index} value={String(index)}>
                                node {index + 1}
                                {item ? ` (${item})` : ""}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
