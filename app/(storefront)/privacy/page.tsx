import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

// Server-rendered on every request so it can reflect live data / settings.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy — Odia Kitchen",
  description: "How Odia Kitchen collects, uses and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="1 September 2026"
      intro="Your privacy matters to us. This policy explains what information we collect, how we use it, and the choices you have."
      sections={[
        {
          heading: "Information we collect",
          body: [
            "We collect information you provide directly — such as your name, email, phone number and delivery address when you place an order or contact us.",
            "We also collect limited technical data automatically, such as your device and browsing activity, to help our website work and improve.",
          ],
        },
        {
          heading: "How we use your information",
          body: [
            "To process and deliver your orders, communicate with you, provide support, and send updates you have opted into.",
            "To improve our products, website experience and customer service.",
          ],
        },
        {
          heading: "Sharing your information",
          body: [
            "We do not sell your personal data. We share it only with trusted partners who help us operate — such as delivery and payment providers — and only as needed to fulfil your order.",
            "We may disclose information if required by law.",
          ],
        },
        {
          heading: "Cookies",
          body: [
            "We use cookies and similar technologies to remember your preferences and understand how the site is used. You can control cookies through your browser settings.",
          ],
        },
        {
          heading: "Data security",
          body: [
            "We take reasonable measures to protect your information. However, no method of transmission over the internet is completely secure.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "You may request access to, correction of, or deletion of your personal data. To do so, contact us using the details on our contact page.",
          ],
        },
        {
          heading: "Changes to this policy",
          body: [
            "We may update this policy from time to time. The latest version will always be available on this page.",
          ],
        },
      ]}
    />
  );
}
