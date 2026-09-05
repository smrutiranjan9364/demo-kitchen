import CategoryCircles from "@/components/home/CategoryCircles";
import ProductSection from "@/components/home/ProductSection";
import FestivalFood from "@/components/home/FestivalFood";
import Testimonial from "@/components/home/Testimonial";
import TasteOdisha from "@/components/home/TasteOdisha";
import { getFeaturedProducts } from "@/lib/catalog";
import { getFestivalFoods } from "@/lib/store";
import { routeMetadata, seoPage } from "@/lib/seo";
import { PageJsonLd, SiteJsonLd } from "@/components/seo/JsonLd";

export const metadata = routeMetadata("/");

// Category circles read the admin-managed store, so render at request time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ bestSellers, topDeals }, festivalFoods] = await Promise.all([getFeaturedProducts(), getFestivalFoods()]);
  return (
    <div className="bg-cream-soft">
      <SiteJsonLd />
      <PageJsonLd page={seoPage("/")} />
      <h1 className="sr-only">Odia Kitchen — Traditional Odisha Food</h1>
      <CategoryCircles />
      <ProductSection title="Best Sellers" products={bestSellers} viewAllHref="/shop" prioritizeFirstImage />
      <ProductSection title="Top Deals" products={topDeals} viewAllHref="/deals" />
      <FestivalFood foods={festivalFoods} />
      <Testimonial />
      <TasteOdisha />
    </div>
  );
}
