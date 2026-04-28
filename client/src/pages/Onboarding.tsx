import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertCircle, MapPin, Phone, Mail, FileText } from "lucide-react";
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

const INDUSTRIES = [
  "Manufacturing", "Retail & E-Commerce", "Wholesale & Distribution", "IT & Software",
  "Healthcare & Pharma", "Education", "Construction & Real Estate", "Agriculture",
  "Food & Beverages", "Textile & Garments", "Automobile", "Financial Services",
  "Logistics & Transport", "Hospitality & Tourism", "Professional Services", "Other"
];

// GSTIN format: 22AAAAA0000A1Z5 (15 characters)
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// State code mapping from GSTIN first 2 digits
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

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", slug: "", gstin: "", pan: "",
    address: "", city: "", state: "", phone: "", email: "", industry: "",
  });

  const utils = trpc.useUtils();
  const createCompany = trpc.company.create.useMutation({
    onSuccess: async (data) => {
      toast.success("Company created! Your 30-day free trial has started.");
      // Set the company ID in localStorage so tRPC client sends x-company-id header
      if (data?.company?.id) {
        localStorage.setItem("kukbook_active_company", String(data.company.id));
      }
      const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      localStorage.setItem("kukbook_active_company_slug", slug);
      // Wait for company list to refresh before completing
      await utils.company.list.invalidate();
      // Navigate to the new company's dashboard
      window.location.href = `/app/${slug}/dashboard`;
    },
    onError: (err) => toast.error(err.message),
  });

  // Validation states
  const gstinValid = useMemo(() => {
    if (!form.gstin) return null;
    return GSTIN_REGEX.test(form.gstin.toUpperCase());
  }, [form.gstin]);

  const panValid = useMemo(() => {
    if (!form.pan) return null;
    return PAN_REGEX.test(form.pan.toUpperCase());
  }, [form.pan]);

  const handleSlugify = (name: string) => {
    setForm(f => ({
      ...f, name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }));
  };

  const handleGSTIN = (gstin: string) => {
    const upper = gstin.toUpperCase();
    setForm(f => {
      const updated = { ...f, gstin: upper };
      // Auto-detect state and PAN from GSTIN
      if (upper.length >= 2) {
        const stateCode = upper.substring(0, 2);
        if (GSTIN_STATE_CODES[stateCode]) {
          updated.state = GSTIN_STATE_CODES[stateCode];
        }
      }
      if (upper.length >= 12) {
        updated.pan = upper.substring(2, 12);
      }
      return updated;
    });
  };

  const canProceedStep1 = form.name.trim().length > 0;
  const canSubmit = form.name.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Welcome to KukBook ERP</CardTitle>
          <CardDescription>
            {step === 1 && "Let's set up your company to get started with your 30-day free trial."}
            {step === 2 && "Add your GST & PAN details for compliance."}
            {step === 3 && "Complete your business contact details."}
          </CardDescription>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s < step ? "bg-emerald-500 text-white" : s === step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 ${s < step ? "bg-emerald-500" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-8 mt-2 text-xs text-muted-foreground">
            <span>Company</span><span>GST & PAN</span><span>Contact</span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Step 1: Company Basics */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Company / Business Name *</Label>
                <Input id="name" placeholder="e.g. Acme Pvt Ltd" value={form.name}
                  onChange={e => handleSlugify(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground whitespace-nowrap bg-muted px-2 py-2 rounded-l-md border border-r-0">/app/</span>
                  <Input id="slug" value={form.slug} className="rounded-l-none"
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Your company dashboard: /app/{form.slug || "your-company"}/dashboard</p>
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select value={form.industry} onValueChange={v => setForm(f => ({ ...f, industry: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select your industry" /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => { if (!canProceedStep1) { toast.error("Company name is required"); return; } setStep(2); }}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: GST & PAN */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2">
                <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Enter your GSTIN to auto-fill PAN and State. These fields are optional and can be added later from Settings.</span>
              </div>
              <div>
                <Label htmlFor="gstin">GSTIN (GST Identification Number)</Label>
                <div className="relative mt-1">
                  <Input id="gstin" placeholder="22AAAAA0000A1Z5" value={form.gstin} maxLength={15}
                    onChange={e => handleGSTIN(e.target.value)} className="pr-10 font-mono" />
                  {gstinValid !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {gstinValid ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                    </div>
                  )}
                </div>
                {gstinValid === false && <p className="text-xs text-amber-600 mt-1">GSTIN format: 2 digits (state) + 10 char PAN + 1Z + check digit</p>}
                {gstinValid === true && form.state && <Badge variant="secondary" className="mt-1 text-xs">State detected: {form.state}</Badge>}
              </div>
              <div>
                <Label htmlFor="pan">PAN Number</Label>
                <div className="relative mt-1">
                  <Input id="pan" placeholder="AAAAA0000A" value={form.pan} maxLength={10}
                    onChange={e => setForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))} className="pr-10 font-mono" />
                  {panValid !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {panValid ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                    </div>
                  )}
                </div>
                {panValid === false && <p className="text-xs text-amber-600 mt-1">PAN format: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)</p>}
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </div>
          )}

          {/* Step 3: Contact Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="address" className="flex items-center gap-1"><MapPin className="w-3 h-3" />Business Address</Label>
                <Input id="address" value={form.address} placeholder="e.g. 123, MG Road, Industrial Area"
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={form.city} placeholder="e.g. Mumbai"
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={form.state} disabled className="mt-1 bg-muted" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-1"><Phone className="w-3 h-3" />Phone</Label>
                  <Input id="phone" value={form.phone} placeholder="+91 98765 43210"
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email" className="flex items-center gap-1"><Mail className="w-3 h-3" />Business Email</Label>
                  <Input id="email" type="email" value={form.email} placeholder="accounts@company.com"
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1" />
                </div>
              </div>

              {/* Summary */}
              <Card className="bg-muted/50 border-dashed">
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-medium text-sm">Registration Summary</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-muted-foreground">Company</span><span className="font-medium">{form.name}</span>
                    {form.gstin && <><span className="text-muted-foreground">GSTIN</span><span className="font-mono text-xs">{form.gstin}</span></>}
                    {form.pan && <><span className="text-muted-foreground">PAN</span><span className="font-mono text-xs">{form.pan}</span></>}
                    {form.state && <><span className="text-muted-foreground">State</span><span>{form.state}</span></>}
                    {form.industry && <><span className="text-muted-foreground">Industry</span><span>{form.industry}</span></>}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
                <Button className="flex-1" disabled={createCompany.isPending || !canSubmit}
                  onClick={() => createCompany.mutate(form)}>
                  {createCompany.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Building2 className="w-4 h-4 mr-2" />}
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
