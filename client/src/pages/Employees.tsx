import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);

const defaultForm = {
  empId: "", name: "", title: "", dept: "", type: "Salaried", salary: "0", rate: "0", email: "", startDate: "", active: true,
  basicSalary: "0", hra: "0", da: "0", specialAllowance: "0",
  panNumber: "", uanNumber: "", esiNumber: "", pfOptOut: false
};

export default function Employees() {
  const utils = trpc.useUtils();
  const { data: employees = [], isLoading } = trpc.employees.list.useQuery();
  const createMut = trpc.employees.create.useMutation({ onSuccess: () => { utils.employees.list.invalidate(); utils.employees.nextId.invalidate(); toast.success("Employee added"); setOpen(false); } });
  const updateMut = trpc.employees.update.useMutation({ onSuccess: () => { utils.employees.list.invalidate(); toast.success("Employee updated"); setOpen(false); } });
  const deleteMut = trpc.employees.delete.useMutation({ onSuccess: () => { utils.employees.list.invalidate(); toast.success("Employee removed"); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ ...defaultForm });
  const { data: nextId } = trpc.employees.nextId.useQuery();

  const filtered = useMemo(() => employees.filter((e: any) => e.name.toLowerCase().includes(search.toLowerCase()) || (e.dept || "").toLowerCase().includes(search.toLowerCase())), [employees, search]);

  const openCreate = () => { setEditing(null); setForm({ ...defaultForm }); setOpen(true); };
  const openEdit = (e: any) => {
    setEditing(e);
    setForm({
      empId: e.empId, name: e.name, title: e.title || "", dept: e.dept || "", type: e.type,
      salary: String(e.salary), rate: String(e.rate), email: e.email || "", startDate: e.startDate || "", active: e.active,
      basicSalary: String(e.basicSalary || "0"), hra: String(e.hra || "0"), da: String(e.da || "0"), specialAllowance: String(e.specialAllowance || "0"),
      panNumber: e.panNumber || "", uanNumber: e.uanNumber || "", esiNumber: e.esiNumber || "", pfOptOut: e.pfOptOut || false
    });
    setOpen(true);
  };

  // Auto-calculate salary structure when CTC changes
  const autoCalcStructure = (ctc: string) => {
    const annual = Number(ctc) || 0;
    const basic = Math.round(annual * 0.50);
    const hra = Math.round(annual * 0.20);
    const da = Math.round(annual * 0.10);
    const special = annual - basic - hra - da;
    setForm(f => ({ ...f, salary: ctc, basicSalary: String(basic), hra: String(hra), da: String(da), specialAllowance: String(Math.max(0, special)) }));
  };

  const handleSave = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    if (editing) {
      const { empId, ...rest } = form;
      updateMut.mutate({ id: editing.id, ...rest });
    } else {
      createMut.mutate({ ...form, empId: nextId || "EMP-001" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Employees</h1><p className="text-sm text-muted-foreground mt-1">Manage employee records with Indian salary structure</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Employee</Button>
      </div>
      <Card className="shadow-sm">
        <div className="p-4 border-b"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div></div>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Department</TableHead><TableHead>Type</TableHead><TableHead className="text-right">CTC (Annual)</TableHead><TableHead>PAN</TableHead><TableHead>Status</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No employees found</TableCell></TableRow>
              : filtered.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-sm">{e.empId}</TableCell>
                  <TableCell><div className="font-medium">{e.name}</div><div className="text-xs text-muted-foreground">{e.title || ""}</div></TableCell>
                  <TableCell>{e.dept || "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{e.type}</Badge></TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{e.type === "Salaried" ? fmt(Number(e.salary)) : fmt(Number(e.rate)) + "/hr"}</TableCell>
                  <TableCell className="font-mono text-xs">{e.panNumber || "—"}</TableCell>
                  <TableCell><Badge variant={e.active ? "default" : "secondary"} className={e.active ? "bg-emerald-100 text-emerald-800" : ""}>{e.active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: e.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Employee Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Employee" : "New Employee"}</DialogTitle></DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="basic">Basic Info</TabsTrigger><TabsTrigger value="salary">Salary Structure</TabsTrigger><TabsTrigger value="statutory">Statutory</TabsTrigger></TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="text-sm font-medium">Email</label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Title / Designation</label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Accountant" /></div>
                <div><label className="text-sm font-medium">Department</label><Input value={form.dept} onChange={e => setForm({ ...form, dept: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Type</label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Salaried">Salaried</SelectItem><SelectItem value="Hourly">Hourly</SelectItem></SelectContent></Select></div>
                <div><label className="text-sm font-medium">Start Date</label><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
              </div>
            </TabsContent>

            <TabsContent value="salary" className="space-y-4 mt-4">
              <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                Enter the annual CTC to auto-calculate the salary structure (50% Basic, 20% HRA, 10% DA, 20% Special Allowance). You can adjust individual components manually.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Annual CTC (₹)</label><Input type="number" value={form.salary} onChange={e => autoCalcStructure(e.target.value)} /></div>
                {form.type === "Hourly" && <div><label className="text-sm font-medium">Hourly Rate (₹)</label><Input type="number" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} /></div>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Basic Salary (Annual)</label><Input type="number" value={form.basicSalary} onChange={e => setForm({ ...form, basicSalary: e.target.value })} /></div>
                <div><label className="text-sm font-medium">HRA (Annual)</label><Input type="number" value={form.hra} onChange={e => setForm({ ...form, hra: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">DA (Annual)</label><Input type="number" value={form.da} onChange={e => setForm({ ...form, da: e.target.value })} /></div>
                <div><label className="text-sm font-medium">Special Allowance (Annual)</label><Input type="number" value={form.specialAllowance} onChange={e => setForm({ ...form, specialAllowance: e.target.value })} /></div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="flex justify-between font-medium"><span>Monthly Gross</span><span className="tabular-nums">{fmt(Number(form.salary) / 12)}</span></div>
              </div>
            </TabsContent>

            <TabsContent value="statutory" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">PAN Number</label><Input value={form.panNumber} onChange={e => setForm({ ...form, panNumber: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" maxLength={10} /></div>
                <div><label className="text-sm font-medium">UAN Number</label><Input value={form.uanNumber} onChange={e => setForm({ ...form, uanNumber: e.target.value })} placeholder="Universal Account Number" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">ESI Number</label><Input value={form.esiNumber} onChange={e => setForm({ ...form, esiNumber: e.target.value })} placeholder="ESI IP Number" /></div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div><label className="text-sm font-medium">PF Opt-Out</label><p className="text-xs text-muted-foreground">Employee opts out of PF (if eligible)</p></div>
                  <Switch checked={form.pfOptOut} onCheckedChange={v => setForm({ ...form, pfOptOut: v })} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-4"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
