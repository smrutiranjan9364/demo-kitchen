import type { Metadata } from "next";

export const SITE_NAME = "Odia Kitchen";
export const SITE_DESCRIPTION =
  "Explore Odia snacks, sweets, spices, pitha and festival foods at Odia Kitchen. Browse traditional Odisha flavours and find your favourites.";

// An explicit origin prevents Next.js from guessing a localhost or preview URL.
// No domain is invented for an application that has not been deployed yet.
export function getSeoConfig(env: NodeJS.ProcessEnv = process.env) {
  const value = env.SITE_URL?.trim();
  let siteUrl: string | undefined;
  if (value) {
    const url = new URL(value);
    if (
      url.protocol !== "https:" || url.username || url.password || url.port ||
      url.pathname !== "/" || url.search || url.hash ||
      !url.hostname.includes(".") ||
      /(^|\.)(localhost|local|test|invalid|staging|preview)(\.|$)/i.test(url.hostname) ||
      /^[\d.]+$/.test(url.hostname) || url.hostname.includes(":")
    ) {
      throw new Error("SITE_URL must be the public canonical HTTPS origin, without a path, port, credentials, query or fragment.");
    }
    siteUrl = url.origin;
  }
  if (env.SEO_INDEXABLE === "true" && !siteUrl) {
    throw new Error("Set SITE_URL to your production HTTPS origin before enabling SEO_INDEXABLE.");
  }
  return {
    siteUrl,
    indexable: Boolean(siteUrl) && env.SEO_INDEXABLE === "true" &&
      env.NODE_ENV === "production" &&
      (!env.VERCEL_ENV || env.VERCEL_ENV === "production") &&
      (!env.CONTEXT || env.CONTEXT === "production"),
  };
}

export function absoluteUrl(path: string): string | undefined {
  const { siteUrl } = getSeoConfig();
  if (!siteUrl) return undefined;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    throw new Error("SEO page paths must be root-relative.");
  }
  const url = new URL(path, siteUrl);
  if (url.origin !== siteUrl) throw new Error("SEO URLs must use the configured site origin.");
  return url.href;
}

export function imageUrl(image?: string): string | undefined {
  if (!image) return undefined;
  if (image.startsWith("/") && !image.startsWith("//")) return absoluteUrl(image);
  try {
    const url = new URL(image);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export type SeoPage = {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  canonical?: boolean;
  image?: string;
  imageAlt?: string;
  type?: "WebPage" | "CollectionPage" | "AboutPage" | "ContactPage";
  breadcrumb?: string;
};

export const SEO_PAGES = {
  "/": { title: "Odia Snacks, Sweets & Traditional Odisha Food", description: SITE_DESCRIPTION },
  "/shop": { title: "Shop Odia Food, Snacks, Sweets & Spices", description: "Browse the Odia Kitchen food collection. Explore snacks, sweets, spices, pitha and pantry favourites, with category filters to help you choose.", type: "CollectionPage", breadcrumb: "Shop" },
  "/categories": { title: "Odia Food Categories", description: "Explore Odia Kitchen by category, from snacks and sweets to pitha, spices, pickles and gift hampers. Find your favourite traditional Odisha foods.", type: "CollectionPage", breadcrumb: "Categories" },
  "/festival": { title: "Odisha Festival Food & Pitha Menu", description: "Explore the Odia Kitchen festival menu, with traditional delicacies for Odisha celebrations. Browse festive foods and find options for your gathering.", type: "CollectionPage", breadcrumb: "Festival" },
  "/deals": { title: "Odia Food Deals & Combo Offers", description: "Browse Odia Kitchen offers on snack combos, spice sets and festive boxes. Compare current prices and explore the full food collection.", type: "CollectionPage", breadcrumb: "Deals" },
  "/about": { title: "About Our Odisha Food Kitchen", description: "Read the story of Odia Kitchen, its traditional recipes and its approach to preparing Odia food. Discover the people and values behind the kitchen.", type: "AboutPage", breadcrumb: "About Us" },
  "/contact": { title: "Contact Odia Kitchen", description: "Contact Odia Kitchen with product questions, order enquiries and feedback. Find our email, phone number, opening hours and contact form.", type: "ContactPage", breadcrumb: "Contact" },
  "/terms": { title: "Terms & Conditions", description: "Read Odia Kitchen's terms for using the website, placing orders, pricing, payments, delivery and food allergens.", breadcrumb: "Terms & Conditions" },
  "/privacy": { title: "Privacy Policy", description: "Learn how Odia Kitchen collects, uses and protects your personal information, including order details, payments and website data.", breadcrumb: "Privacy Policy" },
  "/returns": { title: "Return & Refund Policy", description: "Read Odia Kitchen's policy for returns, replacements and refunds. Learn how to report an issue with your food order and contact the team.", breadcrumb: "Return & Refund Policy" },
  "/cart": { title: "Your Shopping Cart", description: "Review the items in your Odia Kitchen shopping cart before checkout.", noindex: true, canonical: false },
  "/checkout": { title: "Checkout", description: "Complete your Odia Kitchen order and enter your delivery details.", noindex: true, canonical: false },
  "/account": { title: "Your Account", description: "Your Odia Kitchen orders and details.", noindex: true, canonical: false },
  "/offline": { title: "You're Offline", description: "Reconnect to continue browsing Odia Kitchen.", noindex: true, canonical: false },
  "/backend": { title: "Admin Login", description: "Sign in to manage Odia Kitchen.", noindex: true, canonical: false },
} satisfies Record<string, Omit<SeoPage, "path">>;

export type StaticSeoPath = keyof typeof SEO_PAGES;

export function seoPage(path: StaticSeoPath): SeoPage {
  return { ...SEO_PAGES[path], path };
}

export function createMetadata(page: SeoPage): Metadata {
  const { siteUrl, indexable } = getSeoConfig();
  const title = page.title.includes(SITE_NAME) ? page.title : `${page.title} | ${SITE_NAME}`;
  const description = page.description.replace(/\s+/g, " ").trim();
  const url = absoluteUrl(page.path);
  const customImage = imageUrl(page.image);
  const image = customImage || absoluteUrl("/social-image");
  return {
    title: { absolute: title },
    description,
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    alternates: { canonical: page.canonical === false ? null : url ?? null },
    robots: {
      index: indexable && !page.noindex,
      follow: true,
      ...(indexable && !page.noindex ? { "max-image-preview": "large" as const } : {}),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_IN",
      images: image ? [{ url: image, alt: page.imageAlt || SITE_NAME, ...(!customImage ? { width: 1200, height: 630 } : {}) }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [{ url: image, alt: page.imageAlt || SITE_NAME }] : [],
    },
  };
}

export function routeMetadata(path: StaticSeoPath): Metadata {
  return createMetadata(seoPage(path));
}

export const SEARCH_PARAMETERS = new Set(["q", "query", "search", "sort", "filter", "category", "page"]);

export function isSearchVariant(params: Record<string, string | string[] | undefined>): boolean {
  return Object.keys(params).some((key) => SEARCH_PARAMETERS.has(key.toLowerCase()));
}
