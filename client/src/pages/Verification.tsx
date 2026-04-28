import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, ShieldCheck, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Verification() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Load persisted verification status from DB
  const { data: verStatus, isLoading: statusLoading } = trpc.verification.status.useQuery();

  const [emailTarget, setEmailTarget] = useState(user?.email || "");
  const [phoneTarget, setPhoneTarget] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [phoneSent, setPhoneSent] = useState(false);
  const [emailTestCode, setEmailTestCode] = useState("");
  const [phoneTestCode, setPhoneTestCode] = useState("");

  // Derive verified state from persisted backend data
  const emailVerified = verStatus?.emailVerified || false;
  const phoneVerified = verStatus?.phoneVerified || false;

  // Pre-fill targets from persisted data
  useEffect(() => {
    if (verStatus?.email && emailVerified) setEmailTarget(verStatus.email);
    if (verStatus?.phone && phoneVerified) setPhoneTarget(verStatus.phone);
  }, [verStatus, emailVerified, phoneVerified]);

  const sendCodeMut = trpc.verification.sendCode.useMutation({
    onSuccess: (data, variables) => {
      if (variables.type === "email") {
        setEmailSent(true);
        if (data.code) setEmailTestCode(data.code);
        toast.success("Verification code sent to your email");
      } else {
        setPhoneSent(true);
        if (data.code) setPhoneTestCode(data.code);
        toast.success("Verification code sent to your phone");
      }
    },
    onError: (err) => toast.error(err.message || "Failed to send code"),
  });

  const verifyMut = trpc.verification.verify.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate the status query to reload from DB
        utils.verification.status.invalidate();
        toast.success("Verified successfully!");
        setEmailCode("");
        setPhoneCode("");
        setEmailTestCode("");
        setPhoneTestCode("");
        setEmailSent(false);
        setPhoneSent(false);
      } else {
        toast.error(data.error || "Verification failed");
      }
    },
    onError: (err) => toast.error(err.message || "Verification failed. Please check the code."),
  });

  const handleSendEmail = () => {
    if (!emailTarget) { toast.error("Enter your email address"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTarget)) { toast.error("Invalid email format"); return; }
    sendCodeMut.mutate({ type: "email", target: emailTarget });
  };

  const handleSendPhone = () => {
    if (!phoneTarget) { toast.error("Enter your phone number"); return; }
    if (!/^\+?[0-9]{10,13}$/.test(phoneTarget.replace(/\s/g, ""))) { toast.error("Invalid phone number (10-13 digits)"); return; }
    sendCodeMut.mutate({ type: "phone", target: phoneTarget });
  };

  const handleVerifyEmail = () => {
    if (!emailCode || emailCode.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    verifyMut.mutate({ target: emailTarget, code: emailCode });
  };

  const handleVerifyPhone = () => {
    if (!phoneCode || phoneCode.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    verifyMut.mutate({ target: phoneTarget, code: phoneCode });
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verification</h1>
        <p className="text-sm text-muted-foreground mt-1">Verify your email and phone number for account security</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className={emailVerified ? "border-emerald-200 bg-emerald-50/50" : ""}>
          <CardContent className="py-3 flex items-center gap-3">
            <Mail className={`h-5 w-5 ${emailVerified ? "text-emerald-600" : "text-muted-foreground"}`} />
            <div className="flex-1">
              <p className="text-sm font-medium">{emailVerified ? "Email Verified" : "Email Not Verified"}</p>
              {emailVerified && verStatus?.email && <p className="text-xs text-muted-foreground">{verStatus.email}</p>}
            </div>
            {emailVerified ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>
            )}
          </CardContent>
        </Card>
        <Card className={phoneVerified ? "border-emerald-200 bg-emerald-50/50" : ""}>
          <CardContent className="py-3 flex items-center gap-3">
            <Phone className={`h-5 w-5 ${phoneVerified ? "text-emerald-600" : "text-muted-foreground"}`} />
            <div className="flex-1">
              <p className="text-sm font-medium">{phoneVerified ? "Phone Verified" : "Phone Not Verified"}</p>
              {phoneVerified && verStatus?.phone && <p className="text-xs text-muted-foreground">{verStatus.phone}</p>}
            </div>
            {phoneVerified ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" />Email Verification
              {emailVerified && <Badge className="bg-emerald-100 text-emerald-800 ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>}
            </CardTitle>
            <CardDescription>Verify your email address to receive invoices and notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!emailVerified ? (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email Address</label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={emailTarget}
                      onChange={e => { setEmailTarget(e.target.value); setEmailSent(false); }}
                      disabled={emailSent}
                    />
                    <Button
                      variant={emailSent ? "outline" : "default"}
                      onClick={handleSendEmail}
                      disabled={sendCodeMut.isPending}
                    >
                      <Send className="h-4 w-4 mr-1" />{emailSent ? "Resend" : "Send Code"}
                    </Button>
                  </div>
                </div>

                {emailSent && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Enter 6-digit Code</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="000000"
                          value={emailCode}
                          onChange={e => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          maxLength={6}
                          className="font-mono text-center text-lg tracking-widest"
                        />
                        <Button onClick={handleVerifyEmail} disabled={verifyMut.isPending}>
                          <ShieldCheck className="h-4 w-4 mr-1" />Verify
                        </Button>
                      </div>
                    </div>

                    {emailTestCode && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-800">Test Mode</p>
                            <p className="text-xs text-amber-600">In production, this code will be sent via email. For testing, your code is:</p>
                            <p className="font-mono text-lg font-bold text-amber-900 mt-1">{emailTestCode}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                <p className="font-medium">{verStatus?.email || emailTarget}</p>
                <p className="text-sm text-muted-foreground">Email verified successfully</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Phone Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5" />Phone Verification
              {phoneVerified && <Badge className="bg-emerald-100 text-emerald-800 ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>}
            </CardTitle>
            <CardDescription>Verify your phone number for SMS alerts and WhatsApp notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!phoneVerified ? (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone Number</label>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={phoneTarget}
                      onChange={e => { setPhoneTarget(e.target.value); setPhoneSent(false); }}
                      disabled={phoneSent}
                    />
                    <Button
                      variant={phoneSent ? "outline" : "default"}
                      onClick={handleSendPhone}
                      disabled={sendCodeMut.isPending}
                    >
                      <Send className="h-4 w-4 mr-1" />{phoneSent ? "Resend" : "Send Code"}
                    </Button>
                  </div>
                </div>

                {phoneSent && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Enter 6-digit Code</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="000000"
                          value={phoneCode}
                          onChange={e => setPhoneCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          maxLength={6}
                          className="font-mono text-center text-lg tracking-widest"
                        />
                        <Button onClick={handleVerifyPhone} disabled={verifyMut.isPending}>
                          <ShieldCheck className="h-4 w-4 mr-1" />Verify
                        </Button>
                      </div>
                    </div>

                    {phoneTestCode && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-800">Test Mode</p>
                            <p className="text-xs text-amber-600">In production, this code will be sent via SMS. For testing, your code is:</p>
                            <p className="font-mono text-lg font-bold text-amber-900 mt-1">{phoneTestCode}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                <p className="font-medium">{verStatus?.phone || phoneTarget}</p>
                <p className="text-sm text-muted-foreground">Phone verified successfully</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium text-sm">Why verify?</h3>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                <li>• Receive invoice copies and payment confirmations via email</li>
                <li>• Get SMS/WhatsApp alerts for payment reminders and due dates</li>
                <li>• Enhanced account security with verified contact details</li>
                <li>• Required for sending invoices to customers via email</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
