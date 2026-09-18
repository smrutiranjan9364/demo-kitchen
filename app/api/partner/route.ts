import { parseOptions } from "@/lib/menu";
import crypto from "node:crypto";
import { sql } from "@/lib/db";
import {
  api,
  ApiError,
  body,
  integer,
  required,
  sameOrigin,
  rateLimit,
} from "@/lib/api";
import {
  assignRider,
  customerRequired,
  restaurantRequired,
  transitionOrder,
} from "@/lib/platform";
export async function GET(request: Request) {
  return api(async () => {
    const id = await customerRequired();
    const role = new URL(request.url).searchParams.get("role");
    if (role === "rider") {
      const [rider] = await sql`SELECT * FROM riders WHERE id=${id}`;
      const active =
        await sql`SELECT o.id,o.status,o.name,o.phone,o.address,o.city,o.pincode,o.landmark,o.instructions,o.total,o.payment,o.delivery,o.eta_at,r.name AS restaurant_name,r.address AS restaurant_address,r.phone AS restaurant_phone FROM orders o JOIN restaurants r ON r.id=o.restaurant_id WHERE o.rider_id=${id} AND o.status NOT IN ('Delivered','Cancelled','Rejected') ORDER BY o.created_at`;
      const available =
        rider?.approval === "approved" && rider.online
          ? await sql`SELECT o.id,o.delivery,o.created_at,r.name AS restaurant_name,r.address AS restaurant_address FROM orders o JOIN restaurants r ON r.id=o.restaurant_id WHERE o.status='Ready for Pickup' AND o.rider_id IS NULL ORDER BY o.created_at LIMIT 30`
          : [];
      const earnings =
        await sql`SELECT e.order_id,e.rider_amount,e.created_at FROM earnings e WHERE rider_id=${id} ORDER BY created_at DESC LIMIT 100`;
      return Response.json({
        rider: rider ?? null,
        active,
        available,
        earnings,
      });
    }
    const [restaurant] =
      await sql`SELECT * FROM restaurants WHERE owner_id=${id} ORDER BY created_at LIMIT 1`;
    if (!restaurant)
      return Response.json({
        restaurant: null,
        orders: [],
        products: [],
        earnings: [],
      });
    const [orders, products, earnings] = await Promise.all([
      sql`SELECT id,name,phone,items,total,status,instructions,created_at,payment_status FROM orders WHERE restaurant_id=${restaurant.id} ORDER BY created_at DESC LIMIT 100`,
      sql`SELECT * FROM products WHERE restaurant_id=${restaurant.id} ORDER BY name`,
      sql`SELECT order_id,restaurant_amount,commission,created_at FROM earnings WHERE restaurant_id=${restaurant.id} ORDER BY created_at DESC LIMIT 100`,
    ]);
    return Response.json({ restaurant, orders, products, earnings });
  });
}
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const id = await customerRequired();
    const input = await body(request);
    await rateLimit(`partner:${id}`, 150, 60);
    if (
      input.action === "register-restaurant" ||
      input.action === "register-rider"
    ) {
      const [customer] =
        await sql`SELECT verified_at FROM customers WHERE id=${id}`;
      if (!customer.verified_at)
        throw new ApiError(
          "Verify your email in your account before applying.",
          403,
        );
      if (input.action === "register-restaurant") {
        await sql.begin(async (tx) => {
          await tx`SELECT id FROM customers WHERE id=${id} FOR UPDATE`;
          const [existing] =
            await tx`SELECT id FROM restaurants WHERE owner_id=${id}`;
          if (existing)
            throw new ApiError(
              "You already have a restaurant application.",
              409,
            );
          await tx`INSERT INTO restaurants(id,owner_id,name,address,phone,cuisine,pincodes) VALUES(${crypto.randomUUID()},${id},${required(input.name, "restaurant name", 100)},${required(input.address, "restaurant address", 300)},${required(input.phone, "phone", 20)},${required(input.cuisine, "cuisine", 100)},${required(input.pincodes, "serviceable pincodes", 200)})`;
        });
      } else
        await sql`INSERT INTO riders(id,vehicle) VALUES(${id},${required(input.vehicle, "vehicle details", 200)}) ON CONFLICT(id) DO NOTHING`;
    } else if (input.action === "restaurant-settings") {
      const r = await restaurantRequired();
      const opens = required(input.opens, "opening time", 5),
        closes = required(input.closes, "closing time", 5);
      if (
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(opens) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(closes)
      )
        throw new ApiError("Use valid opening and closing times.");
      const phone = required(input.phone, "phone", 20);
      const pincodes = required(input.pincodes, "pincode prefixes", 200);
      if (!/^[\d,\s]+$/.test(pincodes))
        throw new ApiError("Use comma-separated pincode prefixes.");
      await sql`UPDATE restaurants SET name=${required(input.name, "name", 100)},description=${required(input.description, "description", 2000)},cuisine=${required(input.cuisine, "cuisine", 100)},address=${required(input.address, "address", 300)},phone=${phone},pincodes=${pincodes},opens=${opens},closes=${closes},enabled=${input.enabled === true},minimum_order=${integer(input.minimum_order, "minimum order")},delivery_fee=${integer(input.delivery_fee, "delivery fee", 0, 1000)},packaging_fee=${integer(input.packaging_fee, "packaging", 0, 1000)},eta_minutes=${integer(input.eta_minutes, "delivery estimate", 10, 240)} WHERE id=${r.id}`;
    } else if (input.action === "menu") {
      const r = await restaurantRequired();
      let variants, addons;
      try {
        variants = parseOptions(input.variantsText);
        addons = parseOptions(input.addonsText);
      } catch (e) {
        throw new ApiError((e as Error).message);
      }
      const productId =
        typeof input.id === "string" && input.id
          ? input.id
          : crypto.randomUUID();
      const name = required(input.name, "food name", 100),
        price = integer(input.price, "price", 1, 100000),
        stock = integer(input.stock, "stock", 0, 100000);
      if (input.id) {
        const updated =
          await sql`UPDATE products SET variants=${sql.json(variants)},addons=${sql.json(addons)},name=${name},price=${price},stock=${stock},description=${required(input.description, "description", 2000)},weight=${required(input.weight, "portion size", 100)},veg=${input.veg === true},available=${input.available === true} WHERE id=${productId} AND restaurant_id=${r.id} RETURNING id`;
        if (!updated.length) throw new ApiError("Menu item not found.", 404);
      } else
        await sql`INSERT INTO products(id,restaurant_id,name,price,stock,description,weight,veg,available,rating,reviews,variants,addons) VALUES(${productId},${r.id},${name},${price},${stock},${required(input.description, "description", 2000)},${required(input.weight, "portion size", 100)},${input.veg === true},${input.available === true},0,0,${sql.json(variants)},${sql.json(addons)})`;
    } else if (input.action === "restaurant-status") {
      await transitionOrder(
        required(input.id, "order"),
        required(input.status, "status"),
        { id, role: "restaurant" },
        typeof input.note === "string" ? input.note : "",
      );
    } else if (input.action === "online") {
      const updated =
        await sql`UPDATE riders SET online=${input.online === true} WHERE id=${id} AND approval='approved' RETURNING id`;
      if (!updated.length) throw new ApiError("Rider approval required.", 403);
    } else if (input.action === "accept-delivery") {
      await assignRider(required(input.id, "order"), id, id);
    } else if (input.action === "rider-status") {
      await rateLimit(`delivery-code:${id}:${input.id}`, 10);
      await transitionOrder(
        required(input.id, "order"),
        required(input.status, "status"),
        { id, role: "rider" },
        typeof input.note === "string" ? input.note : "",
        typeof input.otp === "string" ? input.otp : "",
      );
    } else throw new ApiError("Unknown action.");
    return Response.json({ ok: true });
  });
}
