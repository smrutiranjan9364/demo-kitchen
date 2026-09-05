import { CONTACT } from "@/data/site";
import { productDescription, type Product } from "@/data/products";
import { absoluteUrl, imageUrl, SITE_NAME, type SeoPage } from "@/lib/seo";

type Entity = Record<string, unknown>;
export type Breadcrumb = { name: string; path: string };

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: Entity | Entity[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

export function SiteJsonLd() {
  const url = absoluteUrl("/");
  if (!url) return null;
  return <JsonLd data={{
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${url}#organization`, name: SITE_NAME, url, logo: absoluteUrl("/logo.png"), email: CONTACT.email, telephone: CONTACT.phone },
      { "@type": "WebSite", "@id": `${url}#website`, name: SITE_NAME, url, inLanguage: "en-IN", publisher: { "@id": `${url}#organization` } },
    ],
  }} />;
}

export function PageJsonLd({ page, breadcrumbs, product }: { page: SeoPage; breadcrumbs?: Breadcrumb[]; product?: Product }) {
  const url = absoluteUrl(page.path);
  const home = absoluteUrl("/");
  if (!url || !home || page.noindex) return null;
  const crumbs = breadcrumbs || (page.breadcrumb ? [{ name: "Home", path: "/" }, { name: page.breadcrumb, path: page.path }] : []);
  const graph: Entity[] = [{
    "@type": page.type || "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: page.title,
    description: page.description,
    inLanguage: "en-IN",
    isPartOf: { "@id": `${home}#website` },
    ...(crumbs.length > 1 ? { breadcrumb: { "@id": `${url}#breadcrumb` } } : {}),
    ...(product ? { mainEntity: { "@id": `${url}#product` } } : {}),
  }];
  if (crumbs.length > 1) graph.push({
    "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: absoluteUrl(crumb.path) })),
  });
  if (product) graph.push({
    "@type": "Product", "@id": `${url}#product`, name: product.name, url,
    description: productDescription(product),
    ...(imageUrl(product.image) ? { image: [imageUrl(product.image)] } : {}),
    // There is no inventory field and the existing ratings/reviews are demo data.
    // Only the actual displayed price is represented; no availability or ratings are inferred.
    ...(Number.isFinite(product.price) && product.price >= 0 ? { offers: {
      "@type": "Offer", url, priceCurrency: "INR", price: product.price.toFixed(2), seller: { "@id": `${home}#organization` },
    } } : {}),
  });
  return <JsonLd data={{ "@context": "https://schema.org", "@graph": graph }} />;
}
