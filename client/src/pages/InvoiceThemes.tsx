import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Palette, FileText } from "lucide-react";
import { toast } from "sonner";

const themes = [
  { id: "classic", name: "Classic", description: "Clean, traditional business invoice with blue accents", colors: ["#1e40af", "#f8fafc", "#334155"], preview: "border-blue-600" },
  { id: "modern", name: "Modern", description: "Sleek, minimalist design with dark header", colors: ["#0f172a", "#ffffff", "#6366f1"], preview: "border-indigo-600" },
  { id: "professional", name: "Professional", description: "Corporate style with green accents and formal layout", colors: ["#166534", "#f0fdf4", "#15803d"], preview: "border-green-600" },
  { id: "elegant", name: "Elegant", description: "Sophisticated design with serif fonts and gold accents", colors: ["#78350f", "#fffbeb", "#b45309"], preview: "border-amber-600" },
  { id: "bold", name: "Bold", description: "High-contrast design with large typography", colors: ["#dc2626", "#ffffff", "#1f2937"], preview: "border-red-600" },
  { id: "minimal", name: "Minimal", description: "Ultra-clean with lots of whitespace and thin lines", colors: ["#6b7280", "#ffffff", "#e5e7eb"], preview: "border-gray-400" },
  { id: "creative", name: "Creative", description: "Colorful design with gradient accents", colors: ["#7c3aed", "#faf5ff", "#a855f7"], preview: "border-purple-600" },
  { id: "thermal", name: "Thermal Print", description: "Compact layout optimized for thermal receipt printers", colors: ["#000000", "#ffffff", "#374151"], preview: "border-gray-800" },
];

export default function InvoiceThemes() {
  const [activeTheme, setActiveTheme] = useState("classic");

  const handleSelect = (id: string) => {
    setActiveTheme(id);
    toast.success(`"${themes.find(t => t.id === id)?.name}" theme selected as default`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Palette className="h-6 w-6" />Invoice Themes</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose a template for your invoices, estimates, and delivery challans</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {themes.map(theme => (
          <Card key={theme.id} className={`cursor-pointer transition-all hover:shadow-md ${activeTheme === theme.id ? "ring-2 ring-primary" : ""}`} onClick={() => handleSelect(theme.id)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{theme.name}</CardTitle>
                {activeTheme === theme.id && <Badge className="bg-primary text-primary-foreground"><Check className="h-3 w-3 mr-1" />Active</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Theme Preview */}
              <div className={`border-2 ${theme.preview} rounded-lg overflow-hidden`}>
                <div className="p-3" style={{ backgroundColor: theme.colors[0] }}>
                  <div className="flex justify-between items-center">
                    <div className="text-white text-xs font-bold">INVOICE</div>
                    <div className="text-white/70 text-[10px]">#INV-001</div>
                  </div>
                </div>
                <div className="p-3 bg-white space-y-2">
                  <div className="flex justify-between">
                    <div className="space-y-1">
                      <div className="h-2 w-16 rounded" style={{ backgroundColor: theme.colors[2] + "30" }}></div>
                      <div className="h-2 w-12 rounded" style={{ backgroundColor: theme.colors[2] + "20" }}></div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="h-2 w-14 rounded ml-auto" style={{ backgroundColor: theme.colors[2] + "30" }}></div>
                      <div className="h-2 w-10 rounded ml-auto" style={{ backgroundColor: theme.colors[2] + "20" }}></div>
                    </div>
                  </div>
                  <div className="border-t pt-2 space-y-1">
                    <div className="h-2 w-full rounded" style={{ backgroundColor: theme.colors[0] + "15" }}></div>
                    <div className="h-2 w-full rounded" style={{ backgroundColor: theme.colors[0] + "10" }}></div>
                    <div className="h-2 w-3/4 rounded" style={{ backgroundColor: theme.colors[0] + "10" }}></div>
                  </div>
                  <div className="border-t pt-2 flex justify-end">
                    <div className="h-3 w-16 rounded" style={{ backgroundColor: theme.colors[0] }}></div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{theme.description}</p>
              <div className="flex gap-1">
                {theme.colors.map((c, i) => <div key={i} className="h-5 w-5 rounded-full border" style={{ backgroundColor: c }}></div>)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Theme applies to all document exports</p>
              <p className="text-sm text-muted-foreground">Selected theme will be used when generating PDF invoices, estimates, delivery challans, and other documents.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
