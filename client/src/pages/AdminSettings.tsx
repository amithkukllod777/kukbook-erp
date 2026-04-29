import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Settings, Save, CreditCard, Eye, EyeOff, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const settingFields = [
  { key: "company_name", label: "Company Name", placeholder: "KukBook Inc." },
  { key: "company_email", label: "Company Email", placeholder: "info@kukbook.com" },
  { key: "company_phone", label: "Company Phone", placeholder: "+91 98765 43210" },
  { key: "company_address", label: "Company Address", placeholder: "123 Business St, City, State" },
  { key: "tax_id", label: "Tax ID / GST Number", placeholder: "22AAAAA0000A1Z5" },
  { key: "currency", label: "Default Currency", placeholder: "INR" },
  { key: "fiscal_year_start", label: "Fiscal Year Start", placeholder: "April" },
  { key: "invoice_prefix", label: "Invoice Prefix", placeholder: "INV-" },
  { key: "bill_prefix", label: "Bill Prefix", placeholder: "BILL-" },
  { key: "po_prefix", label: "PO Prefix", placeholder: "PO-" },
];

const razorpayFields = [
  { key: "razorpay_key_id", label: "Razorpay Key ID", placeholder: "rzp_test_xxxxxxxxxx", secret: false },
  { key: "razorpay_key_secret", label: "Razorpay Key Secret", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
  { key: "razorpay_webhook_secret", label: "Webhook Secret (optional)", placeholder: "whsec_xxxxxxxxxx", secret: true },
];

export default function AdminSettings() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: settings = [], isLoading, error } = trpc.settings.list.useQuery(undefined, { retry: false });
  const upsertMut = trpc.settings.upsert.useMutation({ onSuccess: () => { utils.settings.list.invalidate(); toast.success("Setting saved"); } });
  const [values, setValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

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

  const handleSaveAllRazorpay = () => {
    razorpayFields.forEach(field => {
      if (values[field.key]) {
        upsertMut.mutate({ key: field.key, value: values[field.key] });
      }
    });
  };

  const isRazorpayConfigured = !!(values["razorpay_key_id"] && values["razorpay_key_secret"]);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Settings</h1><p className="text-sm text-muted-foreground mt-1">Configure your ERP system</p></div>

      {/* Company Information */}
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

      {/* Payment Gateway — Razorpay */}
      <Card className="shadow-sm border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                Payment Gateway — Razorpay
              </CardTitle>
              <CardDescription className="mt-1">
                Configure Razorpay credentials for subscription payments
              </CardDescription>
            </div>
            <Badge variant={isRazorpayConfigured ? "default" : "secondary"} className={isRazorpayConfigured ? "bg-emerald-100 text-emerald-700" : ""}>
              {isRazorpayConfigured ? "Configured" : "Not Configured"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Go to <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">Razorpay Dashboard → API Keys <ExternalLink className="h-3 w-3 inline" /></a></li>
              <li>Generate a new Key ID and Key Secret (Test mode for testing)</li>
              <li>Paste them below and click Save</li>
              <li>For webhooks, add URL: <code className="bg-blue-100 px-1 rounded">https://kukbook.manus.space/api/razorpay/webhook</code></li>
            </ol>
          </div>

          {/* Razorpay Fields */}
          <div className="grid gap-4">
            {razorpayFields.map((field) => (
              <div key={field.key} className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium">{field.label}</label>
                  <div className="relative">
                    <Input
                      type={field.secret && !showSecrets[field.key] ? "password" : "text"}
                      value={values[field.key] || ""}
                      onChange={e => setValues({ ...values, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="pr-10"
                    />
                    {field.secret && (
                      <Button
                        variant="ghost" size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowSecrets({ ...showSecrets, [field.key]: !showSecrets[field.key] })}
                      >
                        {showSecrets[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="icon" onClick={() => handleSave(field.key)} disabled={upsertMut.isPending}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Save All Button */}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSaveAllRazorpay} disabled={upsertMut.isPending} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Save All Razorpay Settings
            </Button>
            {isRazorpayConfigured && (
              <span className="text-sm text-emerald-600 font-medium">✓ Ready to accept payments</span>
            )}
          </div>

          {/* Mode indicator */}
          {values["razorpay_key_id"] && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Mode:</span>
              <Badge variant="outline" className={values["razorpay_key_id"].startsWith("rzp_live") ? "border-emerald-500 text-emerald-700" : "border-amber-500 text-amber-700"}>
                {values["razorpay_key_id"].startsWith("rzp_live") ? "🟢 Live" : "🟡 Test"}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">System Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Application</span><span className="font-medium">KukBook ERP v1.0</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Current User</span><span className="font-medium">{user?.name || "—"}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Role</span><span className="font-medium">{user?.role === "admin" ? "Administrator" : "Staff"}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Database</span><span className="font-medium">MySQL (TiDB)</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">Payment Gateway</span><span className="font-medium">{isRazorpayConfigured ? "Razorpay ✓" : "Not configured"}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
