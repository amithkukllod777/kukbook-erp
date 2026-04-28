import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import {
  BookOpen, BarChart3, Receipt, Package, Users, Shield, Truck, DollarSign,
  FileText, Building2, Warehouse, ClipboardList, ArrowRight, Check,
  Star, Globe, Zap, Lock, ChevronDown, ChevronUp
} from "lucide-react";
import { useState } from "react";

const features = [
  { icon: BarChart3, title: "Smart Dashboard", desc: "Real-time KPIs, revenue charts, expense breakdown, and low-stock alerts at a glance." },
  { icon: BookOpen, title: "Double-Entry Accounting", desc: "Chart of Accounts, Journal Entries with debit/credit validation, Trial Balance." },
  { icon: Receipt, title: "Invoicing & Billing", desc: "Create GST-compliant invoices, track payments, manage bills, and send reminders." },
  { icon: Package, title: "Inventory Management", desc: "Stock tracking, low-stock alerts, barcode support, batch & serial numbers." },
  { icon: Users, title: "Customer & Vendor Management", desc: "Full CRM with party statements, grouping, payment tracking, and reports." },
  { icon: DollarSign, title: "Payroll & HR", desc: "Employee records, automated payroll with tax calculations, payroll history." },
  { icon: FileText, title: "Financial Reports", desc: "Profit & Loss, Balance Sheet, Cashflow, Day Book, and 20+ report types." },
  { icon: Building2, title: "GST Compliance", desc: "GSTR-1/3B reports, HSN codes, E-Way Bill, reverse charge, and tax management." },
  { icon: Warehouse, title: "Warehouse & Supply Chain", desc: "Multi-warehouse management, supply chain tracking, delivery management." },
  { icon: ClipboardList, title: "Purchase Orders", desc: "Create POs, track status, convert to bills, and manage vendor relationships." },
  { icon: Truck, title: "Delivery Management", desc: "Delivery staff, route assignment, real-time delivery status tracking." },
  { icon: Shield, title: "Role-Based Access", desc: "Admin and Staff roles, secure data isolation, user management panel." },
];

