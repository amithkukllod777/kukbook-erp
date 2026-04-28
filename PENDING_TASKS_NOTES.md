# Pending Tasks Implementation Notes

## 4 Pending Items:
1. TDS on vendor payments (Section 194C/194J) — bills table needs tdsSection, tdsRate, tdsAmount fields
2. TCS on sales — invoices table needs tcsApplicable, tcsRate, tcsAmount fields
3. Email/phone verification — use built-in notifyOwner for owner alerts; for user verification, implement OTP stored in DB (input-otp.tsx component exists)
4. Multi-user invite flow — need companyInvites table with token, email, role, status

## Architecture:
- Schema: /home/ubuntu/kukbook-erp/drizzle/schema.ts
- DB helpers: /home/ubuntu/kukbook-erp/server/db.ts (1371 lines)
- Routers: /home/ubuntu/kukbook-erp/server/routers.ts (447 lines)
- Bills page: /home/ubuntu/kukbook-erp/client/src/pages/Bills.tsx (202 lines)
- Invoices page: /home/ubuntu/kukbook-erp/client/src/pages/Invoices.tsx (250 lines)
- CompanyProfile: shows team members, says "Invite members from Admin Settings"
- input-otp.tsx: shadcn OTP input component already available
- No email service available — use in-app verification codes stored in DB

## TDS Sections for vendor payments:
- 194C: Contractors (1%/2%)
- 194J: Professional/Technical fees (2%/10%)
- 194H: Commission/Brokerage (5%)
- 194I: Rent (2%/10%)
- 194Q: Purchase of goods >50L (0.1%)
- 194A: Interest other than securities (10%)

## TCS Sections for sales:
- 206C(1H): Sale of goods >50L (0.1%)
- 206C(1): Scrap (1%)
- 206C(1F): Motor vehicle >10L (1%)
- 206C(1G): Foreign remittance/tour package (5%/20%)

## Key: bills table has columns: billId, vendorId, vendorName, date, dueDate, subtotal, cgst, sgst, igst, amount, description, status, companyId
## Key: invoices table has columns: invoiceId, customerId, customerName, date, dueDate, status, subtotal, cgst, sgst, igst, total, companyId
