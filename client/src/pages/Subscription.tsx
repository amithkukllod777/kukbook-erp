import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Check, Crown, Zap, Building2, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const plans = [
  {
    id: "starter", name: "Starter", price: "₹499", period: "/month", description: "For small businesses getting started",
    features: ["1 User", "500 Invoices/month", "Basic Reports", "Email Support", "1 Firm", "GST Filing"],
    icon: <Zap className="h-6 w-6 text-blue-600" />,
  },
  {
    id: "professional", name: "Professional", price: "₹999", period: "/month", description: "For growing businesses",
    features: ["5 Users", "Unlimited Invoices", "Advanced Reports", "Priority Support", "3 Firms", "GST + E-Way Bill", "Barcode Generation", "WhatsApp Integration", "Inventory Management"],
    icon: <Crown className="h-6 w-6 text-indigo-600" />,
    popular: true,
  },
  {
    id: "enterprise", name: "Enterprise", price: "₹2,499", period: "/month", description: "For large organizations",
    features: ["Unlimited Users", "Unlimited Invoices", "Custom Reports", "Dedicated Support", "Unlimited Firms", "Full GST Suite", "API Access", "Custom Integrations", "Warehouse Management", "Supply Chain", "Payroll Module", "Multi-Currency"],
    icon: <Building2 className="h-6 w-6 text-purple-600" />,
  },
];

export default function Subscription() {
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

  const currentPlan = trialData?.plan || "professional";
  const trialDaysLeft = trialData?.daysLeft ?? 30;
  const trialTotal = 30;
  const status = trialData?.status || "trial";

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
            <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              onClick={() => toast.info("Payment gateway integration coming soon. Contact sales for enterprise plans.")}>
              <CreditCard className="h-4 w-4 mr-2" />{status === "trial" ? "Upgrade Now" : status === "expired" ? "Renew" : "Manage Plan"}
            </Button>
          </div>
        </CardContent>
      </Card>

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
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
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
              <Button className="w-full" variant={currentPlan === plan.id ? "default" : "outline"}
                onClick={() => toast.info(`${plan.name} plan — Payment gateway integration coming soon`)}>
                {currentPlan === plan.id ? "Current Plan" : "Choose Plan"}
                {currentPlan !== plan.id && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

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
