import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Truck, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function EWayBill() {
  const { data: invoices = [] } = trpc.invoices.list.useQuery();
  const [bills, setBills] = useState<any[]>([
    { id: 1, ewayBillNo: "EWB-2026-00001", invoiceRef: "INV-001", fromGSTIN: "29AABCT1332L1ZL", toGSTIN: "27AADCB2230M1ZT", fromPlace: "Bangalore", toPlace: "Mumbai", transportMode: "Road", vehicleNo: "KA-01-AB-1234", distance: "980 km", value: "50,000", status: "Active", generatedDate: "2026-04-15", validUntil: "2026-04-16" },
  ]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({ invoiceRef: "", fromGSTIN: "", toGSTIN: "", fromPlace: "", toPlace: "", transportMode: "Road", vehicleNo: "", distance: "", value: "" });

  const filtered = useMemo(() => bills.filter(b => {
    const matchSearch = b.ewayBillNo.toLowerCase().includes(search.toLowerCase()) || b.invoiceRef.includes(search) || b.toPlace.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchStatus;
  }), [bills, search, filterStatus]);

  const statusColors: Record<string, string> = { Active: "bg-emerald-100 text-emerald-700", Expired: "bg-red-100 text-red-700", Cancelled: "bg-gray-100 text-gray-700" };

  const handleGenerate = () => {
    if (!form.fromGSTIN || !form.toGSTIN || !form.fromPlace || !form.toPlace) { toast.error("Please fill all required fields"); return; }
    const newBill = {
      id: bills.length + 1,
      ewayBillNo: `EWB-2026-${String(bills.length + 1).padStart(5, "0")}`,
      ...form,
      status: "Active",
      generatedDate: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    };
    setBills([...bills, newBill]);
    setOpen(false);
    toast.success("E-Way Bill generated successfully");
  };

  const cancelBill = (id: number) => {
    setBills(bills.map(b => b.id === id ? { ...b, status: "Cancelled" } : b));
    toast.success("E-Way Bill cancelled");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">E-Way Bills</h1><p className="text-sm text-muted-foreground mt-1">Generate and manage E-Way Bills for goods transport</p></div>
        <Button onClick={() => { setForm({ invoiceRef: "", fromGSTIN: "", toGSTIN: "", fromPlace: "", toPlace: "", transportMode: "Road", vehicleNo: "", distance: "", value: "" }); setOpen(true); }}><Plus className="h-4 w-4 mr-2" />Generate E-Way Bill</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total Generated</p><p className="text-2xl font-bold">{bills.length}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold text-emerald-600">{bills.filter(b => b.status === "Active").length}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Expired / Cancelled</p><p className="text-2xl font-bold text-red-600">{bills.filter(b => b.status !== "Active").length}</p></CardContent></Card>
      </div>

      <Card className="shadow-sm">
        <div className="p-4 border-b flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search E-Way Bills..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Expired">Expired</SelectItem><SelectItem value="Cancelled">Cancelled</SelectItem></SelectContent></Select>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>E-Way Bill No</TableHead><TableHead>Invoice</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Transport</TableHead><TableHead>Vehicle</TableHead><TableHead>Status</TableHead><TableHead>Valid Until</TableHead><TableHead className="w-[80px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No E-Way Bills found</TableCell></TableRow>
              : filtered.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-sm">{b.ewayBillNo}</TableCell>
                  <TableCell>{b.invoiceRef || "—"}</TableCell>
                  <TableCell>{b.fromPlace}</TableCell>
                  <TableCell>{b.toPlace}</TableCell>
                  <TableCell>{b.transportMode}</TableCell>
                  <TableCell className="font-mono">{b.vehicleNo || "—"}</TableCell>
                  <TableCell><Badge className={statusColors[b.status] || ""} variant="secondary">{b.status}</Badge></TableCell>
                  <TableCell>{b.validUntil}</TableCell>
                  <TableCell>
                    {b.status === "Active" && <Button variant="ghost" size="icon" title="Cancel" onClick={() => cancelBill(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Generate E-Way Bill</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Invoice Reference</label>
                <Select value={form.invoiceRef} onValueChange={v => { const inv = invoices.find((i: any) => i.invoiceId === v); setForm({ ...form, invoiceRef: v, value: inv?.total || form.value }); }}>
                  <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                  <SelectContent>{invoices.map((i: any) => <SelectItem key={i.id} value={i.invoiceId}>{i.invoiceId} — {i.customerName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Consignment Value</label><Input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="50000" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">From GSTIN *</label><Input value={form.fromGSTIN} onChange={e => setForm({ ...form, fromGSTIN: e.target.value })} placeholder="29AABCT1332L1ZL" /></div>
              <div><label className="text-sm font-medium">To GSTIN *</label><Input value={form.toGSTIN} onChange={e => setForm({ ...form, toGSTIN: e.target.value })} placeholder="27AADCB2230M1ZT" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">From Place *</label><Input value={form.fromPlace} onChange={e => setForm({ ...form, fromPlace: e.target.value })} placeholder="Bangalore" /></div>
              <div><label className="text-sm font-medium">To Place *</label><Input value={form.toPlace} onChange={e => setForm({ ...form, toPlace: e.target.value })} placeholder="Mumbai" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-sm font-medium">Transport Mode</label>
                <Select value={form.transportMode} onValueChange={v => setForm({ ...form, transportMode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Road">Road</SelectItem><SelectItem value="Rail">Rail</SelectItem><SelectItem value="Air">Air</SelectItem><SelectItem value="Ship">Ship</SelectItem></SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Vehicle No</label><Input value={form.vehicleNo} onChange={e => setForm({ ...form, vehicleNo: e.target.value })} placeholder="KA-01-AB-1234" /></div>
              <div><label className="text-sm font-medium">Distance</label><Input value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })} placeholder="980 km" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleGenerate}>Generate E-Way Bill</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
