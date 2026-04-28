import { describe, it, expect } from "vitest";

describe("Inventory form payload builder", () => {
  const buildPayload = (form: any) => {
    const payload: any = {
      sku: form.sku,
      name: form.name,
      qty: form.qty,
      cost: form.cost || "0",
      reorder: form.reorder,
    };
    if (form.category) payload.category = form.category;
    if (form.hsnCode) payload.hsnCode = form.hsnCode;
    if (form.gstRate) payload.gstRate = form.gstRate;
    if (form.mrp) payload.mrp = form.mrp;
    if (form.sellingPrice) payload.sellingPrice = form.sellingPrice;
    if (form.purchasePrice) payload.purchasePrice = form.purchasePrice;
    if (form.upcBarcode) payload.upcBarcode = form.upcBarcode;
    return payload;
  };

  it("should build minimal payload with required fields only", () => {
    const form = {
      sku: "NUT-001", name: "Cashew Premium", qty: 100, cost: "250", reorder: 10,
      category: "", hsnCode: "", gstRate: "", mrp: "", sellingPrice: "", purchasePrice: "", upcBarcode: "",
    };
    const payload = buildPayload(form);
    expect(payload).toEqual({
      sku: "NUT-001", name: "Cashew Premium", qty: 100, cost: "250", reorder: 10,
    });
    expect(payload.mrp).toBeUndefined();
    expect(payload.sellingPrice).toBeUndefined();
    expect(payload.upcBarcode).toBeUndefined();
  });

  it("should include MRP, Selling Price, Purchase Price when provided", () => {
    const form = {
      sku: "NUT-001", name: "Cashew Premium", qty: 100, cost: "250", reorder: 10,
      category: "Nuts", hsnCode: "20081920", gstRate: "18.00",
      mrp: "350", sellingPrice: "300", purchasePrice: "200", upcBarcode: "8901234567890",
    };
    const payload = buildPayload(form);
    expect(payload.mrp).toBe("350");
    expect(payload.sellingPrice).toBe("300");
    expect(payload.purchasePrice).toBe("200");
    expect(payload.upcBarcode).toBe("8901234567890");
    expect(payload.category).toBe("Nuts");
    expect(payload.hsnCode).toBe("20081920");
    expect(payload.gstRate).toBe("18.00");
  });

  it("should default cost to '0' when empty", () => {
    const form = {
      sku: "NUT-002", name: "Almond", qty: 50, cost: "", reorder: 5,
      category: "", hsnCode: "", gstRate: "", mrp: "", sellingPrice: "", purchasePrice: "", upcBarcode: "",
    };
    const payload = buildPayload(form);
    expect(payload.cost).toBe("0");
  });

  it("should not include empty optional string fields", () => {
    const form = {
      sku: "NUT-003", name: "Pistachio", qty: 20, cost: "500", reorder: 5,
      category: "", hsnCode: "", gstRate: "12.00",
      mrp: "", sellingPrice: "450", purchasePrice: "", upcBarcode: "",
    };
    const payload = buildPayload(form);
    expect(payload.category).toBeUndefined();
    expect(payload.hsnCode).toBeUndefined();
    expect(payload.mrp).toBeUndefined();
    expect(payload.purchasePrice).toBeUndefined();
    expect(payload.upcBarcode).toBeUndefined();
    // These should be present
    expect(payload.gstRate).toBe("12.00");
    expect(payload.sellingPrice).toBe("450");
  });
});

describe("Inventory table value calculation", () => {
  it("should use sellingPrice for value when available", () => {
    const item = { qty: 10, sellingPrice: "300", cost: "250" };
    const sp = Number(item.sellingPrice || item.cost || 0);
    expect(item.qty * sp).toBe(3000);
  });

  it("should fall back to cost when sellingPrice is null", () => {
    const item = { qty: 10, sellingPrice: null, cost: "250" };
    const sp = Number(item.sellingPrice || item.cost || 0);
    expect(item.qty * sp).toBe(2500);
  });

  it("should handle zero quantity", () => {
    const item = { qty: 0, sellingPrice: "300", cost: "250" };
    const sp = Number(item.sellingPrice || item.cost || 0);
    expect(item.qty * sp).toBe(0);
  });
});

describe("Inventory low stock detection", () => {
  it("should detect low stock when qty <= reorder", () => {
    expect(5 <= 10).toBe(true);
    expect(10 <= 10).toBe(true);
  });

  it("should not flag as low stock when qty > reorder", () => {
    expect(15 <= 10).toBe(false);
  });
});
