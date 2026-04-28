import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MessageSquare, Send, Phone, Mail, Search, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Messaging() {
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: vendors = [] } = trpc.vendors.list.useQuery();
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<"whatsapp" | "sms" | "email">("whatsapp");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [sentMessages, setSentMessages] = useState<any[]>([
    { id: 1, to: "Acme Corp", phone: "+91 98765 43210", channel: "whatsapp", message: "Payment reminder for INV-001", status: "Delivered", sentAt: "2026-04-25 10:30" },
    { id: 2, to: "Raj Enterprises", phone: "+91 87654 32109", channel: "sms", message: "Your invoice INV-003 is ready", status: "Sent", sentAt: "2026-04-24 14:15" },
  ]);

  const allParties = useMemo(() => [
    ...customers.map((c: any) => ({ ...c, type: "Customer" })),
    ...vendors.map((v: any) => ({ ...v, type: "Vendor" })),
  ], [customers, vendors]);

  const filteredMessages = sentMessages.filter(m => m.to.toLowerCase().includes(search.toLowerCase()) || m.message.toLowerCase().includes(search.toLowerCase()));

  const templates = [
    { name: "Payment Reminder", text: "Dear {name}, this is a friendly reminder that your invoice {invoice} of {amount} is due on {date}. Please make the payment at your earliest convenience. Thank you!" },
    { name: "Invoice Sent", text: "Dear {name}, your invoice {invoice} for {amount} has been generated. Please find the details in your email. Thank you for your business!" },
    { name: "Order Confirmation", text: "Dear {name}, your order {order} has been confirmed. Expected delivery: {date}. Thank you!" },
    { name: "Payment Received", text: "Dear {name}, we have received your payment of {amount} against invoice {invoice}. Thank you!" },
  ];

  const handleSend = () => {
    if (!recipient || !message) { toast.error("Please select recipient and enter message"); return; }
    const party = allParties.find((p: any) => p.name === recipient);
    setSentMessages([{
      id: sentMessages.length + 1, to: recipient, phone: party?.phone || "N/A",
      channel, message, status: "Sent", sentAt: new Date().toLocaleString()
    }, ...sentMessages]);
    setOpen(false);
    setMessage("");
    setRecipient("");
    const channelName = channel === "whatsapp" ? "WhatsApp" : channel === "sms" ? "SMS" : "Email";
    toast.success(`${channelName} message sent to ${recipient}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><MessageSquare className="h-6 w-6" />Messaging</h1><p className="text-sm text-muted-foreground mt-1">Send WhatsApp, SMS, and Email messages to customers and vendors</p></div>
        <Button onClick={() => setOpen(true)}><Send className="h-4 w-4 mr-2" />New Message</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total Sent</p><p className="text-2xl font-bold">{sentMessages.length}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">WhatsApp</p><p className="text-2xl font-bold text-green-600">{sentMessages.filter(m => m.channel === "whatsapp").length}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">SMS</p><p className="text-2xl font-bold text-blue-600">{sentMessages.filter(m => m.channel === "sms").length}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Email</p><p className="text-2xl font-bold text-purple-600">{sentMessages.filter(m => m.channel === "email").length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="history">
        <TabsList><TabsTrigger value="history">Message History</TabsTrigger><TabsTrigger value="templates">Templates</TabsTrigger></TabsList>

        <TabsContent value="history">
          <Card className="shadow-sm">
            <div className="p-4 border-b"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search messages..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div></div>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Channel</TableHead><TableHead>To</TableHead><TableHead>Phone</TableHead><TableHead>Message</TableHead><TableHead>Status</TableHead><TableHead>Sent At</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredMessages.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No messages found</TableCell></TableRow>
                  : filteredMessages.map(m => (
                    <TableRow key={m.id}>
                      <TableCell><Badge className={m.channel === "whatsapp" ? "bg-green-100 text-green-700" : m.channel === "sms" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}>{m.channel === "whatsapp" ? "WhatsApp" : m.channel === "sms" ? "SMS" : "Email"}</Badge></TableCell>
                      <TableCell className="font-medium">{m.to}</TableCell>
                      <TableCell className="font-mono text-sm">{m.phone}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{m.message}</TableCell>
                      <TableCell><Badge variant="secondary">{m.status}</Badge></TableCell>
                      <TableCell className="text-sm">{m.sentAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2"><CardTitle className="text-base">{t.name}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{t.text}</p>
                  <Button size="sm" variant="outline" onClick={() => { setMessage(t.text); setOpen(true); }}>Use Template</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Send Message</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><label className="text-sm font-medium">Channel</label>
              <Select value={channel} onValueChange={v => setChannel(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="sms">SMS</SelectItem><SelectItem value="email">Email</SelectItem></SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">Recipient</label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger><SelectValue placeholder="Select customer or vendor" /></SelectTrigger>
                <SelectContent>{allParties.map((p: any) => <SelectItem key={`${p.type}-${p.id}`} value={p.name}>{p.name} ({p.type})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">Message</label><Textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Type your message..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSend}><Send className="h-4 w-4 mr-2" />Send</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
