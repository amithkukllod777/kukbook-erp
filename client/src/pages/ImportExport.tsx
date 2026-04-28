import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileSpreadsheet, Users, Building2, Package, Receipt, ShoppingCart, CheckCircle2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { exportToCSV } from "@/lib/export";
import { toast } from "sonner";
import { useState } from "react";

const modules = [
  { key: "customers", label: "Customers", icon: Users, fields: ["name", "email", "phone", "city", "address"], required: ["name"] },
  { key: "vendors", label: "Vendors", icon: Building2, fields: ["name", "email", "phone", "category", "address"], required: ["name"] },
  { key: "inventory", label: "Inventory Items", icon: Package, fields: ["sku", "name", "category", "qty", "cost", "reorder"], required: ["sku", "name"] },
  { key: "invoices", label: "Invoices", icon: Receipt, fields: ["invoiceId", "customerName", "date", "dueDate", "status", "total"], required: [] },
  { key: "bills", label: "Bills", icon: ShoppingCart, fields: ["billId", "vendorName", "date", "dueDate", "amount", "status"], required: [] },
];

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n").map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ""; }
      else { current += ch; }
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ""; });
    return row;
  });
}

export default function ImportExport() {
  const utils = trpc.useUtils();
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: vendors = [] } = trpc.vendors.list.useQuery();
  const { data: inventoryItems = [] } = trpc.inventory.list.useQuery();
  const { data: invoices = [] } = trpc.invoices.list.useQuery();
  const { data: bills = [] } = trpc.bills.list.useQuery();

  const importCustomers = trpc.bulkImport.customers.useMutation({ onSuccess: (d) => { utils.customers.list.invalidate(); toast.success(`${d.imported} customers imported`); } });
  const importVendors = trpc.bulkImport.vendors.useMutation({ onSuccess: (d) => { utils.vendors.list.invalidate(); toast.success(`${d.imported} vendors imported`); } });
  const importInventory = trpc.bulkImport.inventory.useMutation({ onSuccess: (d) => { utils.inventory.list.invalidate(); toast.success(`${d.imported} inventory items imported`); } });

  const [importStatus, setImportStatus] = useState<Record<string, { status: "idle" | "success" | "error"; message: string }>>({});

  const dataMap: Record<string, any[]> = {
    customers, vendors, inventory: inventoryItems, invoices, bills,
  };

  const handleExport = (mod: typeof modules[0]) => {
    const data = dataMap[mod.key] || [];
    if (data.length === 0) { toast.error(`No ${mod.label.toLowerCase()} to export`); return; }
    exportToCSV({
      title: mod.label,
      filename: mod.key,
      columns: mod.fields.map(f => ({ header: f.charAt(0).toUpperCase() + f.slice(1), key: f })),
      data,
    });
    toast.success(`${mod.label} exported successfully`);
  };

  const handleImport = (mod: typeof modules[0]) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const rows = parseCSV(text);
        if (rows.length === 0) { toast.error("No data rows found in CSV"); return; }

        // Validate required fields
        for (const req of mod.required) {
          const missing = rows.filter(r => !r[req]);
          if (missing.length > 0) {
            toast.error(`${missing.length} rows missing required field: ${req}`);
            setImportStatus(prev => ({ ...prev, [mod.key]: { status: "error", message: `Missing required field: ${req}` } }));
            return;
          }
        }

        if (mod.key === "customers") {
          await importCustomers.mutateAsync({ rows: rows.map(r => ({ name: r.name, email: r.email || undefined, phone: r.phone || undefined, city: r.city || undefined, address: r.address || undefined })) });
        } else if (mod.key === "vendors") {
          await importVendors.mutateAsync({ rows: rows.map(r => ({ name: r.name, email: r.email || undefined, phone: r.phone || undefined, category: r.category || undefined, address: r.address || undefined })) });
        } else if (mod.key === "inventory") {
          await importInventory.mutateAsync({ rows: rows.map(r => ({ sku: r.sku, name: r.name, category: r.category || undefined, qty: Number(r.qty) || 0, cost: r.cost || "0", reorder: Number(r.reorder) || 10 })) });
        } else {
          toast.info(`Import for ${mod.label} is available for Customers, Vendors, and Inventory.`);
          return;
        }
        setImportStatus(prev => ({ ...prev, [mod.key]: { status: "success", message: `${rows.length} rows imported` } }));
      } catch (err: any) {
        toast.error(`Import failed: ${err.message || "Unknown error"}`);
        setImportStatus(prev => ({ ...prev, [mod.key]: { status: "error", message: err.message || "Unknown error" } }));
      }
    };
    input.click();
  };

  const handleDownloadTemplate = (mod: typeof modules[0]) => {
    const header = mod.fields.join(",");
    const sampleRow = mod.fields.map(f => `sample_${f}`).join(",");
    const csv = `${header}\n${sampleRow}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mod.key}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const importable = ["customers", "vendors", "inventory"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import / Export</h1>
        <p className="text-muted-foreground">Bulk import and export data across all modules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map(mod => {
          const Icon = mod.icon;
          const count = (dataMap[mod.key] || []).length;
          const status = importStatus[mod.key];
          const canImport = importable.includes(mod.key);
          return (
            <Card key={mod.key} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span>{mod.label}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">{count} records</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button className="flex-1" variant="outline" size="sm" onClick={() => handleExport(mod)}>
                    <Download className="h-4 w-4 mr-1" />Export CSV
                  </Button>
                  <Button className="flex-1" variant="outline" size="sm" onClick={() => handleImport(mod)} disabled={!canImport}>
                    <Upload className="h-4 w-4 mr-1" />{canImport ? "Import CSV" : "Export Only"}
                  </Button>
                </div>
                {canImport && (
                  <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => handleDownloadTemplate(mod)}>
                    <FileSpreadsheet className="h-3 w-3 mr-1" />Download Template
                  </Button>
                )}
                {status && (
                  <div className={`flex items-center gap-2 text-xs p-2 rounded ${status.status === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {status.status === "success" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    {status.message}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>Import Instructions</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p><strong>1.</strong> Download the CSV template for the module you want to import.</p>
          <p><strong>2.</strong> Fill in your data following the column headers. Do not change column names.</p>
          <p><strong>3.</strong> Save the file as CSV (UTF-8) format.</p>
          <p><strong>4.</strong> Click "Import CSV" and select your file. Validation runs automatically.</p>
          <p><strong>Supported for import:</strong> Customers, Vendors, Inventory Items.</p>
          <p><strong>Note:</strong> Existing records will not be overwritten. Each row creates a new record.</p>
        </CardContent>
      </Card>
    </div>
  );
}
