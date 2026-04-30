import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search, CheckCircle, Send, FileDown, FileSpreadsheet, IndianRupee, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { exportToPDF, exportToCSV, exportInvoicePDF } from "@/lib/export";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);
const statusColors: Record<string, string> = { Draft: "bg-gray-100 text-gray-800", Sent: "bg-blue-100 text-blue-800", Paid: "bg-emerald-100 text-emerald-800", Overdue: "bg-red-100 text-red-800" };

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const GST_RATES = ["0", "5", "12", "18", "28"];

const PAYMENT_TERMS = [
  { label: "Immediate", days: 0 },
  { label: "7 Days", days: 7 },
  { label: "15 Days", days: 15 },
  { label: "30 Days", days: 30 },
  { label: "45 Days", days: 45 },
  { label: "60 Days", days: 60 },
  { label: "90 Days", days: 90 },
  { label: "Custom", days: -1 },
];

const TRANSPORT_MODES = ["Road", "Rail", "Air", "Ship"];

function numberToWords(num: number): string {
  if (num === 0) return "Zero Rupees only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const scales = ["", "Thousand", "Lakh", "Crore"];
  
  const convert = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
  };
  
  const intPart = Math.floor(num);
  const paise = Math.round((num - intPart) * 100);
  
  // Indian numbering: Crore, Lakh, Thousand, Hundred
  let result = "";
  let remaining = intPart;
  const crore = Math.floor(remaining / 10000000); remaining %= 10000000;
  const lakh = Math.floor(remaining / 100000); remaining %= 100000;
  const thousand = Math.floor(remaining / 1000); remaining %= 1000;
  
  if (crore) result += convert(crore) + " Crore ";
  if (lakh) result += convert(lakh) + " Lakh ";
  if (thousand) result += convert(thousand) + " Thousand ";
  if (remaining) result += convert(remaining);
  
  result = result.trim() + " Rupees";
  if (paise > 0) result += " and " + convert(paise) + " Paise";
  return result + " only";
}

