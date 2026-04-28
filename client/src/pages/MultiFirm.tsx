import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Building2, Plus, Settings, ArrowRight, CheckCircle, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";

export default function MultiFirm() {
  const utils = trpc.useUtils();
  const { activeCompany, switchToCompany } = useCompany();
  const { data: companies = [], isLoading } = trpc.company.list.useQuery();
  const createMut = trpc.company.create.useMutation({
    onSuccess: (_data, variables) => {
      utils.company.list.invalidate();
      setOpen(false);
      setForm({ name: "", slug: "", gstin: "", pan: "", address: "", city: "", state: "", phone: "", email: "", industry: "" });
      toast.success("Company created with 30-day free trial!");
    },
    onError: (e) => toast.error(e.message),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", gstin: "", pan: "", address: "", city: "", state: "", phone: "", email: "", industry: "" });

  const handleCreate = () => {
    if (!form.name || !form.slug) { toast.error("Company name and slug are required"); return; }
    createMut.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Building2 className="h-6 w-6" />Multi-Firm Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage multiple businesses from one account</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Company</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading companies...</div>
      ) : companies.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Companies Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first company to get started with a 30-day free trial</p>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Create First Company</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c: any) => {
            const isActive = activeCompany?.id === c.id;
            return (
              <Card key={c.id} className={`cursor-pointer transition-all hover:shadow-md ${isActive ? "ring-2 ring-primary shadow-md" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5" />{c.name}</CardTitle>
                    {isActive && <Badge className="bg-primary text-primary-foreground"><Star className="h-3 w-3 mr-1" />Active</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    {c.slug && <div className="flex justify-between"><span className="text-muted-foreground">URL</span><span className="font-mono text-xs">/app/{c.slug}</span></div>}
                    {c.gstin && <div className="flex justify-between"><span className="text-muted-foreground">GSTIN</span><span className="font-mono">{c.gstin}</span></div>}
                    {c.industry && <div className="flex justify-between"><span className="text-muted-foreground">Industry</span><span>{c.industry}</span></div>}
                    {c.city && <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{c.city}{c.state ? `, ${c.state}` : ""}</span></div>}
                    {c.email && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{c.email}</span></div>}
                    {c.phone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{c.phone}</span></div>}
                    <div className="flex justify-between"><span className="text-muted-foreground">Role</span><Badge variant="outline" className="capitalize">{c.memberRole || "owner"}</Badge></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{new Date(c.createdAt).toLocaleDateString()}</span></div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {!isActive ? (
                      <Button className="flex-1" onClick={() => switchToCompany(c)}>
                        <ArrowRight className="h-4 w-4 mr-2" />Switch to this Firm
                      </Button>
                    ) : (
                      <Button variant="outline" className="flex-1" disabled><CheckCircle className="h-4 w-4 mr-2" />Currently Active</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">How Multi-Firm Works</p>
              <p className="text-sm text-muted-foreground">Each firm maintains its own set of books — separate invoices, bills, inventory, and reports. Switch between firms using the company switcher in the sidebar or the cards above. Each company gets its own URL (e.g., /app/your-company-slug). Each new company gets a 30-day free trial.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create New Company</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Company Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') }))} placeholder="Acme Corp" /></div>
              <div><Label>Slug (URL) *</Label><Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="acme-corp" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>GSTIN</Label><Input value={form.gstin} onChange={e => setForm(p => ({ ...p, gstin: e.target.value }))} placeholder="22AAAAA0000A1Z5" /></div>
              <div><Label>PAN</Label><Input value={form.pan} onChange={e => setForm(p => ({ ...p, pan: e.target.value }))} placeholder="AAAAA0000A" /></div>
            </div>
            <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="123 Business Street" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>City</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Mumbai" /></div>
              <div><Label>State</Label><Input value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} placeholder="Maharashtra" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 9876543210" /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="info@company.com" /></div>
            </div>
            <div><Label>Industry</Label><Input value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} placeholder="Manufacturing, Retail, Services..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMut.isPending}>{createMut.isPending ? "Creating..." : "Create Company (30-day Free Trial)"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
