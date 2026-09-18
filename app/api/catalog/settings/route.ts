import { publicApi, publicJson, corsPreflight } from "@/lib/public-api";
import { getSettings } from "@/lib/store";

// GET /api/catalog/settings — the public store settings the app needs for the
// cart/checkout (delivery fee, free-delivery threshold) and the footer
// (store name, contact, FSSAI). Never exposes admin-only fields.
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsPreflight();
}

export function GET() {
  return publicApi(async () => {
    const s = await getSettings();
    return publicJson({
      settings: {
        storeName: s.storeName,
        email: s.email,
        phone: s.phone,
        deliveryFee: s.deliveryFee,
        freeDeliveryOver: s.freeDeliveryOver,
        fssai: s.fssai,
        deliveryPincodes: s.deliveryPincodes,
      },
    });
  });
}
