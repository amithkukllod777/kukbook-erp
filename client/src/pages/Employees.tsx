import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);

export default function Employees() {
  const utils = trpc.useUtils();
  const { data: employees = [], isLoading } = trpc.employees.list.useQuery();
  const createMut = trpc.employees.create.useMutation({ onSuccess: () => { utils.employees.list.invalidate(); utils.employees.nextId.invalidate(); toast.success("Employee added"); setOpen(false); } });
  const updateMut = trpc.employees.update.useMutation({ onSuccess: () => { utils.employees.list.invalidate(); toast.success("Employee updated"); setOpen(false); } });
  const deleteMut = trpc.employees.delete.useMutation({ onSuccess: () => { utils.employees.list.invalidate(); toast.success("Employee removed"); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ empId: "", name: "", title: "", dept: "", type: "Salaried", salary: "0", rate: "0", email: "", startDate: "", active: true });
  const { data: nextId } = trpc.employees.nextId.useQuery();

  const filtered = useMemo(() => employees.filter((e: any) => e.name.toLowerCase().includes(search.toLowerCase()) || (e.dept || "").toLowerCase().includes(search.toLowerCase())), [employees, search]);

  const openCreate = () => { setEditing(null); setForm({ empId: "", name: "", title: "", dept: "", type: "Salaried", salary: "0", rate: "0", email: "", startDate: "", active: true }); setOpen(true); };
  const openEdit = (e: any) => { setEditing(e); setForm({ empId: e.empId, name: e.name, title: e.title || "", dept: e.dept || "", type: e.type, salary: String(e.salary), rate: String(e.rate), email: e.email || "", startDate: e.startDate || "", active: e.active }); setOpen(true); };
  const handleSave = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    if (editing) { const { empId, ...rest } = form; updateMut.mutate({ id: editing.id, ...rest }); }
    else { createMut.mutate({ ...form, empId: nextId || "EMP-001" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Employees</h1><p className="text-sm text-muted-foreground mt-1">Manage employee records</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Employee</Button>
      </div>
      <Card className="shadow-sm">
        <div className="p-4 border-b"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div></div>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Title</TableHead><TableHead>Department</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Salary/Rate</TableHead><TableHead>Status</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No employees found</TableCell></TableRow>
              : filtered.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-sm">{e.empId}</TableCell>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell className="text-muted-foreground">{e.title || "—"}</TableCell>
                  <TableCell>{e.dept || "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{e.type}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{e.type === "Salaried" ? fmt(Number(e.salary)) + "/yr" : "$" + Number(e.rate).toFixed(2) + "/hr"}</TableCell>
                  <TableCell><Badge variant={e.active ? "default" : "secondary"} className={e.active ? "bg-emerald-100 text-emerald-800" : ""}>{e.active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: e.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editing ? "Edit Employee" : "New Employee"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div><div><label className="text-sm font-medium">Email</label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium">Title</label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div><div><label className="text-sm font-medium">Department</label><Input value={form.dept} onChange={e => setForm({ ...form, dept: e.target.value })} /></div></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-sm font-medium">Type</label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Salaried">Salaried</SelectItem><SelectItem value="Hourly">Hourly</SelectItem></SelectContent></Select></div>
              <div><label className="text-sm font-medium">Annual Salary</label><Input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Hourly Rate</label><Input type="number" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} /></div>
            </div>
            <div><label className="text-sm font-medium">Start Date</label><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
