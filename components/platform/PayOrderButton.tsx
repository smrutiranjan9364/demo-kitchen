"use client";
import { useState } from "react";
import { Button, Notice, requestApi } from "./UI";
type Result = { razorpay_payment_id: string; razorpay_signature: string };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (name: string, handler: () => void) => void;
    };
  }
}
let checkoutScript: Promise<void> | null = null;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!checkoutScript)
    checkoutScript = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => {
        checkoutScript = null;
        script.remove();
        reject(
          new Error(
            "Payment checkout could not load. Check your connection and try again.",
          ),
        );
      };
      document.head.appendChild(script);
    });
  return checkoutScript;
}
export default function PayOrderButton({
  id,
  token,
}: {
  id: string;
  token?: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function pay() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await requestApi("/api/payments", { orderId: id, token });
      if (data.paid) {
        setMessage("Payment already confirmed.");
        setBusy(false);
        return;
      }
      await loadCheckout();
      if (!window.Razorpay) throw new Error("Payment checkout unavailable.");
      const checkout = new window.Razorpay({
        key: data.key,
        order_id: data.orderId,
        amount: data.amount,
        currency: data.currency,
        name: "Odia Kitchen",
        prefill: { name: data.name, email: data.email, contact: data.phone },
        handler: async (result: Result) => {
          try {
            const verified = await requestApi("/api/payments", {
              action: "verify",
              orderId: id,
              token,
              paymentId: result.razorpay_payment_id,
              signature: result.razorpay_signature,
            });
            setMessage(
              verified.paid
                ? "Payment confirmed. Your order will update shortly."
                : "Payment is pending confirmation. Please do not pay again while it is processing.",
            );
          } catch (e) {
            setError(
              (e as Error).message +
                " If money was deducted, wait for the order status to update before retrying.",
            );
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setMessage("Payment window closed. You can retry from this order.");
          },
        },
      });
      checkout.on("payment.failed", () => {
        setBusy(false);
        setError(
          "Payment failed. Please check the payment status before trying again.",
        );
      });
      checkout.open();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="mt-4">
      <Button disabled={busy} onClick={() => void pay()}>
        {busy ? "Opening payment…" : "Pay online / Retry payment"}
      </Button>
      <Notice error={error} />
      {message ? (
        <p role="status" className="mt-2 text-sm text-gray-600">
          {message}
        </p>
      ) : null}
    </div>
  );
}
