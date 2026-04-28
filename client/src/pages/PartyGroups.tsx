import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Users, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function PartyGroups() {
  const { data: groups = [], isLoading } = trpc.partyGroups.list.useQuery();
  const utils = trpc.useUtils();
  const createMut = trpc.partyGroups.create.useMutation({ onSuccess: () => { utils.partyGroups.list.invalidate(); toast.success("Group created"); } });
  const deleteMut = trpc.partyGroups.delete.useMutation({ onSuccess: () => { utils.partyGroups.list.invalidate(); toast.success("Deleted"); } });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", type: "Customer", description: "" });

  const filtered = useMemo(() => groups.filter((g: any) => g.name?.toLowerCase().includes(search.toLowerCase())), [groups, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Party Groups</h1>
          <p className="text-muted-foreground">Organize customers and vendors into groups</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Group</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Party Group</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Group Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Premium Customers" /></div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="Vendor">Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <Button onClick={() => { if (!form.name) { toast.error("Enter name"); return; } createMut.mutate(form); setOpen(false); setForm({ name: "", type: "Customer", description: "" }); }} disabled={createMut.isPending}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search groups..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Party Groups ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground">Loading...</p> : filtered.length === 0 ? <p className="text-muted-foreground">No groups found</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-3 font-medium">Name</th><th className="pb-3 font-medium">Type</th><th className="pb-3 font-medium">Description</th><th className="pb-3 font-medium">Actions</th></tr></thead>
                <tbody>{filtered.map((g: any) => (
                  <tr key={g.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 font-medium">{g.name}</td>
                    <td className="py-3"><Badge variant={g.type === "Customer" ? "default" : "secondary"}>{g.type}</Badge></td>
                    <td className="py-3 text-muted-foreground">{g.description || "-"}</td>
                    <td className="py-3"><Button size="sm" variant="ghost" onClick={() => deleteMut.mutate({ id: g.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
