import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Filter } from "lucide-react";

export default function Approvals() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { data: approvals = [], isLoading } = trpc.approvals.list.useQuery(statusFilter ? { status: statusFilter } : undefined);
  const utils = trpc.useUtils();
  const resolveMut = trpc.approvals.resolve.useMutation({ onSuccess: () => { utils.approvals.list.invalidate(); setResolveOpen(false); toast.success("Approval resolved"); } });

  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveForm, setResolveForm] = useState({ id: 0, status: "", comments: "" });

  const statusIcon = (s: string) => {
    if (s === 'approved') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (s === 'rejected') return <XCircle className="w-4 h-4 text-red-600" />;
    return <Clock className="w-4 h-4 text-yellow-600" />;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Approval Workflows</h1>
          <p className="text-muted-foreground text-sm">Review and approve/reject pending requests (POs, expenses, invoices)</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select className="border rounded px-3 py-1.5 text-sm" value={statusFilter || ""} onChange={e => setStatusFilter(e.target.value || undefined)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded-lg bg-yellow-50"><p className="text-2xl font-bold text-yellow-700">{approvals.filter((a: any) => a.status === 'pending').length}</p><p className="text-xs text-yellow-600">Pending</p></div>
        <div className="p-4 border rounded-lg bg-green-50"><p className="text-2xl font-bold text-green-700">{approvals.filter((a: any) => a.status === 'approved').length}</p><p className="text-xs text-green-600">Approved</p></div>
        <div className="p-4 border rounded-lg bg-red-50"><p className="text-2xl font-bold text-red-700">{approvals.filter((a: any) => a.status === 'rejected').length}</p><p className="text-xs text-red-600">Rejected</p></div>
      </div>

      {isLoading ? <p>Loading...</p> : approvals.length === 0 ? <p className="text-muted-foreground text-center py-12">No approval requests found.</p> : (
        <div className="space-y-3">
          {approvals.map((a: any) => (
            <div key={a.id} className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {statusIcon(a.status)}
                <div>
                  <p className="font-medium">{a.entityType} — {a.entityRef || `#${a.entityId}`}</p>
                  <p className="text-xs text-muted-foreground">Requested by {a.requestedByName || 'Unknown'} • {a.requestedAt ? new Date(a.requestedAt).toLocaleDateString('en-IN') : ''}</p>
                  {a.comments && <p className="text-xs mt-1 italic text-muted-foreground">"{a.comments}"</p>}
                </div>
              </div>
              <div className="flex gap-2">
                {a.status === 'pending' && (
                  <>
                    <Button size="sm" variant="outline" className="text-green-600 border-green-300" onClick={() => { setResolveForm({ id: a.id, status: 'approved', comments: '' }); setResolveOpen(true); }}>
                      <CheckCircle className="w-3 h-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-300" onClick={() => { setResolveForm({ id: a.id, status: 'rejected', comments: '' }); setResolveOpen(true); }}>
                      <XCircle className="w-3 h-3 mr-1" /> Reject
                    </Button>
                  </>
                )}
                {a.status !== 'pending' && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${a.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {a.status === 'approved' ? 'Approved' : 'Rejected'}{a.resolvedAt ? ` on ${new Date(a.resolvedAt).toLocaleDateString('en-IN')}` : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{resolveForm.status === 'approved' ? 'Approve' : 'Reject'} Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs font-medium">Comments (optional)</label><Input value={resolveForm.comments} onChange={e => setResolveForm(f => ({ ...f, comments: e.target.value }))} placeholder="Add a note..." /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setResolveOpen(false)}>Cancel</Button>
            <Button className={resolveForm.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} onClick={() => resolveMut.mutate(resolveForm)} disabled={resolveMut.isPending}>
              {resolveMut.isPending ? "Processing..." : resolveForm.status === 'approved' ? 'Confirm Approve' : 'Confirm Reject'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
