import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Return & Refund Policy — Rosy's Kitchen",
  description: "Our return, replacement and refund policy at Rosy's Kitchen.",
};

export default function ReturnsPage() {
  return (
    <LegalPage
      title="Return & Refund Policy"
      updated="1 September 2026"
      intro="Your satisfaction matters to us. Because we sell fresh and perishable food items, our return policy is designed to be fair to both you and our kitchen. Please read the details below."
      sections={[
        {
          heading: "Perishable items",
          body: [
            "As most of our products are freshly prepared food, we are generally unable to accept returns once an order has been delivered, for hygiene and safety reasons.",
            "However, we stand behind our quality — if something is wrong with your order, we will make it right.",
          ],
        },
        {
          heading: "When you can request a replacement or refund",
          body: [
            "You are eligible if: the item arrived damaged or spoiled, you received the wrong item, or the product was defective or past its usability.",
            "Requests must be raised within 24 hours of delivery, along with your order number and a clear photo of the issue.",
          ],
        },
        {
          heading: "How to raise a request",
          body: [
            "Contact us via the contact page, email or phone with your order details. Our team will review the request and respond within 1–2 working days.",
            "If approved, we will offer a replacement or a refund to your original payment method.",
          ],
        },
        {
          heading: "Refund timeline",
          body: [
            "Approved refunds are processed within 5–7 working days. The time it takes to appear in your account depends on your bank or payment provider.",
          ],
        },
        {
          heading: "Order cancellation",
          body: [
            "Orders can be cancelled before they are dispatched. Once an order is packed or shipped, it can no longer be cancelled.",
            "For prepaid orders cancelled in time, a full refund will be issued.",
          ],
        },
        {
          heading: "Non-returnable situations",
          body: [
            "We cannot offer returns or refunds for issues caused by incorrect address details, unavailability at the time of delivery, or change of mind after a perishable item has been delivered.",
          ],
        },
      ]}
    />
  );
}
