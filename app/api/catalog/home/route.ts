import { publicApi, publicJson, corsPreflight } from "@/lib/public-api";
import { getFeaturedProducts } from "@/lib/catalog";
import { getCategories, getFestivalFoods, getDistrictNav, getSettings } from "@/lib/store";

// One aggregated call that backs the mobile Home screen: featured products,
// categories, festival foods, district nav and the public store settings.
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsPreflight();
}

export function GET() {
  return publicApi(async () => {
    const [featured, categories, festival, districts, settings] = await Promise.all([
      getFeaturedProducts(),
      getCategories(),
      getFestivalFoods(),
      getDistrictNav(),
      getSettings(),
    ]);
    return publicJson({
      bestSellers: featured.bestSellers,
      topDeals: featured.topDeals,
      categories,
      festival,
      districts,
      settings: {
        storeName: settings.storeName,
        email: settings.email,
        phone: settings.phone,
        deliveryFee: settings.deliveryFee,
        freeDeliveryOver: settings.freeDeliveryOver,
        fssai: settings.fssai,
      },
    });
  });
}
