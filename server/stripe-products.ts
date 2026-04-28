// KukBook ERP Subscription Plans
// Prices are in INR (paise) — Stripe uses smallest currency unit

export const PLANS = {
  starter: {
    name: "Starter",
    description: "Perfect for freelancers and small businesses",
    monthlyPrice: 49900, // ₹499/month
    yearlyPrice: 479900, // ₹4,799/year (save 20%)
    features: [
      "1 User",
      "1 Company",
      "Basic Invoicing & Billing",
      "Inventory Management",
      "GST Reports (GSTR-1, GSTR-3B)",
      "5 Invoice Themes",
      "Email Support",
    ],
  },
  professional: {
    name: "Professional",
    description: "For growing businesses with advanced needs",
    monthlyPrice: 99900, // ₹999/month
    yearlyPrice: 959900, // ₹9,599/year (save 20%)
    features: [
      "5 Users",
      "3 Companies",
      "All Starter Features",
      "Payroll Management",
      "Warehouse Management",
      "Supply Chain Tracking",
      "Barcode Generation",
      "PDF/Excel Export",
      "WhatsApp/SMS Integration",
      "Priority Support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    description: "For large businesses with full ERP needs",
    monthlyPrice: 249900, // ₹2,499/month
    yearlyPrice: 2399900, // ₹23,999/year (save 20%)
    features: [
      "Unlimited Users",
      "Unlimited Companies",
      "All Professional Features",
      "E-Way Bill Management",
      "Delivery Management",
      "Multi-Firm Support",
      "Custom Invoice Themes",
      "API Access",
      "Dedicated Support",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
export type BillingInterval = "monthly" | "yearly";
