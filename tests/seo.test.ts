import assert from "node:assert/strict";
import test from "node:test";
import type { ReactElement } from "react";
import {
  absoluteUrl,
  createMetadata,
  getSeoConfig,
  imageUrl,
  isSearchVariant,
  routeMetadata,
  SEO_PAGES,
  seoPage,
  SITE_NAME,
  type StaticSeoPath,
} from "@/lib/seo";
import { categorySeo, districtSeo, productSeo } from "@/lib/catalog-seo";
import { JsonLd, PageJsonLd, serializeJsonLd, SiteJsonLd } from "@/components/seo/JsonLd";
import { ALL_PRODUCTS, BEST_SELLERS, TOP_DEALS, type Product } from "@/data/products";
import { getFeaturedProducts, getProductPageData, getPublicProducts } from "@/lib/catalog";
import { getProduct } from "@/lib/store";
import sitemap from "@/app/sitemap";

const ORIGIN = "https://kitchen.example.com";
const production: NodeJS.ProcessEnv = {
  NODE_ENV: "production",
  SITE_URL: ORIGIN,
  SEO_INDEXABLE: "true",
};
const SEO_ENV_KEYS = ["SITE_URL", "SEO_INDEXABLE", "NODE_ENV", "VERCEL_ENV", "CONTEXT"];

