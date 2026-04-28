import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Users } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const utils = trpc.useUtils();
  const { data: users = [], isLoading, error } = trpc.admin.users.useQuery(undefined, { retry: false });
  const updateRoleMut = trpc.admin.updateRole.useMutation({ onSuccess: () => { utils.admin.users.invalidate(); toast.success("Role updated"); } });

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-1">Only administrators can access user management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">User Management</h1><p className="text-sm text-muted-foreground mt-1">Manage user roles and access</p></div>
        <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" />{users.length} users</Badge>
      </div>
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Login Method</TableHead><TableHead>Role</TableHead><TableHead>Last Sign In</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : users.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
              : users.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email || "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{u.loginMethod || "oauth"}</Badge></TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={(v: "admin" | "user") => { if (u.id === currentUser?.id) { toast.error("Cannot change your own role"); return; } updateRoleMut.mutate({ userId: u.id, role: v }); }}>
                      <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="user">Staff</SelectItem></SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
