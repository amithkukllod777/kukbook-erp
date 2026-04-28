import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, UserPlus, LogIn } from "lucide-react";
import { useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function AcceptInvite() {
  const [, params] = useRoute("/invite/:token");
  const token = params?.token || "";
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data: invite, isLoading } = trpc.invites.getByToken.useQuery(
    { token },
    { enabled: !!token }
  );
  const acceptMut = trpc.invites.accept.useMutation({
    onSuccess: () => {
      toast.success("You've joined the company! Redirecting...");
      setTimeout(() => { window.location.href = "/"; }, 1500);
    },
    onError: (err) => toast.error(err.message || "Failed to accept invite"),
  });

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground animate-pulse mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground">This invite link is invalid, expired, or has already been used.</p>
            <Button variant="outline" className="mt-6" onClick={() => window.location.href = "/"}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invite.status !== "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            {invite.status === "accepted" ? (
              <>
                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Already Accepted</h2>
                <p className="text-muted-foreground">This invitation has already been accepted.</p>
              </>
            ) : (
              <>
                <XCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Invitation {invite.status}</h2>
                <p className="text-muted-foreground">This invitation is no longer valid.</p>
              </>
            )}
            <Button variant="outline" className="mt-6" onClick={() => window.location.href = "/"}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if invite has expired
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-amber-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invitation Expired</h2>
            <p className="text-muted-foreground">This invitation has expired. Please ask the company admin to send a new one.</p>
            <Button variant="outline" className="mt-6" onClick={() => window.location.href = "/"}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not logged in — show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <UserPlus className="h-12 w-12 mx-auto text-primary mb-2" />
            <CardTitle>You're Invited!</CardTitle>
            <CardDescription>You've been invited to join a company on KukBook as <Badge variant="outline" className="capitalize ml-1">{invite.role}</Badge></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Invited email:</p>
              <p className="font-medium">{invite.email}</p>
            </div>
            <p className="text-sm text-muted-foreground text-center">Please sign in or create an account to accept this invitation.</p>
            <Button className="w-full" onClick={() => { window.location.href = getLoginUrl(`/invite/${token}`); }}>
              <LogIn className="h-4 w-4 mr-2" />Sign In to Accept
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged in — show accept button
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <UserPlus className="h-12 w-12 mx-auto text-primary mb-2" />
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>You've been invited to join a company on KukBook</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Role:</span>
              <Badge variant="outline" className="capitalize">{invite.role}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invited email:</span>
              <span className="font-medium">{invite.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your account:</span>
              <span className="font-medium">{user?.email || user?.name}</span>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => acceptMut.mutate({ token })}
            disabled={acceptMut.isPending}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {acceptMut.isPending ? "Joining..." : "Accept & Join Company"}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.location.href = "/"}>
            Decline
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
