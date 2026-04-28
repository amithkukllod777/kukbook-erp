import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Barcode as BarcodeIcon, Download, Printer, Search, Package } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Simple Code128 barcode SVG generator
function generateBarcodeSVG(text: string, width = 200, height = 60): string {
  const chars = text.split("");
  const barWidth = width / (chars.length * 11 + 35);
  let bars = "";
  let x = 10;
  // Start code
  [2,1,1,1,4,1,2].forEach(w => { bars += `<rect x="${x}" y="5" width="${barWidth * w}" height="${height - 15}" fill="${x % 2 === 0 ? '#000' : '#000'}"/>`; x += barWidth * w; });
  // Data
  chars.forEach(ch => {
    const code = ch.charCodeAt(0);
    const widths = [2, 1, 2, 3, 1, 1, 1]; // simplified pattern
    widths.forEach((w, i) => {
      if (i % 2 === 0) bars += `<rect x="${x}" y="5" width="${barWidth * w}" height="${height - 15}" fill="#000"/>`;
      x += barWidth * w;
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="white"/>
    ${bars}
    <text x="${width/2}" y="${height - 2}" text-anchor="middle" font-family="monospace" font-size="10">${text}</text>
  </svg>`;
}

export default function Barcode() {
  const { data: inventory = [] } = trpc.inventory.list.useQuery();
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [barcodeType, setBarcodeType] = useState("sku");
  const [printQty, setPrintQty] = useState(1);

  const filtered = inventory.filter((i: any) =>
    i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: number) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedItems.length === filtered.length) setSelectedItems([]);
    else setSelectedItems(filtered.map((i: any) => i.id));
  };

  const printBarcodes = () => {
    const items = inventory.filter((i: any) => selectedItems.includes(i.id));
    if (items.length === 0) { toast.error("Select items to print"); return; }

    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Please allow popups"); return; }

    const barcodes = items.map((item: any) => {
      const text = barcodeType === "sku" ? item.sku : (item.hsnCode || item.sku);
      const svgs = Array(printQty).fill(null).map(() => `
        <div style="display:inline-block;margin:8px;padding:8px;border:1px dashed #ccc;text-align:center;">
          ${generateBarcodeSVG(text, 180, 50)}
          <div style="font-size:10px;margin-top:2px;">${item.name}</div>
          <div style="font-size:9px;color:#666;">₹${Number(item.cost).toFixed(2)}</div>
        </div>
      `).join("");
      return svgs;
    }).join("");

    printWindow.document.write(`
      <html><head><title>Print Barcodes</title><style>body{font-family:Arial;} @media print { body { margin: 0; } }</style></head>
      <body>${barcodes}<script>window.print();</script></body></html>
    `);
    printWindow.document.close();
    toast.success(`Printing ${items.length * printQty} barcodes`);
  };

  const downloadBarcode = (item: any) => {
    const text = barcodeType === "sku" ? item.sku : (item.hsnCode || item.sku);
    const svg = generateBarcodeSVG(text, 250, 70);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `barcode-${item.sku}.svg`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Barcode downloaded for ${item.sku}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><BarcodeIcon className="h-6 w-6" />Barcode Generator</h1><p className="text-sm text-muted-foreground mt-1">Generate and print barcodes for inventory items</p></div>
        <div className="flex gap-2">
          <Select value={barcodeType} onValueChange={setBarcodeType}><SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sku">By SKU</SelectItem><SelectItem value="hsn">By HSN Code</SelectItem></SelectContent></Select>
          <div className="flex items-center gap-1"><span className="text-sm text-muted-foreground">Qty:</span><Input type="number" value={printQty} onChange={e => setPrintQty(Math.max(1, Number(e.target.value)))} className="w-16" min={1} /></div>
          <Button onClick={printBarcodes} disabled={selectedItems.length === 0}><Printer className="h-4 w-4 mr-2" />Print Selected ({selectedItems.length})</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total Items</p><p className="text-2xl font-bold">{inventory.length}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">With HSN Code</p><p className="text-2xl font-bold text-blue-600">{inventory.filter((i: any) => i.hsnCode).length}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Selected for Print</p><p className="text-2xl font-bold text-emerald-600">{selectedItems.length}</p></CardContent></Card>
      </div>

      <Card className="shadow-sm">
        <div className="p-4 border-b flex gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <Button variant="outline" onClick={selectAll}>{selectedItems.length === filtered.length ? "Deselect All" : "Select All"}</Button>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead className="w-[50px]">Select</TableHead><TableHead>SKU</TableHead><TableHead>Item Name</TableHead><TableHead>HSN Code</TableHead><TableHead>Qty</TableHead><TableHead>Cost</TableHead><TableHead>Barcode Preview</TableHead><TableHead className="w-[80px]">Download</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No items found</TableCell></TableRow>
              : filtered.map((item: any) => (
                <TableRow key={item.id} className={selectedItems.includes(item.id) ? "bg-primary/5" : ""}>
                  <TableCell><input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleSelect(item.id)} className="h-4 w-4 rounded" /></TableCell>
                  <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.hsnCode ? <Badge variant="secondary">{item.hsnCode}</Badge> : <span className="text-muted-foreground text-sm">—</span>}</TableCell>
                  <TableCell>{item.qty}</TableCell>
                  <TableCell>₹{Number(item.cost).toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="bg-white p-1 inline-block rounded border" dangerouslySetInnerHTML={{ __html: generateBarcodeSVG(barcodeType === "sku" ? item.sku : (item.hsnCode || item.sku), 120, 35) }} />
                  </TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => downloadBarcode(item)}><Download className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
