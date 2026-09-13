"use client";

import { useEffect, useSyncExternalStore } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "error" | "success" | "info";

interface Notice {
    id: number;
    variant: Variant;
    title: string;
    description?: string;
}

const AUTO_DISMISS_MS = 6000;

// One notice at a time: a new one replaces whatever is showing, immediately.
let current: Notice | null = null;
let seq = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

function show(variant: Variant, title: string, options?: { description?: string }) {
    clearTimeout(timer);
    current = { id: ++seq, variant, title, description: options?.description };
    emit();
    timer = setTimeout(dismiss, AUTO_DISMISS_MS);
}

function dismiss() {
    clearTimeout(timer);
    current = null;
    emit();
}

// Same call shape the app already used, so call sites only change their import.
export const toast = {
    error: (title: string, options?: { description?: string }) => show("error", title, options),
    success: (title: string, options?: { description?: string }) => show("success", title, options),
    info: (title: string, options?: { description?: string }) => show("info", title, options),
    dismiss,
};

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const STYLES: Record<Variant, { bar: string; Icon: typeof Info }> = {
    error: { bar: "text-destructive border-b-destructive/60", Icon: CircleAlert },
    success: { bar: "text-primary border-b-primary/60", Icon: CircleCheck },
    info: { bar: "text-foreground border-b-border", Icon: Info },
};

export function AppBanner() {
    const notice = useSyncExternalStore(subscribe, () => current, () => null);

    // Everything else is positioned against this, so the rest of the page moves down
    // by exactly the bar's height instead of being covered by it.
    useEffect(() => {
        document.documentElement.style.setProperty("--banner-h", notice ? "2rem" : "0px");
        return () => document.documentElement.style.setProperty("--banner-h", "0px");
    }, [notice]);

    if (!notice) return null;

    const { bar, Icon } = STYLES[notice.variant];

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "fixed inset-x-0 top-0 z-50 h-8 flex items-center gap-2 px-4",
                "border-b bg-card text-[13px] leading-none",
                bar
            )}
        >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium truncate">{notice.title}</span>
            {notice.description && (
                <span className="text-muted-foreground truncate">{notice.description}</span>
            )}
            <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss"
                className="ml-auto shrink-0 text-muted-foreground hover:text-foreground"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
