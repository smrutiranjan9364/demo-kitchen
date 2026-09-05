import type { Product } from "@/data/products";
import type { Category } from "@/data/site";
import type { AdminDistrict } from "@/lib/store";
import type { SeoPage } from "@/lib/seo";

export function productSeo(product: Product): SeoPage {
  return {
    path: `/product/${encodeURIComponent(product.id)}`,
    title: product.name,
    description: `Explore ${product.name} at Odia Kitchen. View the current price, product details and related Odia foods, and add your favourites to your cart.`,
    image: product.image,
    imageAlt: product.name,
  };
}

export function categorySeo(category: Category): SeoPage {
  return {
    path: category.href,
    title: `${category.label} | Odia Food Collection`,
    description: category.description || `Browse ${category.label.toLowerCase()} at Odia Kitchen. Explore the collection, compare product details and find your favourite Odia foods.`,
    type: "CollectionPage",
    image: category.image,
    imageAlt: category.label,
    noindex: !category.count,
  };
}

export function districtSeo(district: AdminDistrict, productCount: number): SeoPage {
  return {
    path: `/district/${encodeURIComponent(district.slug)}`,
    title: `${district.name} Odia Food Collection`,
    description: district.description || `Explore the Odia Kitchen food collection for ${district.name}, Odisha. Browse available products and view their details and prices.`,
    type: "CollectionPage",
    image: district.image,
    imageAlt: district.name,
    noindex: productCount === 0,
  };
}
