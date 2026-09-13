import { useState } from "react";
import { api } from "@/api/index.js";
import { useLogs } from "@/contexts/LogsContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Loader2 } from "lucide-react";

const SOURCES = [
  { value: "daemon", label: "Daemon" },
  { value: "client", label: "Client" },
  { value: "server", label: "Server" },
  { value: "mongo", label: "Mongo" },
  { value: "caddy", label: "Caddy" },
  { value: "citron", label: "Citron" },
];

export default function LogsPage() {
  const [source, setSource] = useState("client");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { liveLog, isStreaming } = useLogs();

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await api.getLogs(source, 500);
      setText(typeof data === "string" ? data : JSON.stringify(data, null, 2));
    } catch (err: any) {
      setText(`Error: ${err.message}`);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-lg font-medium mb-4">Container Logs</h3>
        {/* Controls */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Source</label>
            <Select
              value={source}
              onValueChange={setSource}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={loadLogs} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading..." : "Load"}
          </Button>
        </div>

        <Separator className="mb-4" />

        {/* Log Output */}
        <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-auto max-h-[calc(100vh-280px)] min-h-[200px] whitespace-pre-wrap break-all text-foreground/80 border">
          {text || "No logs loaded. Select a source and click Load."}
        </pre>
      </div>

      <div className="space-y-4 pt-4 mt-8">
        <Separator />
        <div className="flex items-center justify-between pt-2">
          <h3 className="text-lg font-medium">Deployment Logs</h3>
          {isStreaming && (
            <div className="flex items-center gap-2 text-sm text-emerald-500 font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              Running
            </div>
          )}
        </div>
        <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-auto max-h-96 min-h-[200px] whitespace-pre-wrap break-all text-foreground/80 border">
          {liveLog || "No active or recent deployment operations."}
        </pre>
      </div>
    </div>
  );
}