const plans = [
  {
    name: "Starter",
    price: "499",
    period: "/month",
    desc: "Perfect for freelancers and small businesses",
    features: ["1 Company", "2 Users", "Unlimited Transactions", "Invoicing & Billing", "Inventory Management", "Basic Reports", "Email Support"],
    popular: false,
  },
  {
    name: "Professional",
    price: "999",
    period: "/month",
    desc: "Best for growing businesses",
    features: ["1 Company", "5 Users", "All Starter Features", "GST Compliance & Reports", "Payroll & HR", "Warehouse Management", "Priority Support", "PDF/Excel Export"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "2,499",
    period: "/month",
    desc: "For large teams and multi-firm operations",
    features: ["Multi-Firm Support", "Unlimited Users", "All Professional Features", "Supply Chain Module", "Delivery Management", "API Access", "Dedicated Support", "Custom Invoice Themes"],
    popular: false,
  },
];

const testimonials = [
  { name: "Rajesh Sharma", role: "Owner, Sharma Electronics", text: "KukBook transformed how we manage our inventory and billing. The GST reports save us hours every month.", rating: 5 },
  { name: "Priya Patel", role: "CA, Patel & Associates", text: "The double-entry accounting and financial reports are exactly what my clients need. Highly recommended!", rating: 5 },
  { name: "Mohammed Ali", role: "Manager, Ali Traders", text: "We switched from Tally to KukBook. The interface is so much cleaner and the mobile access is a game-changer.", rating: 5 },
];

const faqs = [
  { q: "Is there a free trial?", a: "Yes! Every new signup gets a 30-day free trial with full access to all features. No credit card required." },
  { q: "Can I manage multiple companies?", a: "Yes, with our Enterprise plan you can manage multiple firms from a single account with shared or separate data." },
  { q: "Is my data secure?", a: "Absolutely. Each company gets isolated data storage with enterprise-grade encryption. Your data is never shared across tenants." },
  { q: "Do you support GST filing?", a: "Yes, KukBook generates GSTR-1, GSTR-3B reports and supports HSN codes, E-Way Bills, and reverse charge mechanisms." },
  { q: "Can I export my data?", a: "Yes, all reports, invoices, bills, and payroll data can be exported as PDF or Excel files." },
  { q: "What happens after the trial ends?", a: "After 30 days, you'll need to choose a subscription plan to continue. Your data is preserved for 30 additional days." },
];

const steps = [
  { num: "1", title: "Sign Up", desc: "Create your account and company in under 2 minutes. No credit card needed." },
  { num: "2", title: "Set Up Your Business", desc: "Add your company details, chart of accounts, inventory items, and team members." },
  { num: "3", title: "Start Managing", desc: "Create invoices, track expenses, run payroll, and grow your business with real-time insights." },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">KukBook</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { window.location.href = getLoginUrl(); }}>
              Sign In
            </Button>
            <Button size="sm" onClick={() => { window.location.href = getLoginUrl(); }}>
              Start Free Trial
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              <span>30 Days Free Trial — No Credit Card Required</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              The Complete{" "}
              <span className="text-primary">ERP Solution</span>{" "}
              for Your Business
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Manage accounting, invoicing, inventory, payroll, GST compliance, and more — all in one powerful platform built for Indian businesses.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-base px-8 h-12 shadow-lg hover:shadow-xl transition-all" onClick={() => { window.location.href = getLoginUrl(); }}>
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-base px-8 h-12" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
                Explore Features
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-600" /> Free 30-day trial</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-600" /> No setup fees</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-600" /> Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="bg-primary text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div><div className="text-3xl font-bold">12+</div><div className="text-sm text-white/80 mt-1">ERP Modules</div></div>
          <div><div className="text-3xl font-bold">40+</div><div className="text-sm text-white/80 mt-1">Report Types</div></div>
          <div><div className="text-3xl font-bold">100%</div><div className="text-sm text-white/80 mt-1">GST Compliant</div></div>
          <div><div className="text-3xl font-bold">24/7</div><div className="text-sm text-white/80 mt-1">Cloud Access</div></div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything You Need to Run Your Business</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              From invoicing to inventory, payroll to GST — KukBook covers every aspect of your business operations.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
                <CardContent className="p-6">
                  <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Get Started in 3 Simple Steps</h2>
            <p className="mt-4 text-lg text-muted-foreground">Up and running in minutes, not days.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                  {s.num}
                </div>
                <h3 className="font-semibold text-xl mb-3">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground">Start free, upgrade when you're ready. No hidden charges.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <Card key={i} className={`relative border-0 shadow-sm ${plan.popular ? "ring-2 ring-primary shadow-lg scale-105" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold">₹{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <Button
                    className="w-full mb-6"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => { window.location.href = getLoginUrl(); }}
                  >
                    Start Free Trial
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Trusted by Businesses Across India</h2>
            <p className="mt-4 text-lg text-muted-foreground">See what our customers have to say.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed italic">"{t.text}"</p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Industries ─── */}
      <section className="py-16 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Built for Every Industry</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {["Retail", "Wholesale", "Manufacturing", "Services", "E-Commerce", "Trading", "Healthcare", "Education", "Construction", "Hospitality"].map((ind) => (
              <span key={ind} className="px-5 py-2.5 rounded-full bg-white border text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors">
                {ind}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-gray-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-lg text-white/80 mb-8">Join thousands of businesses managing their operations with KukBook ERP.</p>
          <Button
            size="lg"
            variant="secondary"
            className="text-base px-8 h-12 bg-white text-primary hover:bg-white/90"
            onClick={() => { window.location.href = getLoginUrl(); }}
          >
            Start Your Free 30-Day Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-bold text-lg">KukBook</span>
              </div>
              <p className="text-sm leading-relaxed">
                The complete ERP solution for Indian businesses. Manage accounting, inventory, payroll, and more.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Updates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tutorials</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">&copy; {new Date().getFullYear()} KukBook ERP. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Secure & Encrypted</span>
              <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Cloud-Based</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
