import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Search, Building2, MapPin, Truck } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
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

const GSTIN_STATE_CODES: Record<string, string> = {
  "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
  "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
  "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
  "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
  "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh",
  "24": "Gujarat", "25": "Dadra and Nagar Haveli and Daman and Diu", "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra", "28": "Andhra Pradesh", "29": "Karnataka", "30": "Goa",
  "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry",
  "35": "Andaman and Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh"
};

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const emptyForm = {
  name: "", email: "", phone: "", gstin: "", pan: "",
  billingAddress1: "", billingAddress2: "", billingCity: "", billingState: "", billingPincode: "",
  shippingAddress1: "", shippingAddress2: "", shippingCity: "", shippingState: "", shippingPincode: "",
};

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);

export default function Customers() {
  const utils = trpc.useUtils();
  const { data: customers = [], isLoading } = trpc.customers.list.useQuery();
  const createMut = trpc.customers.create.useMutation({ onSuccess: () => { utils.customers.list.invalidate(); toast.success("Customer created"); setOpen(false); } });
  const updateMut = trpc.customers.update.useMutation({ onSuccess: () => { utils.customers.list.invalidate(); toast.success("Customer updated"); setOpen(false); } });
  const deleteMut = trpc.customers.delete.useMutation({ onSuccess: () => { utils.customers.list.invalidate(); toast.success("Customer deleted"); } });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ ...emptyForm });
  const [sameAsBilling, setSameAsBilling] = useState(false);

  const filtered = useMemo(() => customers.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.gstin || "").toLowerCase().includes(search.toLowerCase())
  ), [customers, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setSameAsBilling(false);
    setOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    const f = {
      name: c.name || "", email: c.email || "", phone: c.phone || "",
      gstin: c.gstin || "", pan: c.pan || "",
      billingAddress1: c.billingAddress1 || "", billingAddress2: c.billingAddress2 || "",
      billingCity: c.billingCity || "", billingState: c.billingState || "", billingPincode: c.billingPincode || "",
      shippingAddress1: c.shippingAddress1 || "", shippingAddress2: c.shippingAddress2 || "",
      shippingCity: c.shippingCity || "", shippingState: c.shippingState || "", shippingPincode: c.shippingPincode || "",
    };
    const same = f.billingAddress1 === f.shippingAddress1 && f.billingCity === f.shippingCity &&
      f.billingState === f.shippingState && f.billingPincode === f.shippingPincode && f.billingAddress1 !== "";
    setSameAsBilling(same);
    setForm(f);
    setOpen(true);
  };

  const handleGstinChange = useCallback((gstin: string) => {
    const upper = gstin.toUpperCase();
    setForm(prev => {
      const updated = { ...prev, gstin: upper };
      if (upper.length >= 2) {
        const code = upper.substring(0, 2);
        const state = GSTIN_STATE_CODES[code];
        if (state) {
          updated.billingState = state;
          if (sameAsBilling) updated.shippingState = state;
        }
      }
      if (upper.length >= 12) {
        updated.pan = upper.substring(2, 12);
      }
      return updated;
    });
  }, [sameAsBilling]);

  const handleSameAsBilling = useCallback((checked: boolean) => {
    setSameAsBilling(checked);
    if (checked) {
      setForm(f => ({
        ...f,
        shippingAddress1: f.billingAddress1, shippingAddress2: f.billingAddress2,
        shippingCity: f.billingCity, shippingState: f.billingState, shippingPincode: f.billingPincode,
      }));
    }
  }, []);

  const updateBillingField = useCallback((field: string, value: string) => {
    setForm(f => {
      const updated: any = { ...f, [field]: value };
      if (sameAsBilling) {
        const shipField = field.replace("billing", "shipping");
        updated[shipField] = value;
      }
      return updated;
    });
  }, [sameAsBilling]);

  const handleSave = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    if (form.gstin && !GSTIN_REGEX.test(form.gstin.toUpperCase())) {
      toast.error("Invalid GSTIN format"); return;
    }
    const payload = { ...form, gstin: form.gstin.toUpperCase(), pan: form.pan.toUpperCase() };
    if (editing) { updateMut.mutate({ id: editing.id, ...payload }); }
    else { createMut.mutate(payload); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your customer records</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Customer</Button>
      </div>

      <Card className="shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, email, GSTIN..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No customers found</TableCell></TableRow>
              : filtered.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{c.gstin || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone || "—"}</TableCell>
                  <TableCell>{c.billingState || c.state || "—"}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(Number(c.balance || 0))}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this customer?")) deleteMut.mutate({ id: c.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Customer" : "New Customer"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Building2 className="h-4 w-4" /> Basic Information
              </div>
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Customer / Business name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
                </div>
              </div>
            </div>

            {/* GST Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Building2 className="h-4 w-4" /> GST Details
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">GSTIN</label>
                  <Input
                    value={form.gstin}
                    onChange={e => handleGstinChange(e.target.value)}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    className="font-mono uppercase"
                  />
                  {form.gstin && form.gstin.length === 15 && (
                    <p className={`text-xs mt-1 ${GSTIN_REGEX.test(form.gstin.toUpperCase()) ? "text-green-600" : "text-red-500"}`}>
                      {GSTIN_REGEX.test(form.gstin.toUpperCase()) ? "✓ Valid GSTIN" : "✗ Invalid GSTIN format"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">PAN</label>
                  <Input
                    value={form.pan}
                    onChange={e => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                    placeholder="AAAAA0000A"
                    maxLength={10}
                    className="font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Bill To Address */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <MapPin className="h-4 w-4" /> Bill To Address
              </div>
              <div>
                <label className="text-sm font-medium">Address Line 1</label>
                <Input value={form.billingAddress1} onChange={e => updateBillingField("billingAddress1", e.target.value)} placeholder="Building, Street, Area" />
              </div>
              <div>
                <label className="text-sm font-medium">Address Line 2</label>
                <Input value={form.billingAddress2} onChange={e => updateBillingField("billingAddress2", e.target.value)} placeholder="Landmark, Locality (optional)" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Input value={form.billingCity} onChange={e => updateBillingField("billingCity", e.target.value)} placeholder="City" />
                </div>
                <div>
                  <label className="text-sm font-medium">State</label>
                  <Select value={form.billingState} onValueChange={v => updateBillingField("billingState", v)}>
                    <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Pincode</label>
                  <Input value={form.billingPincode} onChange={e => updateBillingField("billingPincode", e.target.value)} placeholder="400001" maxLength={6} />
                </div>
              </div>
            </div>

            {/* Ship To Address */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Truck className="h-4 w-4" /> Ship To Address
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sameAsBilling"
                    checked={sameAsBilling}
                    onCheckedChange={(checked) => handleSameAsBilling(checked === true)}
                  />
                  <label htmlFor="sameAsBilling" className="text-sm text-muted-foreground cursor-pointer">
                    Same as Bill To
                  </label>
                </div>
              </div>
              {!sameAsBilling && (
                <>
                  <div>
                    <label className="text-sm font-medium">Address Line 1</label>
                    <Input value={form.shippingAddress1} onChange={e => setForm({ ...form, shippingAddress1: e.target.value })} placeholder="Building, Street, Area" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Address Line 2</label>
                    <Input value={form.shippingAddress2} onChange={e => setForm({ ...form, shippingAddress2: e.target.value })} placeholder="Landmark, Locality (optional)" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">City</label>
                      <Input value={form.shippingCity} onChange={e => setForm({ ...form, shippingCity: e.target.value })} placeholder="City" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">State</label>
                      <Select value={form.shippingState} onValueChange={v => setForm({ ...form, shippingState: v })}>
                        <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Pincode</label>
                      <Input value={form.shippingPincode} onChange={e => setForm({ ...form, shippingPincode: e.target.value })} placeholder="400001" maxLength={6} />
                    </div>
                  </div>
                </>
              )}
              {sameAsBilling && (
                <p className="text-sm text-muted-foreground italic">Shipping address will be same as billing address</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