export default function Invoices() {
  const utils = trpc.useUtils();
  const { activeCompany } = useCompany();
  const { data: invoices = [], isLoading } = trpc.invoices.list.useQuery();
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: nextId } = trpc.invoices.nextId.useQuery();
  const { data: companyDetails } = trpc.company.getById.useQuery(
    { id: activeCompany?.id || 0 },
    { enabled: !!activeCompany?.id }
  );
  const createMut = trpc.invoices.create.useMutation({ onSuccess: () => { utils.invoices.list.invalidate(); utils.invoices.nextId.invalidate(); toast.success("Invoice created"); setOpen(false); } });
  const updateStatusMut = trpc.invoices.updateStatus.useMutation({ onSuccess: () => { utils.invoices.list.invalidate(); toast.success("Status updated"); } });
  const deleteMut = trpc.invoices.delete.useMutation({ onSuccess: () => { utils.invoices.list.invalidate(); toast.success("Invoice deleted"); } });

  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payInvoice, setPayInvoice] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const partialPayMut = trpc.partialPayments.record.useMutation({ onSuccess: () => { utils.invoices.list.invalidate(); toast.success("Payment recorded"); setPayOpen(false); setPayAmount(""); } });
  const genPayLinkMut = trpc.partialPayments.generatePaymentLink.useMutation({ onSuccess: (data) => { const url = `${window.location.origin}${data.url}`; navigator.clipboard.writeText(url).then(() => toast.success("Payment link copied!")).catch(() => toast.info(`Payment link: ${url}`)); } });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [gstRate, setGstRate] = useState("18");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [tcsEnabled, setTcsEnabled] = useState(false);
  const [tcsSection, setTcsSection] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLineDetails, setShowLineDetails] = useState(false);

  const emptyLine = { description: "", qty: 1, rate: "0", discount: "0", amount: "0", batchNumber: "", expiryDate: "", mfgDate: "", mrp: "0", hsnCode: "", upc: "" };
  const [form, setForm] = useState({
    customerId: 0, customerName: "", date: new Date().toISOString().split("T")[0], dueDate: "", discount: "0",
    poNumber: "", poDate: "", ewayBillNumber: "",
    vehicleNumber: "", transportMode: "", transporterName: "",
    paymentTerms: "", lines: [{ ...emptyLine }]
  });

  // TCS Sections for sales
  const TCS_SECTIONS = [
    { code: "206C(1H)", description: "Sale of Goods (>50L)", rate: 0.1 },
    { code: "206C(1)", description: "Scrap", rate: 1 },
    { code: "206C(1)", description: "Timber/Forest Produce", rate: 2.5 },
    { code: "206C(1F)", description: "Motor Vehicle (>10L)", rate: 1 },
    { code: "206C(1G)", description: "Overseas Tour Package", rate: 5 },
  ];

  const filtered = useMemo(() => invoices.filter((i: any) => {
    const matchSearch = i.customerName.toLowerCase().includes(search.toLowerCase()) || i.invoiceId.includes(search);
    const matchStatus = filterStatus === "all" || i.status === filterStatus;
    return matchSearch && matchStatus;
  }), [invoices, search, filterStatus]);

  const subtotal = form.lines.reduce((s, l) => s + Number(l.amount || 0), 0);
  const discountAmt = Number(form.discount || 0);
  const taxableValue = Math.max(0, subtotal - discountAmt);

  // GST calculation: IGST if inter-state, CGST+SGST if intra-state
  const companyState = companyDetails?.state || "";
  const isInterState = placeOfSupply && companyState && placeOfSupply !== companyState;
  const gstPercent = Number(gstRate);
  const gstAmount = Math.round(taxableValue * gstPercent / 100 * 100) / 100;
  const cgst = isInterState ? 0 : Math.round(gstAmount / 2 * 100) / 100;
  const sgst = isInterState ? 0 : Math.round(gstAmount / 2 * 100) / 100;
  const igst = isInterState ? gstAmount : 0;
  const totalBeforeTcs = taxableValue + gstAmount;

  // TCS Calculation
  const selectedTcs = TCS_SECTIONS.find(s => s.code === tcsSection);
  const tcsRate = selectedTcs ? selectedTcs.rate : 0;
  const tcsAmount = tcsEnabled && tcsRate > 0 ? Math.round(totalBeforeTcs * tcsRate / 100 * 100) / 100 : 0;
  const total = totalBeforeTcs + tcsAmount;

  const addLine = () => setForm({ ...form, lines: [...form.lines, { ...emptyLine }] });
  const removeLine = (i: number) => { if (form.lines.length <= 1) return; setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) }); };
  const updateLine = (i: number, field: string, value: any) => {
    const lines = [...form.lines];
    (lines[i] as any)[field] = value;
    if (field === "qty" || field === "rate" || field === "discount") {
      const lineTotal = Number(lines[i].qty) * Number(lines[i].rate);
      const lineDisc = Number(lines[i].discount || 0);
      lines[i].amount = String(lineTotal - lineDisc);
    }
    setForm({ ...form, lines });
  };

  const openCreate = () => {
    setForm({
      customerId: 0, customerName: "", date: new Date().toISOString().split("T")[0], dueDate: "", discount: "0",
      poNumber: "", poDate: "", ewayBillNumber: "",
      vehicleNumber: "", transportMode: "", transporterName: "",
      paymentTerms: "", lines: [{ ...emptyLine }]
    });
    setGstRate("18");
    setPlaceOfSupply("");
    setTcsEnabled(false);
    setTcsSection("");
    setShowAdvanced(false);
    setShowLineDetails(false);
    setOpen(true);
  };

  const handleCustomerChange = (customerId: number) => {
    const c = customers.find((c: any) => c.id === customerId);
    setForm({ ...form, customerId, customerName: c?.name || "" });
    // Auto-set place of supply from customer's state
    if (c?.state) setPlaceOfSupply(c.state);
  };

  const handlePaymentTermsChange = (value: string) => {
    setForm({ ...form, paymentTerms: value });
    if (value !== "custom" && value !== "") {
      const days = Number(value);
      if (days >= 0 && form.date) {
        const d = new Date(form.date);
        d.setDate(d.getDate() + days);
        setForm(prev => ({ ...prev, paymentTerms: value, dueDate: d.toISOString().split("T")[0] }));
      }
    }
  };

  const handleSave = () => {
    if (!form.customerId) { toast.error("Select a customer"); return; }
    if (!form.dueDate) { toast.error("Due date is required"); return; }
    if (!placeOfSupply) { toast.error("Place of supply is required for GST"); return; }
    createMut.mutate({
      invoiceId: nextId || "INV-001",
      customerId: form.customerId,
      customerName: form.customerName,
      date: form.date,
      dueDate: form.dueDate,
      status: "Draft",
      subtotal: String(taxableValue),
      cgst: String(cgst),
      sgst: String(sgst),
      igst: String(igst),
      total: String(total),
      lines: form.lines.map(l => ({
        description: l.description, qty: l.qty, rate: String(l.rate), amount: String(l.amount),
        discount: String(l.discount), hsnCode: l.hsnCode || undefined, gstRate: gstRate,
        batchNumber: l.batchNumber || undefined, expiryDate: l.expiryDate || undefined,
        mfgDate: l.mfgDate || undefined, mrp: l.mrp && l.mrp !== "0" ? l.mrp : undefined,
        upc: l.upc || undefined
      })),
      tcsSection: tcsEnabled ? tcsSection : undefined,
      tcsRate: tcsEnabled ? String(tcsRate) : undefined,
      tcsAmount: tcsEnabled ? String(tcsAmount) : undefined,
      tcsTotal: tcsEnabled ? String(total) : undefined,
      poNumber: form.poNumber || undefined,
      poDate: form.poDate || undefined,
      ewayBillNumber: form.ewayBillNumber || undefined,
      vehicleNumber: form.vehicleNumber || undefined,
      transportMode: form.transportMode || undefined,
      transporterName: form.transporterName || undefined,
      paymentTerms: form.paymentTerms || undefined,
      placeOfSupply: placeOfSupply || undefined,
      amountInWords: numberToWords(total),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Invoices</h1><p className="text-sm text-muted-foreground mt-1">Track and manage customer invoices with GST</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCSV({ title: "Invoices", filename: "invoices", columns: [{ header: "Invoice #", key: "invoiceId" }, { header: "Customer", key: "customerName" }, { header: "Date", key: "date" }, { header: "Due Date", key: "dueDate" }, { header: "Status", key: "status" }, { header: "Subtotal", key: "subtotal", format: "currency" }, { header: "CGST", key: "cgst", format: "currency" }, { header: "SGST", key: "sgst", format: "currency" }, { header: "IGST", key: "igst", format: "currency" }, { header: "Total", key: "total", format: "currency" }], data: filtered })}><FileSpreadsheet className="h-4 w-4 mr-2" />Excel</Button>
          <Button variant="outline" onClick={() => exportToPDF({ title: "Invoices Report", subtitle: `Generated on ${new Date().toLocaleDateString()}`, filename: "invoices", columns: [{ header: "Invoice #", key: "invoiceId" }, { header: "Customer", key: "customerName" }, { header: "Date", key: "date" }, { header: "Status", key: "status" }, { header: "Subtotal", key: "subtotal", format: "currency" }, { header: "CGST", key: "cgst", format: "currency" }, { header: "SGST", key: "sgst", format: "currency" }, { header: "IGST", key: "igst", format: "currency" }, { header: "Total", key: "total", format: "currency" }], data: filtered })}><FileDown className="h-4 w-4 mr-2" />PDF</Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Invoice</Button>
        </div>
      </div>
      <Card className="shadow-sm">
        <div className="p-4 border-b flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Sent">Sent</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Overdue">Overdue</SelectItem></SelectContent></Select>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Subtotal</TableHead><TableHead className="text-right">GST</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Due</TableHead><TableHead className="w-[160px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No invoices found</TableCell></TableRow>
              : filtered.map((inv: any) => {
                const invGst = Number(inv.cgst) + Number(inv.sgst) + Number(inv.igst);
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">{inv.invoiceId}</TableCell>
                    <TableCell className="font-medium">{inv.customerName}</TableCell>
                    <TableCell>{inv.date}</TableCell>
                    <TableCell>{inv.dueDate}</TableCell>
                    <TableCell><Badge className={statusColors[inv.status] || ""} variant="secondary">{inv.status}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(Number(inv.subtotal))}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {invGst > 0 ? fmt(invGst) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{fmt(Number(inv.total))}</TableCell>
                    <TableCell className="text-right tabular-nums text-green-600">{fmt(Number(inv.paidAmount || 0))}</TableCell>
                    <TableCell className="text-right tabular-nums text-orange-600">{fmt(Number(inv.dueAmount || inv.total))}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="Download PDF" onClick={() => exportInvoicePDF(inv)}><FileDown className="h-4 w-4 text-primary" /></Button>
                        {inv.status !== "Paid" && <Button variant="ghost" size="icon" title="Share Payment Link" onClick={() => genPayLinkMut.mutate({ invoiceId: inv.id, companyId: activeCompany?.id || 0 })}><Share2 className="h-4 w-4 text-violet-600" /></Button>}
                        {inv.status === "Draft" && <Button variant="ghost" size="icon" title="Mark as Sent" onClick={() => updateStatusMut.mutate({ id: inv.id, status: "Sent" })}><Send className="h-4 w-4 text-blue-600" /></Button>}
                        {(inv.status === "Sent" || inv.status === "Overdue") && <>
                          <Button variant="ghost" size="icon" title="Record Partial Payment" onClick={() => { setPayInvoice(inv); setPayAmount(""); setPayOpen(true); }}><IndianRupee className="h-4 w-4 text-amber-600" /></Button>
                          <Button variant="ghost" size="icon" title="Mark as Fully Paid" onClick={() => updateStatusMut.mutate({ id: inv.id, status: "Paid" })}><CheckCircle className="h-4 w-4 text-emerald-600" /></Button>
                        </>}
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteMut.mutate({ id: inv.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Row 1: Customer, Date, Due Date */}
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-sm font-medium">Customer *</label>
                <Select value={String(form.customerId || "")} onValueChange={v => handleCustomerChange(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{customers.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Date</label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Due Date *</label><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
            </div>

            {/* Row 2: Payment Terms */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Payment Terms</label>
                <Select value={form.paymentTerms} onValueChange={handlePaymentTermsChange}>
                  <SelectTrigger><SelectValue placeholder="Select terms" /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS.map(t => (
                      <SelectItem key={t.label} value={String(t.days)}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">PO Number</label><Input value={form.poNumber} onChange={e => setForm({ ...form, poNumber: e.target.value })} placeholder="Customer PO #" /></div>
              <div><label className="text-sm font-medium">PO Date</label><Input type="date" value={form.poDate} onChange={e => setForm({ ...form, poDate: e.target.value })} /></div>
            </div>

            {/* GST Section */}
            <div className="grid grid-cols-3 gap-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
              <div>
                <label className="text-sm font-medium text-blue-800">Place of Supply *</label>
                <Select value={placeOfSupply} onValueChange={setPlaceOfSupply}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-800">GST Rate</label>
                <Select value={gstRate} onValueChange={setGstRate}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GST_RATES.map(r => <SelectItem key={r} value={r}>{r}%</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="text-sm">
                  {companyState && <p className="text-muted-foreground">Company: <span className="font-medium">{companyState}</span></p>}
                  {placeOfSupply && (
                    <p className={isInterState ? "text-orange-600 font-medium" : "text-green-600 font-medium"}>
                      {isInterState ? "Inter-State → IGST" : "Intra-State → CGST + SGST"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* E-Way Bill & Transport (Collapsible) */}
            <div className="border rounded-lg">
              <button
                type="button"
                className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-muted/50 transition-colors"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span className="text-amber-800">E-Way Bill & Transport Details</span>
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showAdvanced && (
                <div className="p-3 pt-0 grid grid-cols-3 gap-4 border-t bg-amber-50/30">
                  <div><label className="text-sm font-medium text-amber-700">E-Way Bill No.</label><Input value={form.ewayBillNumber} onChange={e => setForm({ ...form, ewayBillNumber: e.target.value })} placeholder="E-Way Bill Number" /></div>
                  <div><label className="text-sm font-medium text-amber-700">Vehicle Number</label><Input value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} placeholder="MH 12 AB 1234" /></div>
                  <div>
                    <label className="text-sm font-medium text-amber-700">Transport Mode</label>
                    <Select value={form.transportMode} onValueChange={v => setForm({ ...form, transportMode: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{TRANSPORT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3"><label className="text-sm font-medium text-amber-700">Transporter Name</label><Input value={form.transporterName} onChange={e => setForm({ ...form, transporterName: e.target.value })} placeholder="Transport company name" /></div>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Line Items</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowLineDetails(!showLineDetails)}>
                    {showLineDetails ? "Hide" : "Show"} Batch/Expiry
                  </Button>
                  <Button variant="outline" size="sm" onClick={addLine}><Plus className="h-3 w-3 mr-1" />Add</Button>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[80px]">HSN</TableHead>
                      <TableHead className="w-[60px]">Qty</TableHead>
                      <TableHead className="w-[90px]">Rate</TableHead>
                      <TableHead className="w-[80px]">Discount</TableHead>
                      <TableHead className="w-[90px]">Amount</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.lines.map((line, i) => (
                      <>
                        <TableRow key={`main-${i}`}>
                          <TableCell><Input value={line.description} onChange={e => updateLine(i, "description", e.target.value)} placeholder="Item description" /></TableCell>
                          <TableCell><Input value={line.hsnCode} onChange={e => updateLine(i, "hsnCode", e.target.value)} placeholder="HSN" /></TableCell>
                          <TableCell><Input type="number" value={line.qty} onChange={e => updateLine(i, "qty", Number(e.target.value))} /></TableCell>
                          <TableCell><Input type="number" value={line.rate} onChange={e => updateLine(i, "rate", e.target.value)} /></TableCell>
                          <TableCell><Input type="number" value={line.discount} onChange={e => updateLine(i, "discount", e.target.value)} placeholder="0" /></TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{fmt(Number(line.amount))}</TableCell>
                          <TableCell><Button variant="ghost" size="icon" onClick={() => removeLine(i)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                        </TableRow>
                        {showLineDetails && (
                          <TableRow key={`detail-${i}`} className="bg-muted/20">
                            <TableCell colSpan={7}>
                              <div className="grid grid-cols-5 gap-2 py-1">
                                <div><label className="text-xs text-muted-foreground">Batch No.</label><Input value={line.batchNumber} onChange={e => updateLine(i, "batchNumber", e.target.value)} placeholder="Batch" className="h-7 text-xs" /></div>
                                <div><label className="text-xs text-muted-foreground">Expiry Date</label><Input type="date" value={line.expiryDate} onChange={e => updateLine(i, "expiryDate", e.target.value)} className="h-7 text-xs" /></div>
                                <div><label className="text-xs text-muted-foreground">MFG Date</label><Input type="date" value={line.mfgDate} onChange={e => updateLine(i, "mfgDate", e.target.value)} className="h-7 text-xs" /></div>
                                <div><label className="text-xs text-muted-foreground">MRP (₹)</label><Input type="number" value={line.mrp} onChange={e => updateLine(i, "mrp", e.target.value)} placeholder="0" className="h-7 text-xs" /></div>
                                <div><label className="text-xs text-muted-foreground">UPC/Barcode</label><Input value={line.upc} onChange={e => updateLine(i, "upc", e.target.value)} placeholder="Barcode" className="h-7 text-xs" /></div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                    <TableRow className="bg-muted/30"><TableCell colSpan={5} className="text-right text-sm">Subtotal</TableCell><TableCell className="text-right tabular-nums">{fmt(subtotal)}</TableCell><TableCell /></TableRow>
                    <TableRow className="bg-muted/30"><TableCell colSpan={5} className="text-right text-sm">Discount</TableCell><TableCell><Input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} className="text-right h-8" /></TableCell><TableCell /></TableRow>
                    <TableRow className="bg-muted/30"><TableCell colSpan={5} className="text-right text-sm font-medium">Taxable Value</TableCell><TableCell className="text-right font-medium tabular-nums">{fmt(taxableValue)}</TableCell><TableCell /></TableRow>
                    {!isInterState && gstPercent > 0 && (
                      <>
                        <TableRow className="bg-blue-50/50"><TableCell colSpan={5} className="text-right text-sm text-blue-700">CGST @ {gstPercent / 2}%</TableCell><TableCell className="text-right tabular-nums text-blue-700">{fmt(cgst)}</TableCell><TableCell /></TableRow>
                        <TableRow className="bg-blue-50/50"><TableCell colSpan={5} className="text-right text-sm text-blue-700">SGST @ {gstPercent / 2}%</TableCell><TableCell className="text-right tabular-nums text-blue-700">{fmt(sgst)}</TableCell><TableCell /></TableRow>
                      </>
                    )}
                    {isInterState && gstPercent > 0 && (
                      <TableRow className="bg-orange-50/50"><TableCell colSpan={5} className="text-right text-sm text-orange-700">IGST @ {gstPercent}%</TableCell><TableCell className="text-right tabular-nums text-orange-700">{fmt(igst)}</TableCell><TableCell /></TableRow>
                    )}
                    {tcsEnabled && tcsAmount > 0 && (
                      <TableRow className="bg-purple-50/50"><TableCell colSpan={5} className="text-right text-sm text-purple-700">TCS ({tcsSection} @ {tcsRate}%)</TableCell><TableCell className="text-right tabular-nums text-purple-700">{fmt(tcsAmount)}</TableCell><TableCell /></TableRow>
                    )}
                    <TableRow className="bg-muted/50"><TableCell colSpan={5} className="text-right font-bold">Total{tcsEnabled && tcsAmount > 0 ? ' (incl. TCS)' : ''}</TableCell><TableCell className="text-right font-bold tabular-nums text-lg">{fmt(total)}</TableCell><TableCell /></TableRow>
                    {total > 0 && (
                      <TableRow className="bg-muted/20"><TableCell colSpan={7} className="text-xs text-muted-foreground italic">{numberToWords(total)}</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* TCS Section */}
            <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <input type="checkbox" id="tcs-toggle" checked={tcsEnabled} onChange={e => setTcsEnabled(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                <label htmlFor="tcs-toggle" className="text-sm font-medium text-purple-800">Apply TCS (Tax Collected at Source)</label>
              </div>
              {tcsEnabled && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-purple-700">TCS Section</label>
                    <Select value={tcsSection} onValueChange={setTcsSection}>
                      <SelectTrigger><SelectValue placeholder="Select TCS section" /></SelectTrigger>
                      <SelectContent>
                        {TCS_SECTIONS.map((s, i) => (
                          <SelectItem key={i} value={s.code}>
                            {s.code} — {s.description} ({s.rate}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedTcs && totalBeforeTcs > 0 && (
                    <div className="text-sm space-y-1 p-2 bg-purple-100/50 rounded">
                      <div className="flex justify-between"><span>TCS Rate (Sec {selectedTcs.code})</span><span className="font-medium">{tcsRate}%</span></div>
                      <div className="flex justify-between"><span>TCS Amount (on {fmt(totalBeforeTcs)})</span><span className="font-medium text-purple-800">{fmt(tcsAmount)}</span></div>
                      <div className="flex justify-between font-bold border-t pt-1"><span>Invoice Total (incl. TCS)</span><span>{fmt(total)}</span></div>
                      <div className="text-xs text-muted-foreground">TCS u/s 206C(1H): Applicable on sale of goods exceeding ₹50 lakhs aggregate per buyer per FY</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={createMut.isPending}>Create Invoice</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partial Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          {payInvoice && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <div>Invoice: <span className="font-medium">{payInvoice.invoiceId}</span></div>
                <div>Customer: <span className="font-medium">{payInvoice.customerName}</span></div>
                <div>Total: <span className="font-medium">{fmt(Number(payInvoice.total))}</span></div>
                <div>Already Paid: <span className="text-green-600 font-medium">{fmt(Number(payInvoice.paidAmount || 0))}</span></div>
                <div>Due: <span className="text-orange-600 font-medium">{fmt(Number(payInvoice.dueAmount || payInvoice.total))}</span></div>
              </div>
              <div>
                <label className="text-sm font-medium">Payment Amount (₹)</label>
                <Input type="number" placeholder="Enter amount" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
                <Button onClick={() => { if (!payAmount || Number(payAmount) <= 0) { toast.error("Enter valid amount"); return; } partialPayMut.mutate({ invoiceId: payInvoice.id, amount: payAmount }); }} disabled={partialPayMut.isPending}>Record Payment</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
