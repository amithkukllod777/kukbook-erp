import { trpc } from "@/lib/trpc";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Save, CheckCircle2, AlertCircle, Users, MapPin, FileText, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry"
];

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export default function CompanyProfile() {
  const { activeCompany } = useCompany();
  const companyId = activeCompany?.id;
  const { data: company, isLoading } = trpc.company.getById.useQuery({ id: companyId! }, { enabled: !!companyId });
  const { data: members = [] } = trpc.company.members.useQuery({ companyId: companyId! }, { enabled: !!companyId });
  const { data: subscription } = trpc.subscription.get.useQuery({ companyId: companyId! }, { enabled: !!companyId });
  const utils = trpc.useUtils();
  const updateMut = trpc.company.update.useMutation({
    onSuccess: () => {
      toast.success("Company profile updated");
      utils.company.getById.invalidate({ id: companyId! });
      utils.company.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [form, setForm] = useState({
    name: "", gstin: "", pan: "", address: "", city: "", state: "",
    phone: "", email: "", industry: "",
  });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || "", gstin: company.gstin || "", pan: company.pan || "",
        address: company.address || "", city: company.city || "", state: company.state || "",
        phone: company.phone || "", email: company.email || "", industry: company.industry || "",
      });
    }
  }, [company]);

  const gstinValid = useMemo(() => {
    if (!form.gstin) return null;
    return GSTIN_REGEX.test(form.gstin.toUpperCase());
  }, [form.gstin]);

  const panValid = useMemo(() => {
    if (!form.pan) return null;
    return PAN_REGEX.test(form.pan.toUpperCase());
  }, [form.pan]);

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Company name is required"); return; }
    if (form.gstin && !GSTIN_REGEX.test(form.gstin.toUpperCase())) { toast.error("Invalid GSTIN format"); return; }
    if (form.pan && !PAN_REGEX.test(form.pan.toUpperCase())) { toast.error("Invalid PAN format"); return; }
    updateMut.mutate({ id: companyId!, ...form, gstin: form.gstin.toUpperCase(), pan: form.pan.toUpperCase() });
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Company Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your business details, GST registration, and contact information</p>
        </div>
        <Button onClick={handleSave} disabled={updateMut.isPending}>
          {updateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Building2 className="w-5 h-5 text-blue-600" /></div><div><p className="text-xs text-muted-foreground">Company</p><p className="font-medium text-sm">{company?.name || "—"}</p></div></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-emerald-600" /></div><div><p className="text-xs text-muted-foreground">GSTIN</p><p className="font-mono text-sm">{company?.gstin || "Not set"}</p></div></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-purple-600" /></div><div><p className="text-xs text-muted-foreground">Team Members</p><p className="font-medium text-sm">{members.length}</p></div></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"><MapPin className="w-5 h-5 text-amber-600" /></div><div><p className="text-xs text-muted-foreground">State</p><p className="font-medium text-sm">{company?.state || "Not set"}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="business">
        <TabsList><TabsTrigger value="business">Business Details</TabsTrigger><TabsTrigger value="tax">GST & Tax</TabsTrigger><TabsTrigger value="contact">Contact</TabsTrigger><TabsTrigger value="team">Team</TabsTrigger></TabsList>

        <TabsContent value="business" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Business Information</CardTitle><CardDescription>Core details about your company</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Company Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" /></div>
                <div><Label>Industry</Label><Input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} className="mt-1" /></div>
              </div>
              <div><Label>URL Slug</Label><div className="flex items-center gap-2 mt-1"><span className="text-sm text-muted-foreground bg-muted px-2 py-2 rounded-l-md border border-r-0">/app/</span><Input value={company?.slug || ""} disabled className="rounded-l-none bg-muted" /></div><p className="text-xs text-muted-foreground mt-1">Slug cannot be changed after creation</p></div>
              {subscription && (
                <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                  <div><p className="text-sm font-medium">Subscription</p><p className="text-xs text-muted-foreground">Plan: {subscription.plan} | Status: {subscription.status}</p></div>
                  <Badge variant={subscription.status === "active" ? "default" : "secondary"} className={subscription.status === "active" ? "bg-emerald-100 text-emerald-800" : ""}>{subscription.status}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">GST & Tax Registration</CardTitle><CardDescription>Your tax identification details for compliance</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>GSTIN (GST Identification Number)</Label>
                <div className="relative mt-1">
                  <Input value={form.gstin} maxLength={15} placeholder="22AAAAA0000A1Z5"
                    onChange={e => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))} className="font-mono pr-10" />
                  {gstinValid !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {gstinValid ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                    </div>
                  )}
                </div>
                {gstinValid === false && <p className="text-xs text-amber-600 mt-1">Format: 2 digit state code + 10 char PAN + 1Z + check digit</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>PAN Number</Label>
                  <div className="relative mt-1">
                    <Input value={form.pan} maxLength={10} placeholder="AAAAA0000A"
                      onChange={e => setForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))} className="font-mono pr-10" />
                    {panValid !== null && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {panValid ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label>State (for GST)</Label>
                  <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Contact Information</CardTitle><CardDescription>Business address and contact details</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Business Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="mt-1" placeholder="123, MG Road, Industrial Area" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>City</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="mt-1" /></div>
                <div><Label>State</Label><Input value={form.state} disabled className="mt-1 bg-muted" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" placeholder="+91 98765 43210" /></div>
                <div><Label>Business Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1" placeholder="accounts@company.com" /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Team Members</CardTitle><CardDescription>People who have access to this company</CardDescription></CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No team members yet. Invite members from the Admin Settings page.</p>
              ) : (
                <div className="space-y-3">
                  {members.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          {(m.userName || m.userEmail || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.userName || m.userEmail || `User #${m.userId}`}</p>
                          <p className="text-xs text-muted-foreground">{m.userEmail || ""}</p>
                        </div>
                      </div>
                      <Badge variant={m.role === "owner" ? "default" : "secondary"}>{m.role}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
