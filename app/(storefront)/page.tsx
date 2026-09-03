import CategoryCircles from "@/components/home/CategoryCircles";
import ProductSection from "@/components/home/ProductSection";
import FestivalFood from "@/components/home/FestivalFood";
import Testimonial from "@/components/home/Testimonial";
import TasteOdisha from "@/components/home/TasteOdisha";
import { BEST_SELLERS, TOP_DEALS } from "@/data/products";

// Category circles read the admin-managed store, so render at request time.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="bg-cream-soft">
      <CategoryCircles />
      <ProductSection title="Best Sellers" products={BEST_SELLERS} viewAllHref="/shop" />
      <ProductSection title="Top Deals" products={TOP_DEALS} viewAllHref="/deals" />
      <FestivalFood />
      <Testimonial />
      <TasteOdisha />
    </div>
  );
}
