import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Activity, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function ActivityLog() {
  const { activeCompany } = useCompany();
  const companyId = activeCompany?.id || 0;
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const limit = 50;

  const { data: logs = [] } = trpc.activityLog.list.useQuery(
    { companyId, limit, offset: page * limit },
    { enabled: !!companyId }
  );

  const actionColor = (action: string) => {
    if (action.includes("create") || action.includes("add")) return "bg-green-500/10 text-green-500";
    if (action.includes("delete") || action.includes("remove")) return "bg-red-500/10 text-red-500";
    if (action.includes("update") || action.includes("edit")) return "bg-blue-500/10 text-blue-500";
    return "bg-gray-500/10 text-gray-500";
  };

  const filtered = logs.filter((l: any) =>
    !search || l.entityName?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.userName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="text-muted-foreground">Track all changes made in your company</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search activity..." className="pl-9"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No activity recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((log: any) => (
            <Card key={log.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{log.userName || "System"}</span>
                    <Badge className={actionColor(log.action)}>{log.action}</Badge>
                    <span className="text-muted-foreground">{log.entityType}</span>
                    {log.entityName && (
                      <span className="font-medium truncate">"{log.entityName}"</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(log.createdAt).toLocaleString("en-IN")}
                    {log.ipAddress && ` • IP: ${log.ipAddress}`}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page + 1}</span>
        <Button variant="outline" size="sm" disabled={logs.length < limit} onClick={() => setPage(p => p + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
