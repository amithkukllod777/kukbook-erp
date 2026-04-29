import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Check, Crown, Zap, Building2, ArrowRight, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";

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

// Load Razorpay script dynamically
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Subscription() {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { activeCompany } = useCompany();

  const { data: trialData } = trpc.subscription.trialStatus.useQuery(
    { companyId: activeCompany?.id ?? 0 },
    { enabled: !!activeCompany }
  );
  const { data: subData } = trpc.subscription.get.useQuery(
    { companyId: activeCompany?.id ?? 0 },
    { enabled: !!activeCompany }
  );
  const { data: razorpayKey } = trpc.subscription.razorpayKeyId.useQuery(
    { companyId: activeCompany?.id ?? 0 },
    { enabled: !!activeCompany }
  );

  const razorpayOrder = trpc.subscription.razorpayCreateOrder.useMutation({
    onError: (err) => {
      toast.error(`Payment failed: ${err.message}`);
      setLoadingPlan(null);
    },
  });

  const razorpayVerify = trpc.subscription.razorpayVerify.useMutation({
    onSuccess: () => {
      toast.success("Payment successful! Subscription activated.");
      setLoadingPlan(null);
      // Refresh subscription data
      window.location.reload();
    },
    onError: (err) => {
      toast.error(`Verification failed: ${err.message}`);
      setLoadingPlan(null);
    },
  });

  const stripeCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirecting to Stripe checkout...");
        window.open(data.url, "_blank");
      }
      setLoadingPlan(null);
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

  const isRazorpayAvailable = !!razorpayKey?.keyId;

  const handleRazorpayPayment = async (planId: string) => {
    if (!activeCompany) { toast.error("Please create a company first"); return; }
    setLoadingPlan(planId);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { toast.error("Failed to load Razorpay. Please try again."); setLoadingPlan(null); return; }

      const orderData = await razorpayOrder.mutateAsync({
        companyId: activeCompany.id,
        plan: planId,
        interval,
      });

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: orderData.companyName,
        description: orderData.description,
        order_id: orderData.orderId,
        prefill: orderData.prefill,
        theme: { color: "#2563eb" },
        handler: function (response: any) {
          // Verify payment on server
          razorpayVerify.mutate({
            companyId: activeCompany.id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            plan: planId,
            interval,
          });
        },
        modal: {
          ondismiss: function () {
            setLoadingPlan(null);
            toast.info("Payment cancelled");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
      setLoadingPlan(null);
    }
  };

  const handleStripePayment = (planId: string) => {
    if (!activeCompany) { toast.error("Please create a company first"); return; }
    setLoadingPlan(planId);
    stripeCheckout.mutate({
      companyId: activeCompany.id,
      plan: planId,
      interval,
      origin: window.location.origin,
    });
  };

  const handleChoosePlan = (planId: string) => {
    if (isRazorpayAvailable) {
      handleRazorpayPayment(planId);
    } else {
      handleStripePayment(planId);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscription Plans</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose the right plan for your business</p>
      </div>

      {/* Trial Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="font-medium">
                  {status === "active" ? (
                    <><Badge className="bg-emerald-100 text-emerald-700 mr-2">Active</Badge> {currentPlan} Plan</>
                  ) : status === "trial" ? (
                    <><Badge className="bg-amber-100 text-amber-700 mr-2">Trial</Badge> {trialDaysLeft} days remaining</>
                  ) : (
                    <Badge variant="destructive">Expired</Badge>
                  )}
                </p>
                {status === "trial" && <Progress value={((trialTotal - trialDaysLeft) / trialTotal) * 100} className="h-1.5 mt-2 w-48" />}
              </div>
            </div>
            {!activeCompany && <p className="text-sm text-muted-foreground">Create a company first to start your free trial.</p>}
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

      {/* Payment Method Indicator */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-muted-foreground">Payment via:</span>
        {isRazorpayAvailable ? (
          <Badge variant="outline" className="border-blue-500 text-blue-700">Razorpay (UPI, Cards, NetBanking)</Badge>
        ) : (
          <Badge variant="outline" className="border-purple-500 text-purple-700">Stripe (Cards)</Badge>
        )}
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
                  <>{isRazorpayAvailable ? "Pay with Razorpay" : "Choose"} {plan.name}<ArrowRight className="h-4 w-4 ml-2" /></>
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
          {isRazorpayAvailable ? (
            <div className="text-sm text-amber-700 mt-1 space-y-1">
              <p>Use these test credentials for Razorpay:</p>
              <p>• UPI: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">success@razorpay</code></p>
              <p>• Card: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">4111 1111 1111 1111</code> (any future expiry, any CVV)</p>
              <p>• NetBanking: Select any bank → click "Success"</p>
            </div>
          ) : (
            <p className="text-sm text-amber-700 mt-1">Use test card number <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">4242 4242 4242 4242</code> with any future expiry date and CVC to test payments.</p>
          )}
        </CardContent>
      </Card>

      {/* Billing Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Billing Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="font-medium capitalize">{currentPlan} ({status})</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span>{activeCompany?.name || "No company created"}</span></div>
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
