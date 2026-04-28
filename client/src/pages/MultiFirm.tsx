import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Building2, Plus, Settings, ArrowRight, CheckCircle, Star } from "lucide-react";
import { toast } from "sonner";

export default function MultiFirm() {
  const [firms, setFirms] = useState([
    { id: 1, name: "KukBook Technologies Pvt Ltd", gstin: "29AABCT1332L1ZL", type: "Private Limited", address: "Bangalore, Karnataka", active: true, createdAt: "2026-01-15" },
    { id: 2, name: "KukBook Retail", gstin: "29AADCB2230M1ZT", type: "Proprietorship", address: "Mumbai, Maharashtra", active: false, createdAt: "2026-03-20" },
  ]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", gstin: "", type: "Private Limited", address: "" });

  const handleAdd = () => {
    if (!form.name) { toast.error("Firm name is required"); return; }
    setFirms([...firms, { id: firms.length + 1, ...form, active: false, createdAt: new Date().toISOString().split("T")[0] }]);
    setOpen(false);
    setForm({ name: "", gstin: "", type: "Private Limited", address: "" });
    toast.success("Firm added successfully");
  };

  const switchFirm = (id: number) => {
    setFirms(firms.map(f => ({ ...f, active: f.id === id })));
    toast.success(`Switched to ${firms.find(f => f.id === id)?.name}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Building2 className="h-6 w-6" />Multi-Firm Management</h1><p className="text-sm text-muted-foreground mt-1">Manage multiple businesses from a single account</p></div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Firm</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {firms.map(firm => (
          <Card key={firm.id} className={`transition-all hover:shadow-md ${firm.active ? "ring-2 ring-primary" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />{firm.name}
                </CardTitle>
                {firm.active && <Badge className="bg-primary text-primary-foreground"><Star className="h-3 w-3 mr-1" />Active</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">GSTIN</span><span className="font-mono">{firm.gstin || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{firm.type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span>{firm.address || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{firm.createdAt}</span></div>
              </div>
              <div className="flex gap-2 pt-2">
                {!firm.active && <Button className="flex-1" onClick={() => switchFirm(firm.id)}><ArrowRight className="h-4 w-4 mr-2" />Switch to this Firm</Button>}
                {firm.active && <Button variant="outline" className="flex-1" disabled><CheckCircle className="h-4 w-4 mr-2" />Currently Active</Button>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">How Multi-Firm Works</p>
              <p className="text-sm text-muted-foreground">Each firm maintains its own set of books — separate invoices, bills, inventory, and reports. Switch between firms using the cards above. The active firm's data is shown across all modules.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Firm</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><label className="text-sm font-medium">Firm Name *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="My Company Pvt Ltd" /></div>
            <div><label className="text-sm font-medium">GSTIN</label><Input value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} placeholder="29AABCT1332L1ZL" /></div>
            <div><label className="text-sm font-medium">Business Type</label><Input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="Private Limited / Proprietorship" /></div>
            <div><label className="text-sm font-medium">Address</label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="City, State" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleAdd}>Add Firm</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
