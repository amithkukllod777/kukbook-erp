import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    gstin: "",
    pan: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    industry: "",
  });

  const utils = trpc.useUtils();
  const createCompany = trpc.company.create.useMutation({
    onSuccess: (_data) => {
      toast.success("Company created successfully! Your 30-day free trial has started.");
      utils.company.list.invalidate();
      // Store slug and redirect to slug-based URL after company list refreshes
      const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      localStorage.setItem("kukbook_active_company_slug", slug);
      onComplete();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSlugify = (name: string) => {
    setForm(f => ({
      ...f,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Welcome to KukBook ERP</CardTitle>
          <CardDescription>
            {step === 1
              ? "Let's set up your company to get started with your 30-day free trial."
              : "Almost done! Add your business details."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Company Name *</Label>
                <Input id="name" placeholder="e.g. Acme Pvt Ltd" value={form.name}
                  onChange={e => handleSlugify(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">/app/</span>
                  <Input id="slug" value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Your company will be accessible at /app/{form.slug || "your-slug"}</p>
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" placeholder="e.g. Manufacturing, Retail, Services"
                  value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={() => { if (!form.name) { toast.error("Company name is required"); return; } setStep(2); }}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input id="gstin" placeholder="22AAAAA0000A1Z5" value={form.gstin}
                    onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="pan">PAN</Label>
                  <Input id="pan" placeholder="AAAAA0000A" value={form.pan}
                    onChange={e => setForm(f => ({ ...f, pan: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={form.state}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="email">Business Email</Label>
                  <Input id="email" type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button className="flex-1" disabled={createCompany.isPending}
                  onClick={() => createCompany.mutate(form)}>
                  {createCompany.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Company & Start Trial
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                30-day free trial. No credit card required. Cancel anytime.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
