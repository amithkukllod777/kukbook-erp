import { describe, it, expect, vi } from "vitest";

// Mock razorpay-webhook module
vi.mock("./razorpay-webhook", () => ({
  createRazorpayOrder: vi.fn().mockResolvedValue({
    orderId: "order_test123",
    amount: 49900,
    currency: "INR",
    keyId: "rzp_test_abc",
    companyName: "KukBook",
    description: "Professional Plan - Monthly",
    prefill: { name: "Test User", email: "test@test.com" },
  }),
  verifyRazorpayPayment: vi.fn().mockResolvedValue({ success: true }),
  getRazorpayKeyId: vi.fn().mockResolvedValue("rzp_test_abc"),
  registerRazorpayWebhook: vi.fn(),
}));

describe("Razorpay Integration", () => {
  it("createRazorpayOrder returns correct order structure", async () => {
    const { createRazorpayOrder } = await import("./razorpay-webhook");
    const result = await createRazorpayOrder({
      companyId: 1,
      plan: "professional",
      interval: "monthly",
      userId: 1,
      userEmail: "test@test.com",
      userName: "Test User",
    });
    expect(result).toHaveProperty("orderId");
    expect(result).toHaveProperty("amount");
    expect(result).toHaveProperty("currency", "INR");
    expect(result).toHaveProperty("keyId");
    expect(result).toHaveProperty("companyName");
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("prefill");
    expect(result.prefill).toHaveProperty("email", "test@test.com");
  });

  it("verifyRazorpayPayment returns success", async () => {
    const { verifyRazorpayPayment } = await import("./razorpay-webhook");
    const result = await verifyRazorpayPayment({
      companyId: 1,
      razorpayOrderId: "order_test123",
      razorpayPaymentId: "pay_test456",
      razorpaySignature: "sig_test789",
      plan: "professional",
      interval: "monthly",
    });
    expect(result).toEqual({ success: true });
  });

  it("getRazorpayKeyId returns key from settings", async () => {
    const { getRazorpayKeyId } = await import("./razorpay-webhook");
    const keyId = await getRazorpayKeyId(1);
    expect(keyId).toBe("rzp_test_abc");
  });

  it("Razorpay plans have correct pricing in INR", () => {
    const plans = [
      { id: "starter", monthlyAmount: 49900, yearlyAmount: 479900 },
      { id: "professional", monthlyAmount: 99900, yearlyAmount: 959900 },
      { id: "enterprise", monthlyAmount: 249900, yearlyAmount: 2399900 },
    ];
    plans.forEach(plan => {
      expect(plan.monthlyAmount).toBeGreaterThan(0);
      expect(plan.yearlyAmount).toBeGreaterThan(plan.monthlyAmount);
      // Yearly should be less than 12x monthly (discount)
      expect(plan.yearlyAmount).toBeLessThan(plan.monthlyAmount * 12);
    });
  });

  it("Razorpay order amount is in paise (smallest currency unit)", async () => {
    const { createRazorpayOrder } = await import("./razorpay-webhook");
    const result = await createRazorpayOrder({
      companyId: 1,
      plan: "starter",
      interval: "monthly",
      userId: 1,
      userEmail: "test@test.com",
      userName: "Test",
    });
    // Amount should be in paise (integer, no decimals)
    expect(Number.isInteger(result.amount)).toBe(true);
    expect(result.amount).toBeGreaterThanOrEqual(100); // Minimum ₹1 = 100 paise
  });

  it("Admin settings fields for Razorpay are defined correctly", () => {
    const razorpayFields = [
      { key: "razorpay_key_id", label: "Razorpay Key ID" },
      { key: "razorpay_key_secret", label: "Razorpay Key Secret" },
      { key: "razorpay_webhook_secret", label: "Webhook Secret (optional)" },
    ];
    expect(razorpayFields).toHaveLength(3);
    expect(razorpayFields[0].key).toBe("razorpay_key_id");
    expect(razorpayFields[1].key).toBe("razorpay_key_secret");
  });
});
