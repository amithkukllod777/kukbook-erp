# Invoice Layout Reference — FoodOnDoor Format

## Layout Analysis

### Header Section
- **Logo + Company Name** (left side with curved design)
- **Green header bar** with contact info (phone, email, address)
- **Company details**: GSTIN, State
- **"Tax Invoice" title** (right side)

### Invoice Metadata (Right Side)
- Invoice No.: NW26-275
- Date: 23/04/2026
- Place of Supply: Karnataka
- PO date: 22/04/2026
- PO number: TRO1004674
- E-way Bill number: 6221 0031 9125

### Bill To / Ship To (Left Side)
- **Bill To**: Customer name, address, contact, GSTIN, State
- **Ship To**: Separate address block

### Line Items Table (Green Header)
| # | Item name | Product UPC | HSN Code | Batch No. | Exp. Date | Mfg. Date | MRP | Quantity | Unit | Price/Unit | Taxable Price/Unit | GST | Amount |

**Row example:**
- Item 1: Nutriflow Salted Californian Almonds (Pack k, Packet, Pouch) (200 g)
- Product UPC: blank
- HSN Code: 20081910
- Batch No.: SA260421
- Exp. Date: 20/10/2026
- Mfg. Date: 21/04/2026
- MRP: ₹ 479.00
- Quantity: 41
- Unit: Nos
- Price/Unit: ₹ 338.10
- Taxable Price/Unit: ₹ 338.10
- GST: ₹ 693.10 (5%)
- Amount: ₹ 14555.00

**Total Row**: Shows quantity total and amount total

### Tax Summary (Right Side of Table)
- Sub Total: ₹ 13861.90
- IGST@5%: ₹ 693.10
- **Total: ₹ 14555.00** (highlighted in green)

### Pay To (Bank Details)
- Bank Name: IDFC FIRST BANK LTD. SESHORE BRANCH
- Bank Account No.: 10068178583
- Bank IFSC code: IDFB0043161
- Account holder's name: FOODONDOOR PRIVATE LIMITED

### Invoice Amount in Words
- "Fourteen Thousand Five Hundred Fifty Five Rupees only"

### Terms and Conditions
- "Thanks for doing business with us!"

### Signature Section
- "for - FOODONDOOR PRIVATE LIMITED"
- Signature with "Authorized Signatory" label

### Footer
- Curved design (green + dark blue)

---

## Key Features to Implement

1. **Header Design**: Logo + company info + green banner with contact details
2. **Metadata Fields**: Invoice No., Date, PO date, PO number, E-way Bill number, Place of Supply
3. **Bill To / Ship To**: Separate address blocks with GSTIN
4. **Line Items Table**: 
   - Batch No., Exp. Date, Mfg. Date columns
   - MRP column
   - Taxable Price/Unit column
   - GST amount per line
5. **Tax Summary**: Sub Total, GST, Total (highlighted)
6. **Bank Details**: Full bank info section
7. **Amount in Words**: Auto-convert total to words
8. **Signature Block**: For authorized person
9. **Professional Design**: Green + dark blue color scheme with curved elements

---

## Database Fields Needed (Not Currently in Schema)

### Invoice Table (additions)
- `poNumber` — PO number from customer
- `poDate` — PO date
- `ewayBillNumber` — E-way bill number
- `placeOfSupply` — State (already exists as calculation, needs to be stored)
- `amountInWords` — Auto-generated text representation

### Invoice Lines Table (additions)
- `batchNumber` — Batch identifier
- `expiryDate` — Expiry date
- `mfgDate` — Manufacturing date
- `mrp` — Maximum Retail Price
- `taxablePrice` — Taxable price per unit
- `upc` — Universal Product Code / Barcode

### Company Settings (additions)
- `logoUrl` — Uploaded logo URL (S3)
- `bankName` — Bank name
- `bankAccountNumber` — Account number
- `bankIfscCode` — IFSC code
- `accountHolderName` — Account holder name
- `termsAndConditions` — Custom T&C text
- `invoiceSignatureLabel` — "Authorized Signatory" or custom

---

## Invoice PDF Generation Steps

1. **Fetch invoice + company data**
2. **Generate HTML with**:
   - Logo in header
   - Company info + green banner
   - Invoice metadata (Invoice #, Date, PO #, E-way Bill #, Place of Supply)
   - Bill To / Ship To addresses
   - Line items table with batch/expiry/MFG/MRP/GST columns
   - Tax summary (Sub Total, GST, Total)
   - Bank details section
   - Amount in words
   - Signature block
   - Footer design
3. **Apply CSS styling** (green + dark blue theme)
4. **Export to PDF** using existing export function
