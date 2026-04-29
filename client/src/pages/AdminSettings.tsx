import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Settings, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const settingFields = [
  { key: "company_name", label: "Company Name", placeholder: "KukBook Inc." },
  { key: "company_email", label: "Company Email", placeholder: "info@kukbook.com" },
  { key: "company_phone", label: "Company Phone", placeholder: "+1 (555) 000-0000" },
  { key: "company_address", label: "Company Address", placeholder: "123 Business St, City, State" },
  { key: "tax_id", label: "Tax ID / GST Number", placeholder: "XX-XXXXXXX" },
  { key: "currency", label: "Default Currency", placeholder: "INR" },
  { key: "fiscal_year_start", label: "Fiscal Year Start", placeholder: "January" },
  { key: "invoice_prefix", label: "Invoice Prefix", placeholder: "INV-" },
  { key: "bill_prefix", label: "Bill Prefix", placeholder: "BILL-" },
  { key: "po_prefix", label: "PO Prefix", placeholder: "PO-" },
];

export default function AdminSettings() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: settings = [], isLoading, error } = trpc.settings.list.useQuery(undefined, { retry: false });
  const upsertMut = trpc.settings.upsert.useMutation({ onSuccess: () => { utils.settings.list.invalidate(); toast.success("Setting saved"); } });

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings.length > 0) {
      const map: Record<string, string> = {};
      settings.forEach((s: any) => { map[s.key] = s.value; });
      setValues(map);
    }
  }, [settings]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-1">Only administrators can access settings.</p>
        </div>
      </div>
    );
  }

  const handleSave = (key: string) => {
    upsertMut.mutate({ key, value: values[key] || "" });
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Settings</h1><p className="text-sm text-muted-foreground mt-1">Configure your ERP system</p></div>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4" />Company Information</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="text-muted-foreground py-4">Loading settings...</div> : (
            <div className="grid gap-4">
              {settingFields.map((field) => (
                <div key={field.key} className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="text-sm font-medium">{field.label}</label>
                    <Input
                      value={values[field.key] || ""}
                      onChange={e => setValues({ ...values, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={() => handleSave(field.key)} disabled={upsertMut.isPending}>
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">System Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Application</span><span className="font-medium">KukBook ERP v1.0</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Current User</span><span className="font-medium">{user?.name || "—"}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Role</span><span className="font-medium">{user?.role === "admin" ? "Administrator" : "Staff"}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">Database</span><span className="font-medium">MySQL (TiDB)</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
