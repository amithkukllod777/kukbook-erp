import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Send, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function PaymentReminders() {
  const { data: invoices = [] } = trpc.invoices.list.useQuery();
  const [sentReminders, setSentReminders] = useState<Set<number>>(new Set());

  const overdueInvoices = useMemo(() => invoices.filter((i: any) => {
    const due = new Date(i.dueDate);
    return (i.status === "Sent" || i.status === "Overdue") && due <= new Date();
  }), [invoices]);

  const upcomingInvoices = useMemo(() => invoices.filter((i: any) => {
    const due = new Date(i.dueDate);
    const now = new Date();
    const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return i.status === "Sent" && diff > 0 && diff <= 7;
  }), [invoices]);

  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

  const sendReminder = (inv: any) => {
    setSentReminders(prev => { const n = new Set(Array.from(prev)); n.add(inv.id); return n; });
    toast.success(`Payment reminder sent to ${inv.customerName} for ${inv.invoiceId}`);
  };

  const sendAllReminders = () => {
    const newSent = new Set(Array.from(sentReminders));
    overdueInvoices.forEach((inv: any) => newSent.add(inv.id));
    setSentReminders(newSent);
    toast.success(`Payment reminders sent to ${overdueInvoices.length} customers`);
  };

  const daysOverdue = (dueDate: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Bell className="h-6 w-6" />Payment Reminders</h1><p className="text-sm text-muted-foreground mt-1">Send payment reminders to customers with overdue or upcoming invoices</p></div>
        <Button onClick={sendAllReminders} disabled={overdueInvoices.length === 0}><Send className="h-4 w-4 mr-2" />Send All Overdue Reminders</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Overdue Invoices</p><p className="text-2xl font-bold text-red-600">{overdueInvoices.length}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Overdue Amount</p><p className="text-2xl font-bold text-red-600">{fmt(overdueInvoices.reduce((s: number, i: any) => s + Number(i.total), 0))}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Due in 7 Days</p><p className="text-2xl font-bold text-amber-600">{upcomingInvoices.length}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Reminders Sent</p><p className="text-2xl font-bold text-emerald-600">{sentReminders.size}</p></CardContent></Card>
      </div>

      {/* Overdue Section */}
      <Card className="shadow-sm">
        <div className="p-4 border-b flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h2 className="font-semibold text-red-700">Overdue Invoices</h2>
          <Badge variant="destructive">{overdueInvoices.length}</Badge>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead>Due Date</TableHead><TableHead>Days Overdue</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead className="w-[120px]">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {overdueInvoices.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No overdue invoices</TableCell></TableRow>
              : overdueInvoices.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono">{inv.invoiceId}</TableCell>
                  <TableCell className="font-medium">{inv.customerName}</TableCell>
                  <TableCell>{inv.dueDate}</TableCell>
                  <TableCell><Badge variant="destructive">{daysOverdue(inv.dueDate)} days</Badge></TableCell>
                  <TableCell className="text-right font-medium">{fmt(Number(inv.total))}</TableCell>
                  <TableCell>{sentReminders.has(inv.id) ? <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge> : <Badge className="bg-red-100 text-red-700">Pending</Badge>}</TableCell>
                  <TableCell><Button size="sm" variant={sentReminders.has(inv.id) ? "outline" : "default"} onClick={() => sendReminder(inv)}><Send className="h-3 w-3 mr-1" />{sentReminders.has(inv.id) ? "Resend" : "Send"}</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upcoming Section */}
      <Card className="shadow-sm">
        <div className="p-4 border-b flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600" />
          <h2 className="font-semibold text-amber-700">Due in Next 7 Days</h2>
          <Badge className="bg-amber-100 text-amber-700">{upcomingInvoices.length}</Badge>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead>Due Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead className="w-[120px]">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {upcomingInvoices.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No invoices due in next 7 days</TableCell></TableRow>
              : upcomingInvoices.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono">{inv.invoiceId}</TableCell>
                  <TableCell className="font-medium">{inv.customerName}</TableCell>
                  <TableCell>{inv.dueDate}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(Number(inv.total))}</TableCell>
                  <TableCell>{sentReminders.has(inv.id) ? <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge> : <Badge className="bg-amber-100 text-amber-700">Pending</Badge>}</TableCell>
                  <TableCell><Button size="sm" variant="outline" onClick={() => sendReminder(inv)}><Send className="h-3 w-3 mr-1" />Remind</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