// Tests run sequentially and restore the environment even when an assertion
// fails. No configured database credentials are read or used by these tests.
async function withEnvironment(env: NodeJS.ProcessEnv, run: () => void | Promise<void>) {
  const previous = SEO_ENV_KEYS.map((key) => [key, process.env[key]] as const);
  for (const key of SEO_ENV_KEYS) {
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key];
  }
  try {
    await run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("indexing requires an explicit production origin and opt-in", () => {
  assert.deepEqual(getSeoConfig({ NODE_ENV: "production" }), { siteUrl: undefined, indexable: false });
  assert.equal(getSeoConfig({ ...production, SEO_INDEXABLE: undefined }).indexable, false);
  assert.equal(getSeoConfig({ ...production, SEO_INDEXABLE: "false" }).indexable, false);
  assert.equal(getSeoConfig({ ...production, SEO_INDEXABLE: "TRUE" }).indexable, false);
  assert.equal(getSeoConfig(production).indexable, true);
  assert.equal(getSeoConfig({ ...production, SITE_URL: `  ${ORIGIN}/  ` }).siteUrl, ORIGIN);
  assert.throws(() => getSeoConfig({ NODE_ENV: "production", SEO_INDEXABLE: "true" }), /SITE_URL/);
});

test("development, test and provider preview deployments cannot opt into indexing", () => {
  for (const overrides of [
    { NODE_ENV: "development" }, { NODE_ENV: "test" },
    { VERCEL_ENV: "preview" }, { VERCEL_ENV: "development" },
    { CONTEXT: "deploy-preview" }, { CONTEXT: "branch-deploy" },
  ]) {
    assert.equal(getSeoConfig({ ...production, ...overrides } as NodeJS.ProcessEnv).indexable, false, JSON.stringify(overrides));
  }
  assert.equal(getSeoConfig({ ...production, VERCEL_ENV: "production", CONTEXT: "production" }).indexable, true);
});

test("invalid, private, preview and non-origin SITE_URL values are rejected", () => {
  for (const siteUrl of [
    "not a URL", "http://kitchen.example.com", "https://localhost", "https://app.localhost",
    "https://127.0.0.1", "https://[::1]", "https://app.local", "https://app.test", "https://app.invalid",
    "https://staging.example.com", "https://preview.example.com", "https://singlelabel",
    "https://user:password@kitchen.example.com", `${ORIGIN}:8443`, `${ORIGIN}/shop`,
    `${ORIGIN}?tracking=1`, `${ORIGIN}#fragment`,
  ]) {
    assert.throws(() => getSeoConfig({ ...production, SITE_URL: siteUrl }), siteUrl);
  }
});

test("absolute URLs keep page paths on the canonical origin", async () => {
  await withEnvironment(production, () => {
    assert.equal(absoluteUrl("/"), `${ORIGIN}/`);
    assert.equal(absoluteUrl("/product/chhena-poda"), `${ORIGIN}/product/chhena-poda`);
    for (const unsafe of ["shop", "https://external.example/path", "//external.example/path", "/\\external.example/path"]) {
      assert.throws(() => absoluteUrl(unsafe), unsafe);
    }
  });
});

test("unconfigured sites never emit a guessed localhost canonical or social URL", async () => {
  await withEnvironment({ NODE_ENV: "production" }, async () => {
    const metadata = routeMetadata("/");
    assert.equal(absoluteUrl("/"), undefined);
    assert.equal(metadata.metadataBase, undefined);
    assert.equal(metadata.alternates?.canonical, null);
    assert.equal((metadata.robots as { index: boolean }).index, false);
    assert.deepEqual(metadata.openGraph?.images, []);
    assert.equal(SiteJsonLd(), null);
    assert.equal(PageJsonLd({ page: seoPage("/") }), null);
    assert.deepEqual(await sitemap(), []);
    assert.doesNotMatch(JSON.stringify(metadata), /localhost|127\.0\.0\.1/);
  });
});

test("metadata includes matching canonical, Open Graph and Twitter fields", async () => {
  await withEnvironment(production, () => {
    const metadata = createMetadata({ path: "/shop", title: "Odia Food", description: "  Browse\n traditional   food. " });
    assert.deepEqual(metadata.title, { absolute: `Odia Food | ${SITE_NAME}` });
    assert.equal(metadata.description, "Browse traditional food.");
    assert.equal((metadata.metadataBase as URL | undefined)?.href, `${ORIGIN}/`);
    assert.equal(metadata.alternates?.canonical, `${ORIGIN}/shop`);
    assert.deepEqual(metadata.robots, { index: true, follow: true, "max-image-preview": "large" });
    assert.deepEqual(metadata.openGraph, {
      title: `Odia Food | ${SITE_NAME}`, description: "Browse traditional food.", url: `${ORIGIN}/shop`,
      siteName: SITE_NAME, type: "website", locale: "en_IN",
      images: [{ url: `${ORIGIN}/social-image`, alt: SITE_NAME, width: 1200, height: 630 }],
    });
    assert.deepEqual(metadata.twitter, {
      card: "summary_large_image", title: `Odia Food | ${SITE_NAME}`, description: "Browse traditional food.",
      images: [{ url: `${ORIGIN}/social-image`, alt: SITE_NAME }],
    });
  });
});

test("static routes have distinct titles and descriptions; utility pages are noindex", async () => {
  await withEnvironment(production, () => {
    const paths = Object.keys(SEO_PAGES) as StaticSeoPath[];
    const metadata = paths.map(routeMetadata);
    assert.equal(new Set(metadata.map((entry) => JSON.stringify(entry.title))).size, paths.length);
    assert.equal(new Set(metadata.map((entry) => entry.description)).size, paths.length);
    for (const path of ["/cart", "/checkout", "/offline", "/backend"] as const) {
      const entry = routeMetadata(path);
      assert.equal((entry.robots as { index: boolean }).index, false, path);
      assert.equal(entry.alternates?.canonical, null, path);
      assert.equal(PageJsonLd({ page: seoPage(path) }), null, path);
    }
  });
});

test("preview metadata and sitemap remain nonindexable with the production origin configured", async () => {
  await withEnvironment({ ...production, VERCEL_ENV: "preview" }, async () => {
    assert.equal((routeMetadata("/").robots as { index: boolean }).index, false);
    assert.equal(routeMetadata("/").alternates?.canonical, `${ORIGIN}/`);
    assert.deepEqual(await sitemap(), []);
  });
});

test("social images support HTTPS or local assets and reject unsafe URLs", async () => {
  await withEnvironment(production, () => {
    assert.equal(imageUrl("/logo.png"), `${ORIGIN}/logo.png`);
    assert.equal(imageUrl("https://images.example.com/food.jpg"), "https://images.example.com/food.jpg");
    for (const unsafe of ["http://images.example.com/food.jpg", "javascript:alert(1)", "data:image/png;base64,abc", "//images.example.com/a.jpg", "https://user:password@images.example.com/a.jpg", "invalid"]) {
      assert.equal(imageUrl(unsafe), undefined, unsafe);
    }
    const metadata = createMetadata({ ...seoPage("/shop"), image: "https://images.example.com/food.jpg", imageAlt: "A food collection" });
    assert.deepEqual(metadata.openGraph?.images, [{ url: "https://images.example.com/food.jpg", alt: "A food collection" }]);
  });
});

test("search and filter variants are flagged without noindexing campaign parameters", () => {
  for (const key of ["q", "query", "search", "sort", "filter", "category", "page", "SEARCH"]) {
    assert.equal(isSearchVariant({ [key]: "value" }), true, key);
  }
  assert.equal(isSearchVariant({ q: ["pitha", "sweets"] }), true);
  assert.equal(isSearchVariant({}), false);
  assert.equal(isSearchVariant({ utm_source: "newsletter", gclid: "campaign-id" }), false);
});

test("empty collections cannot enter the index and dynamic paths encode identifiers", () => {
  const category = { label: "Snacks", href: "/category/snacks", image: "/logo.png", count: 0 };
  assert.equal(categorySeo(category).noindex, true);
  assert.equal(categorySeo({ ...category, count: undefined }).noindex, true);
  assert.equal(categorySeo({ ...category, count: 2 }).noindex, false);
  const district = { slug: "puri", name: "Puri", sortOrder: 0 };
  assert.equal(districtSeo(district, 0).noindex, true);
  assert.equal(districtSeo(district, 1).noindex, false);
  assert.equal(productSeo({ ...BEST_SELLERS[0], id: "a/b?c#d" }).path, "/product/a%2Fb%3Fc%23d");
  assert.equal(districtSeo({ ...district, slug: "a/b" }, 1).path, "/district/a%2Fb");
});

type Graph = { "@graph": Array<Record<string, unknown>> };
function jsonLdData(element: ReactElement<{ data: Graph }> | null): Graph {
  assert.ok(element);
  return element.props.data;
}

test("JSON-LD serialization preserves data while preventing closing-script injection", () => {
  const payload = { name: '</script><script>alert("x")</script>', details: "Food < pitha & sweets" };
  const serialized = serializeJsonLd(payload);
  assert.doesNotMatch(serialized, /</);
  assert.deepEqual(JSON.parse(serialized), payload);
  const script = JsonLd({ data: payload });
  assert.equal(script.props.type, "application/ld+json");
  assert.equal(script.props.dangerouslySetInnerHTML.__html, serialized);
});

test("site schema identifies the visible brand without invented business attributes", async () => {
  await withEnvironment(production, () => {
    const graph = jsonLdData(SiteJsonLd());
    const organization = graph["@graph"].find((entity) => entity["@type"] === "Organization")!;
    const website = graph["@graph"].find((entity) => entity["@type"] === "WebSite")!;
    assert.equal(organization.name, SITE_NAME);
    assert.equal(organization.url, `${ORIGIN}/`);
    assert.equal(organization.logo, `${ORIGIN}/logo.png`);
    assert.deepEqual(website.publisher, { "@id": `${ORIGIN}/#organization` });
    for (const field of ["sameAs", "foundingDate", "aggregateRating", "review", "address"]) assert.equal(organization[field], undefined);
    assert.equal(website.potentialAction, undefined);
  });
});

test("product and breadcrumb schema use actual values without demo reviews or inferred stock", async () => {
  await withEnvironment(production, () => {
    const product = { ...BEST_SELLERS[0], rating: 5, reviews: 9999, price: 321 };
    const page = productSeo(product);
    const graph = jsonLdData(PageJsonLd({ page, product, breadcrumbs: [{ name: "Home", path: "/" }, { name: "Snacks", path: "/category/snacks" }, { name: product.name, path: page.path }] }));
    const entity = graph["@graph"].find((entry) => entry["@type"] === "Product")!;
    assert.equal(entity.name, product.name);
    assert.equal(entity.url, `${ORIGIN}${page.path}`);
    assert.equal(entity.aggregateRating, undefined);
    assert.equal(entity.review, undefined);
    assert.equal(entity.brand, undefined);
    const offer = entity.offers as Record<string, unknown>;
    assert.equal(offer.price, "321.00");
    assert.equal(offer.priceCurrency, "INR");
    for (const field of ["availability", "priceValidUntil", "shippingDetails", "hasMerchantReturnPolicy"]) assert.equal(offer[field], undefined);
    const breadcrumb = graph["@graph"].find((entry) => entry["@type"] === "BreadcrumbList")!;
    const items = breadcrumb.itemListElement as Array<Record<string, unknown>>;
    assert.deepEqual(items.map((item) => item.position), [1, 2, 3]);
    assert.deepEqual(items.map((item) => item.item), [`${ORIGIN}/`, `${ORIGIN}/category/snacks`, `${ORIGIN}${page.path}`]);
    for (const price of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
      const invalid = jsonLdData(PageJsonLd({ page, product: { ...product, price } }));
      assert.equal(invalid["@graph"].find((entry) => entry["@type"] === "Product")!.offers, undefined);
    }
  });
});

test("catalog identity and sitemap share canonical products without resurrecting deleted seeds", async () => {
  const dbGlobal = globalThis as typeof globalThis & { sql?: unknown };
  const previous = dbGlobal.sql;
  let products = [...ALL_PRODUCTS];
  const row = (product: Product) => ({ ...product, category: product.category ?? null, district: product.district ?? null, image: product.image ?? null, old_price: product.oldPrice ?? null, discount: product.discount ?? null });
  dbGlobal.sql = async (parts: TemplateStringsArray, ...values: unknown[]) => {
    const query = parts.join("?");
    if (query.includes("FROM categories")) return [
      { slug: "snacks", label: "Snacks", image: "/logo.png", description: null, count: products.filter((product) => product.category === "snacks").length },
      { slug: "empty", label: "Empty", image: "/logo.png", description: null, count: 0 },
    ];
    if (query.includes("FROM districts")) return [{ slug: "puri", name: "Puri", region: null, headquarter: null, description: null, image: null, sort_order: 0 }];
    if (query.includes("FROM products WHERE id")) return products.filter((product) => product.id === values[0]).map(row);
    if (query.includes("WHERE category") && query.includes("id <>")) return products.filter((product) => product.category === values[0] && product.id !== values[1]).slice(0, Number(values[2])).map(row);
    if (query.includes("FROM products ORDER BY")) return products.map(row);
    throw new Error(`Unexpected SQL in read-only test: ${query}`);
  };
  try {
    const publicProducts = await getPublicProducts();
    assert.equal(publicProducts.length, ALL_PRODUCTS.length + TOP_DEALS.length);
    for (const featured of BEST_SELLERS) {
      const seed = ALL_PRODUCTS.find((product) => product.name === featured.name && product.image === featured.image)!;
      assert.equal((await getProductPageData(featured.id))?.canonicalId, seed.id);
      assert.ok(!publicProducts.some((product) => product.id === featured.id));
    }
    products = products.map((product) => product.id === "sweets-1" ? { ...product, price: 999, district: "puri" } : product);
    assert.equal((await getFeaturedProducts()).bestSellers.find((product) => product.id === "sweets-1")?.price, 999);
    await withEnvironment(production, async () => {
      const entries = await sitemap();
      const urls = entries.map((entry) => entry.url);
      assert.equal(new Set(urls).size, urls.length);
      assert.ok(urls.includes(`${ORIGIN}/product/sweets-1`));
      assert.ok(urls.includes(`${ORIGIN}/product/${TOP_DEALS[0].id}`));
      assert.ok(!urls.includes(`${ORIGIN}/product/chhena-poda`));
      assert.ok(urls.includes(`${ORIGIN}/category/snacks`));
      assert.ok(urls.includes(`${ORIGIN}/district/puri`));
      for (const path of ["/category/empty", "/district/cuttack", "/cart", "/checkout", "/backend", "/offline"]) assert.ok(!urls.includes(`${ORIGIN}${path}`), path);
      assert.ok(entries.every((entry) => entry.lastModified === undefined));
    });
    products = [];
    assert.equal(await getProduct("sweets-1"), undefined);
    assert.equal(await getProductPageData("sweets-1"), undefined);
    assert.equal((await getProductPageData("chhena-poda"))?.canonicalId, "chhena-poda");
    const seed = ALL_PRODUCTS.find((product) => product.id === "sweets-1")!;
    for (const custom of [{ ...seed, id: "unrelated-custom-id" }, { ...seed, name: "Different product" }]) {
      products = [custom];
      assert.equal((await getProductPageData("chhena-poda"))?.canonicalId, "chhena-poda");
    }
  } finally {
    if (previous === undefined) delete dbGlobal.sql;
    else dbGlobal.sql = previous;
  }
});
