import { useEffect, useState } from "react";
import { api } from "@/api/index.js";
import type { Status, ContainerInfo } from "@/types.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Play, Square, RotateCcw, Loader2, RefreshCw } from "lucide-react";

export default function ContainersPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      setStatus(await api.getStatus());
    } catch {}
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function runAction(action: () => Promise<any>) {
    setRunning(true);
    try {
      await action();
      await refresh();
    } catch (err: any) {
      console.error(err);
    }
    setRunning(false);
  }

  const containers = status?.containers ?? [];

  function getState(c: ContainerInfo) {
    return (c.State || c.state || "unknown").toLowerCase();
  }

  function getName(c: ContainerInfo) {
    return c.Service || c.Name || c.name || "unknown";
  }

  function getStatusText(c: ContainerInfo) {
    return c.Status || c.status || "";
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => runAction(() => api.start())}
          disabled={running}
          size="sm"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Start All
        </Button>
        <Button
          variant="outline"
          onClick={() => runAction(() => api.stop())}
          disabled={running}
          size="sm"
        >
          <Square className="h-4 w-4" />
          Stop All
        </Button>
        <Button
          variant="outline"
          onClick={() => runAction(() => api.restart())}
          disabled={running}
          size="sm"
        >
          <RotateCcw className="h-4 w-4" />
          Restart All
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Separator />

      {/* Container Table */}
      {containers.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No containers found.</p>
          <p className="text-sm text-muted-foreground mt-1">Start services to see containers here.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Image</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {containers.map((c, i) => {
              const state = getState(c);
              return (
                <TableRow key={i}>
                  <TableCell className="font-mono text-sm font-medium">{getName(c)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        state === "running" ? "success" :
                        state === "exited" ? "destructive" :
                        "warning"
                      }
                    >
                      {state}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{getStatusText(c)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.Image || "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}


      {/* Docker Status */}
      <Separator />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Docker:</span>
        <Badge variant={status?.dockerAvailable ? "success" : "destructive"}>
          {status?.dockerAvailable ? "Available" : "Unavailable"}
        </Badge>
        {status?.operation?.status === "running" && (
          <>
            <span className="ml-4">Operation:</span>
            <Badge variant="warning">{status.operation.name} (running)</Badge>
          </>
        )}
      </div>
    </div>
  );
}
