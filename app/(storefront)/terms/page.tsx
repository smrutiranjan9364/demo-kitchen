import { routeMetadata, seoPage } from "@/lib/seo";
import { PageJsonLd } from "@/components/seo/JsonLd";
import LegalPage from "@/components/legal/LegalPage";

// Server-rendered on every request so it can reflect live data / settings.
export const dynamic = "force-dynamic";

export const metadata = routeMetadata("/terms");

export default function TermsPage() {
  return (
    <>
      <PageJsonLd page={seoPage("/terms")} />
    <LegalPage
      title="Terms & Conditions"
      updated="1 September 2026"
      intro="Welcome to Odia Kitchen. By accessing our website and placing an order, you agree to the following terms. Please read them carefully."
      sections={[
        {
          heading: "Use of our website",
          body: [
            "You may browse and shop on our website for personal, non-commercial use. You agree not to misuse the site, attempt unauthorised access, or disrupt its normal operation.",
            "All content, including images, text and branding, is owned by Odia Kitchen and may not be reproduced without written permission.",
          ],
        },
        {
          heading: "Orders & pricing",
          body: [
            "All prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to change prices at any time.",
            "Placing an order constitutes an offer to purchase. We may accept or decline any order, for example if an item is out of stock or a pricing error occurs.",
          ],
        },
        {
          heading: "Payments",
          body: [
            "We accept the payment methods shown at checkout. You confirm that any payment information you provide is accurate and that you are authorised to use it.",
          ],
        },
        {
          heading: "Delivery",
          body: [
            "We aim to dispatch orders promptly and deliver within the estimated timeframe. Delivery times are estimates and may vary due to factors beyond our control.",
            "Free delivery applies on eligible orders above ₹500 as indicated at checkout.",
          ],
        },
        {
          heading: "Food quality & allergens",
          body: [
            "Our products are prepared with traditional care. As many items are hand-made in shared kitchens, they may contain or come into contact with common allergens such as nuts, dairy and gluten.",
            "Please review product descriptions and reach out if you have specific dietary concerns.",
          ],
        },
        {
          heading: "Limitation of liability",
          body: [
            "To the extent permitted by law, Odia Kitchen is not liable for any indirect or consequential loss arising from the use of our products or website.",
          ],
        },
        {
          heading: "Changes to these terms",
          body: [
            "We may update these terms from time to time. Continued use of the website after changes are posted constitutes acceptance of the revised terms.",
          ],
        },
      ]}
    />
    </>
  );
}
