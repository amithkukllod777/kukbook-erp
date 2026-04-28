import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileSpreadsheet, Users, Building2, Package, Receipt, ShoppingCart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { exportToCSV } from "@/lib/export";
import { toast } from "sonner";

const modules = [
  { key: "customers", label: "Customers", icon: Users, fields: ["name", "email", "phone", "city", "address"] },
  { key: "vendors", label: "Vendors", icon: Building2, fields: ["name", "email", "phone", "category", "address"] },
  { key: "inventory", label: "Inventory Items", icon: Package, fields: ["sku", "name", "category", "qty", "cost", "reorder"] },
  { key: "invoices", label: "Invoices", icon: Receipt, fields: ["invoiceId", "customerName", "date", "dueDate", "status", "total"] },
  { key: "bills", label: "Bills", icon: ShoppingCart, fields: ["billId", "vendorName", "date", "dueDate", "amount", "status"] },
];

export default function ImportExport() {
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: vendors = [] } = trpc.vendors.list.useQuery();
  const { data: inventoryItems = [] } = trpc.inventory.list.useQuery();
  const { data: invoices = [] } = trpc.invoices.list.useQuery();
  const { data: bills = [] } = trpc.bills.list.useQuery();

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
    input.accept = ".csv,.xlsx,.xls";
    input.onchange = () => {
      toast.info(`Import for ${mod.label} — CSV parsing coming soon. Use the template to prepare your data.`);
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
                  <Button className="flex-1" variant="outline" size="sm" onClick={() => handleImport(mod)}>
                    <Upload className="h-4 w-4 mr-1" />Import
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => handleDownloadTemplate(mod)}>
                  <FileSpreadsheet className="h-3 w-3 mr-1" />Download Template
                </Button>
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
          <p><strong>4.</strong> Click "Import" and select your file.</p>
          <p><strong>Note:</strong> Existing records will not be overwritten. Duplicate entries may be created if IDs match.</p>
        </CardContent>
      </Card>
    </div>
  );
}
