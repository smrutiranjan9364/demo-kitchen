import type { MetadataRoute } from "next";
import { absoluteUrl, getSeoConfig } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (!getSeoConfig().indexable) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    // Keep noindex HTML crawlable so bots can see its directives. Authentication
    // protects admin data; robots.txt is not an access control mechanism.
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
