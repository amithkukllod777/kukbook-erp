import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Copy, X, Mail, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function InviteMembers() {
  const utils = trpc.useUtils();
  const { data: invites = [], isLoading } = trpc.invites.list.useQuery();
  const createMut = trpc.invites.create.useMutation({
    onSuccess: (data: any) => {
      utils.invites.list.invalidate();
      toast.success("Invite sent! Share the link with the team member.");
      setEmail("");
      setRole("staff");
      if (data?.invite?.token) {
        const link = `${window.location.origin}/invite/${data.invite.token}`;
        setLastInviteLink(link);
      }
    },
    onError: (err) => toast.error(err.message || "Failed to create invite"),
  });
  const cancelMut = trpc.invites.cancel.useMutation({
    onSuccess: () => { utils.invites.list.invalidate(); toast.success("Invite cancelled"); },
  });

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [lastInviteLink, setLastInviteLink] = useState("");

  const handleInvite = () => {
    if (!email) { toast.error("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Invalid email format"); return; }
    createMut.mutate({ email, role: role as "admin" | "staff" | "viewer" });
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied to clipboard!");
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4 text-amber-500" />;
      case "accepted": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "cancelled": return <XCircle className="h-4 w-4 text-red-500" />;
      case "expired": return <XCircle className="h-4 w-4 text-gray-400" />;
      default: return null;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-100 text-amber-800";
      case "accepted": return "bg-emerald-100 text-emerald-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "expired": return "bg-gray-100 text-gray-600";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invite Team Members</h1>
        <p className="text-sm text-muted-foreground mt-1">Invite people to join your company on KukBook</p>
      </div>

      {/* Invite Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><UserPlus className="h-5 w-5" />Send Invitation</CardTitle>
          <CardDescription>Enter the email address of the person you want to invite. They'll receive a link to join your company.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Email Address</label>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleInvite()}
              />
            </div>
            <div className="w-[140px]">
              <label className="text-sm font-medium mb-1 block">Role</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleInvite} disabled={createMut.isPending}>
              <Mail className="h-4 w-4 mr-2" />{createMut.isPending ? "Sending..." : "Send Invite"}
            </Button>
          </div>

          {lastInviteLink && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm font-medium text-emerald-800 mb-2">Invite link generated! Share this with the team member:</p>
              <div className="flex gap-2">
                <Input value={lastInviteLink} readOnly className="text-sm font-mono bg-white" />
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(lastInviteLink); toast.success("Copied!"); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">This link expires in 7 days. The recipient must have a KukBook account to accept.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Invitation History</CardTitle>
          <CardDescription>Track all invitations sent from your company</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : invites.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No invitations sent yet</TableCell></TableRow>
              ) : (
                invites.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{inv.role}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {statusIcon(inv.status)}
                        <Badge variant="secondary" className={statusColor(inv.status)}>{inv.status}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("en-IN") : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString("en-IN") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {inv.status === "pending" && (
                          <>
                            <Button variant="ghost" size="icon" title="Copy invite link" onClick={() => copyLink(inv.token)}>
                              <Copy className="h-4 w-4 text-primary" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Cancel invite" onClick={() => cancelMut.mutate({ id: inv.id })}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Role Permissions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-sm mb-2">Admin</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Full access to all modules</li>
                <li>• Manage team members</li>
                <li>• Company settings & billing</li>
                <li>• Delete records</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-sm mb-2">Staff</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Create invoices, bills, entries</li>
                <li>• View all reports</li>
                <li>• Manage customers & vendors</li>
                <li>• Cannot delete company data</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-sm mb-2">Viewer</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• View-only access to reports</li>
                <li>• View invoices & bills</li>
                <li>• Cannot create or edit</li>
                <li>• Ideal for auditors/CAs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
