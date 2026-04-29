import { describe, it, expect, vi } from "vitest";

// Test i18n configuration
describe("Multi-Language (i18n) Support", () => {
  it("should have i18n config file with English and Hindi translations", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const i18nPath = path.resolve(__dirname, "../client/src/lib/i18n.ts");
    expect(fs.existsSync(i18nPath)).toBe(true);
    const content = fs.readFileSync(i18nPath, "utf-8");
    expect(content).toContain("en");
    expect(content).toContain("hi");
    expect(content).toContain("i18next");
  });

  it("should have LanguageSwitcher component", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const switcherPath = path.resolve(__dirname, "../client/src/components/LanguageSwitcher.tsx");
    expect(fs.existsSync(switcherPath)).toBe(true);
    const content = fs.readFileSync(switcherPath, "utf-8");
    expect(content).toContain("useTranslation");
    expect(content).toContain("changeLanguage");
  });
});

// Test PWA configuration
describe("PWA / Offline Mode", () => {
  it("should have manifest.json in public folder", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const manifestPath = path.resolve(__dirname, "../client/public/manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    expect(content.name).toBe("KukBook \u2014 Accounting ERP");
    expect(content.short_name).toBe("KukBook");
    expect(content.display).toBe("standalone");
  });

  it("should have service worker file", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const swPath = path.resolve(__dirname, "../client/public/sw.js");
    expect(fs.existsSync(swPath)).toBe(true);
    const content = fs.readFileSync(swPath, "utf-8");
    expect(content).toContain("install");
    expect(content).toContain("fetch");
    expect(content).toContain("cache");
  });

  it("should register service worker in index.html", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const htmlPath = path.resolve(__dirname, "../client/index.html");
    const content = fs.readFileSync(htmlPath, "utf-8");
    expect(content).toContain("serviceWorker");
    expect(content).toContain("manifest.json");
  });
});

// Test SSE (Real-Time Updates)
describe("Real-Time Updates (SSE)", () => {
  it("should have SSE server module", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const ssePath = path.resolve(__dirname, "./sse.ts");
    expect(fs.existsSync(ssePath)).toBe(true);
    const content = fs.readFileSync(ssePath, "utf-8");
    expect(content).toContain("text/event-stream");
    expect(content).toContain("registerSSE");
  });

  it("should have useSSE hook for frontend", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const hookPath = path.resolve(__dirname, "../client/src/hooks/useSSE.ts");
    expect(fs.existsSync(hookPath)).toBe(true);
    const content = fs.readFileSync(hookPath, "utf-8");
    expect(content).toContain("EventSource");
    expect(content).toContain("useSSE");
  });
});

// Test Invoice Payment (Razorpay)
describe("Invoice Payment (Customer-facing)", () => {
  it("should have invoice-payment server module", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const payPath = path.resolve(__dirname, "./invoice-payment.ts");
    expect(fs.existsSync(payPath)).toBe(true);
    const content = fs.readFileSync(payPath, "utf-8");
    expect(content).toContain("registerInvoicePayment");
    expect(content).toContain("generateInvoicePaymentToken");
    expect(content).toContain("/api/invoice-pay");
    expect(content).toContain("razorpay");
  });

  it("should have InvoicePayment frontend page", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const pagePath = path.resolve(__dirname, "../client/src/pages/InvoicePayment.tsx");
    expect(fs.existsSync(pagePath)).toBe(true);
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("Razorpay");
    expect(content).toContain("Pay");
    expect(content).toContain("/api/invoice-pay");
  });

  it("should have /pay/:token route in App.tsx", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const appPath = path.resolve(__dirname, "../client/src/App.tsx");
    const content = fs.readFileSync(appPath, "utf-8");
    expect(content).toContain("/pay/:token");
    expect(content).toContain("InvoicePayment");
  });

  it("should have generatePaymentLink in routers.ts", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routersPath = path.resolve(__dirname, "./routers.ts");
    const content = fs.readFileSync(routersPath, "utf-8");
    expect(content).toContain("generatePaymentLink");
    expect(content).toContain("generateInvoicePaymentToken");
  });

  it("should have Share Payment Link button in Invoices.tsx", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const invPath = path.resolve(__dirname, "../client/src/pages/Invoices.tsx");
    const content = fs.readFileSync(invPath, "utf-8");
    expect(content).toContain("Share Payment Link");
    expect(content).toContain("genPayLinkMut");
    expect(content).toContain("Share2");
  });
});
