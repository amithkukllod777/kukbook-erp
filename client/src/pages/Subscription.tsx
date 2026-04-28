import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Check, Crown, Zap, Building2, ArrowRight, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const plans = [
  {
    id: "starter", name: "Starter", monthlyPrice: "₹499", yearlyPrice: "₹4,799", description: "For small businesses getting started",
    features: ["1 User", "1 Company", "Basic Invoicing & Billing", "Inventory Management", "GST Reports (GSTR-1, GSTR-3B)", "5 Invoice Themes", "Email Support"],
    icon: <Zap className="h-6 w-6 text-blue-600" />,
  },
  {
    id: "professional", name: "Professional", monthlyPrice: "₹999", yearlyPrice: "₹9,599", description: "For growing businesses",
    features: ["5 Users", "3 Companies", "All Starter Features", "Payroll Management", "Warehouse Management", "Supply Chain Tracking", "Barcode Generation", "PDF/Excel Export", "WhatsApp/SMS Integration", "Priority Support"],
    icon: <Crown className="h-6 w-6 text-indigo-600" />,
    popular: true,
  },
  {
    id: "enterprise", name: "Enterprise", monthlyPrice: "₹2,499", yearlyPrice: "₹23,999", description: "For large organizations",
    features: ["Unlimited Users", "Unlimited Companies", "All Professional Features", "E-Way Bill Management", "Delivery Management", "Multi-Firm Support", "Custom Invoice Themes", "API Access", "Dedicated Support"],
    icon: <Building2 className="h-6 w-6 text-purple-600" />,
  },
];

export default function Subscription() {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { data: userCompanies = [] } = trpc.company.list.useQuery();
  const firstCompany = userCompanies[0];
  const { data: trialData } = trpc.subscription.trialStatus.useQuery(
    { companyId: firstCompany?.id ?? 0 },
    { enabled: !!firstCompany }
  );
  const { data: subData } = trpc.subscription.get.useQuery(
    { companyId: firstCompany?.id ?? 0 },
    { enabled: !!firstCompany }
  );

  const checkout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirecting to Stripe checkout...");
        window.open(data.url, "_blank");
      }
    },
    onError: (err) => {
      toast.error(`Checkout failed: ${err.message}`);
      setLoadingPlan(null);
    },
  });

  const currentPlan = trialData?.plan || "professional";
  const trialDaysLeft = trialData?.daysLeft ?? 30;
  const trialTotal = 30;
  const status = trialData?.status || "trial";

  const handleChoosePlan = (planId: string) => {
    if (!firstCompany) {
      toast.error("Please create a company first");
      return;
    }
    setLoadingPlan(planId);
    checkout.mutate({
      companyId: firstCompany.id,
      plan: planId,
      interval,
      origin: window.location.origin,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><CreditCard className="h-6 w-6" />Subscription</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your subscription plan and billing</p>
      </div>

      {/* Current Plan Status */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={status === "trial" ? "bg-emerald-100 text-emerald-700" : status === "active" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}>
                  {status === "trial" ? "Free Trial" : status === "active" ? "Active" : status === "expired" ? "Expired" : "Cancelled"}
                </Badge>
                <span className="font-semibold text-lg capitalize">{currentPlan} Plan</span>
              </div>
              {status === "trial" && (
                <>
                  <p className="text-sm text-muted-foreground">Your free trial is active. {trialDaysLeft} days remaining.</p>
                  <div className="flex items-center gap-3 w-[300px]">
                    <Progress value={((trialTotal - trialDaysLeft) / trialTotal) * 100} className="h-2" />
                    <span className="text-sm font-medium">{trialDaysLeft}/{trialTotal} days</span>
                  </div>
                </>
              )}
              {status === "active" && <p className="text-sm text-muted-foreground">Your subscription is active.</p>}
              {status === "expired" && <p className="text-sm text-red-600">Your subscription has expired. Please renew to continue.</p>}
              {!firstCompany && <p className="text-sm text-muted-foreground">Create a company first to start your free trial.</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Interval Toggle */}
      <div className="flex items-center justify-center gap-3">
        <Button variant={interval === "monthly" ? "default" : "outline"} size="sm" onClick={() => setInterval("monthly")}>Monthly</Button>
        <Button variant={interval === "yearly" ? "default" : "outline"} size="sm" onClick={() => setInterval("yearly")}>
          Yearly <Badge className="ml-2 bg-emerald-100 text-emerald-700 text-xs">Save 20%</Badge>
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <Card key={plan.id} className={`relative transition-all hover:shadow-lg ${plan.popular ? "ring-2 ring-indigo-500 shadow-md" : ""}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-indigo-600 text-white px-4">Most Popular</Badge>
              </div>
            )}
            <CardHeader className="text-center pb-2 pt-6">
              <div className="mx-auto mb-2">{plan.icon}</div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <div className="pt-2">
                <span className="text-3xl font-bold">{interval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}</span>
                <span className="text-muted-foreground">/{interval === "monthly" ? "month" : "year"}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant={currentPlan === plan.id && status === "active" ? "default" : "outline"}
                disabled={loadingPlan === plan.id || (currentPlan === plan.id && status === "active")}
                onClick={() => handleChoosePlan(plan.id)}>
                {loadingPlan === plan.id ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                ) : currentPlan === plan.id && status === "active" ? (
                  "Current Plan"
                ) : (
                  <>Choose {plan.name}<ArrowRight className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Card Info */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <p className="text-sm text-amber-800 font-medium">Testing Mode</p>
          <p className="text-sm text-amber-700 mt-1">Use test card number <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">4242 4242 4242 4242</code> with any future expiry date and CVC to test payments.</p>
        </CardContent>
      </Card>

      {/* Billing Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Billing Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="font-medium capitalize">{currentPlan} ({status})</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span>{firstCompany?.name || "No company created"}</span></div>
              {subData && <div className="flex justify-between"><span className="text-muted-foreground">Trial Started</span><span>{new Date(subData.trialStartDate).toLocaleDateString()}</span></div>}
              {subData && <div className="flex justify-between"><span className="text-muted-foreground">Trial Ends</span><span>{new Date(subData.trialEndDate).toLocaleDateString()}</span></div>}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Payment Method</span><span>{subData?.paymentGateway || "Not added"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span>{subData?.amount ? `₹${subData.amount}` : "Free trial"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Auto Renew</span><span>{subData?.autoRenew ? "Yes" : "No"}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
