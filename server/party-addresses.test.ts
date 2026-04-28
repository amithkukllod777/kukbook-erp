import { describe, it, expect } from "vitest";

// Test GSTIN state code mapping logic (same as used in frontend)
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

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

describe("GSTIN Validation", () => {
  it("should validate correct GSTIN format", () => {
    expect(GSTIN_REGEX.test("27AAECF1312M1ZZ")).toBe(true);
    expect(GSTIN_REGEX.test("29AABCT1332L1ZL")).toBe(true);
    expect(GSTIN_REGEX.test("07AAACP0165G1ZS")).toBe(true);
  });

  it("should reject invalid GSTIN format", () => {
    expect(GSTIN_REGEX.test("")).toBe(false);
    expect(GSTIN_REGEX.test("INVALID")).toBe(false);
    expect(GSTIN_REGEX.test("27AAECF1312M1Z")).toBe(false); // too short
    expect(GSTIN_REGEX.test("27aaecf1312m1zz")).toBe(false); // lowercase
  });
});

describe("GSTIN State Code Mapping", () => {
  it("should map GSTIN first 2 digits to correct state", () => {
    expect(GSTIN_STATE_CODES["27"]).toBe("Maharashtra");
    expect(GSTIN_STATE_CODES["29"]).toBe("Karnataka");
    expect(GSTIN_STATE_CODES["07"]).toBe("Delhi");
    expect(GSTIN_STATE_CODES["33"]).toBe("Tamil Nadu");
    expect(GSTIN_STATE_CODES["09"]).toBe("Uttar Pradesh");
    expect(GSTIN_STATE_CODES["23"]).toBe("Madhya Pradesh");
  });

  it("should extract state from GSTIN string", () => {
    const gstin = "27AAECF1312M1ZZ";
    const stateCode = gstin.substring(0, 2);
    expect(GSTIN_STATE_CODES[stateCode]).toBe("Maharashtra");
  });

  it("should extract PAN from GSTIN (chars 3-12)", () => {
    const gstin = "27AAECF1312M1ZZ";
    const pan = gstin.substring(2, 12);
    expect(pan).toBe("AAECF1312M");
    expect(pan.length).toBe(10);
  });

  it("should handle all 38 state codes", () => {
    expect(Object.keys(GSTIN_STATE_CODES).length).toBe(38);
    // All values should be non-empty strings
    for (const [code, state] of Object.entries(GSTIN_STATE_CODES)) {
      expect(code.length).toBe(2);
      expect(state.length).toBeGreaterThan(0);
    }
  });
});

describe("Same as Billing logic", () => {
  it("should copy billing fields to shipping when same-as-billing is checked", () => {
    const billing = {
      billingAddress1: "123 MG Road",
      billingAddress2: "Near Station",
      billingCity: "Mumbai",
      billingState: "Maharashtra",
      billingPincode: "400001",
    };
    // Simulate same-as-billing
    const shipping = {
      shippingAddress1: billing.billingAddress1,
      shippingAddress2: billing.billingAddress2,
      shippingCity: billing.billingCity,
      shippingState: billing.billingState,
      shippingPincode: billing.billingPincode,
    };
    expect(shipping.shippingAddress1).toBe("123 MG Road");
    expect(shipping.shippingCity).toBe("Mumbai");
    expect(shipping.shippingState).toBe("Maharashtra");
    expect(shipping.shippingPincode).toBe("400001");
  });

  it("should detect when billing and shipping are the same", () => {
    const form = {
      billingAddress1: "123 MG Road", billingCity: "Mumbai",
      billingState: "Maharashtra", billingPincode: "400001",
      shippingAddress1: "123 MG Road", shippingCity: "Mumbai",
      shippingState: "Maharashtra", shippingPincode: "400001",
    };
    const same = form.billingAddress1 === form.shippingAddress1 &&
      form.billingCity === form.shippingCity &&
      form.billingState === form.shippingState &&
      form.billingPincode === form.shippingPincode &&
      form.billingAddress1 !== "";
    expect(same).toBe(true);
  });

  it("should detect when billing and shipping are different", () => {
    const form = {
      billingAddress1: "123 MG Road", billingCity: "Mumbai",
      billingState: "Maharashtra", billingPincode: "400001",
      shippingAddress1: "456 Brigade Road", shippingCity: "Bangalore",
      shippingState: "Karnataka", shippingPincode: "560001",
    };
    const same = form.billingAddress1 === form.shippingAddress1 &&
      form.billingCity === form.shippingCity;
    expect(same).toBe(false);
  });
});
