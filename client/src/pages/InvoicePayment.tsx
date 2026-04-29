import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, IndianRupee, FileText, Loader2 } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface InvoiceData {
  invoice: {
    id: number;
    invoiceId: string;
    customerName: string;
    date: string;
    dueDate: string;
    total: string;
    paidAmount: string;
    dueAmount: string;
    status: string;
  };
  companyName: string;
  razorpayKeyId: string | null;
  paymentEnabled: boolean;
}

export default function InvoicePayment() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/invoice-pay/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load invoice"))
      .finally(() => setLoading(false));
  }, [token]);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async () => {
    if (!data || !token) return;
    setPaymentStatus("processing");

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setPaymentStatus("failed");
      setError("Failed to load payment gateway");
      return;
    }

    try {
      const res = await fetch(`/api/invoice-pay/${token}/create-order`, { method: "POST" });
      const order = await res.json();
      if (order.error) {
        setPaymentStatus("failed");
        setError(order.error);
        return;
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: data.companyName,
        description: `Payment for Invoice #${data.invoice.invoiceId}`,
        order_id: order.orderId,
        handler: async (response: any) => {
          // Verify payment
          const verifyRes = await fetch(`/api/invoice-pay/${token}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            setPaymentStatus("success");
          } else {
            setPaymentStatus("failed");
            setError(result.error || "Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => setPaymentStatus("idle"),
        },
        prefill: {
          name: data.invoice.customerName,
        },
        theme: {
          color: "#1e40af",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setPaymentStatus("failed");
        setError("Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err: any) {
      setPaymentStatus("failed");
      setError(err.message || "Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-700">Error</h2>
            <p className="text-muted-foreground mt-2">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { invoice, companyName, paymentEnabled } = data;
  const dueAmount = Number(invoice.dueAmount) > 0 ? Number(invoice.dueAmount) : Number(invoice.total);
  const isPaid = invoice.status === "Paid" || paymentStatus === "success";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardHeader className="text-center border-b pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-xl">{companyName}</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">Invoice Payment</p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Invoice Details */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Invoice #</span>
              <span className="font-mono font-medium">{invoice.invoiceId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Customer</span>
              <span className="font-medium">{invoice.customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Invoice Date</span>
              <span>{invoice.date}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Due Date</span>
              <span className="text-orange-600 font-medium">{invoice.dueDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="font-semibold">₹{Number(invoice.total).toLocaleString("en-IN")}</span>
            </div>
            {Number(invoice.paidAmount) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Already Paid</span>
                <span className="text-green-600">₹{Number(invoice.paidAmount).toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-semibold">Amount Due</span>
              <span className="text-2xl font-bold text-blue-700 flex items-center gap-1">
                <IndianRupee className="h-5 w-5" />
                {dueAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="flex justify-center">
            {isPaid ? (
              <Badge className="bg-green-100 text-green-800 text-base px-4 py-2">
                <CheckCircle className="h-5 w-5 mr-2" />
                Payment Successful
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600 border-orange-300 text-base px-4 py-2">
                Payment Pending
              </Badge>
            )}
          </div>

          {/* Pay Button */}
          {!isPaid && (
            <div className="space-y-3">
              {paymentEnabled ? (
                <Button
                  onClick={handlePay}
                  disabled={paymentStatus === "processing"}
                  className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                >
                  {paymentStatus === "processing" ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <IndianRupee className="h-5 w-5 mr-2" />
                      Pay ₹{dueAmount.toLocaleString("en-IN")}
                    </>
                  )}
                </Button>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Online payment is not configured for this business. Please contact them directly.
                </p>
              )}

              {paymentStatus === "failed" && error && (
                <p className="text-center text-sm text-red-600">{error}</p>
              )}

              <p className="text-center text-xs text-muted-foreground">
                Secured by Razorpay. Your payment details are encrypted.
              </p>
            </div>
          )}

          {isPaid && paymentStatus === "success" && (
            <p className="text-center text-sm text-green-700">
              Thank you! Your payment has been received and the invoice is marked as paid.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
