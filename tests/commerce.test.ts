import assert from "node:assert/strict";
import test from "node:test";
import {
  canTransition,
  checkoutTotal,
  couponDiscount,
  isOpen,
  csvCell,
} from "@/lib/commerce";
import { validSignature } from "@/lib/payments";
import crypto from "node:crypto";
test("roles cannot skip stages or alter terminal orders", () => {
  assert.equal(canTransition("Placed", "Delivered", "admin"), false);
  assert.equal(canTransition("Placed", "Cancelled", "customer"), true);
  assert.equal(canTransition("Preparing", "Cancelled", "customer"), false);
  assert.equal(
    canTransition("Ready for Pickup", "Rider Assigned", "restaurant"),
    false,
  );
  assert.equal(canTransition("Dispatched", "Delivered", "rider"), true);
  for (const role of ["customer", "restaurant", "rider", "admin"] as const)
    assert.equal(canTransition("Delivered", "Cancelled", role), false);
});
test("coupons enforce expiration, minimum, eligibility and discount cap", () => {
  const base = {
    code: "FIRST",
    kind: "percent" as const,
    value: 50,
    minimum: 200,
    maximum: 80,
    firstOrder: true,
    expiresAt: "2030-01-01",
    active: true,
  };
  assert.equal(couponDiscount(base, 300, 40, 0, 0), 80);
  assert.throws(() => couponDiscount(base, 100, 40, 0, 0), /requires/);
  assert.throws(() => couponDiscount(base, 300, 40, 1, 0), /first order/);
  assert.throws(
    () => couponDiscount(base, 300, 40, 0, Date.parse("2031-01-01")),
    /expired/,
  );
  assert.equal(
    couponDiscount({ ...base, kind: "delivery" }, 300, 40, 0, 0),
    40,
  );
});
test("server amount arithmetic rejects negative/fractional inputs and accounts for every fee", () => {
  assert.deepEqual(checkoutTotal(200, 40, 10, 5, 500, 20, 15), {
    subtotal: 200,
    delivery: 40,
    packaging: 10,
    platform: 5,
    tax: 10,
    discount: 20,
    tip: 15,
    total: 260,
  });
  assert.throws(() => checkoutTotal(200, 0, 0, 0, 0, 201, 0));
  assert.throws(() => checkoutTotal(200, 0, 0, 0, 0, 0, -1));
  assert.throws(() => checkoutTotal(200, 0, 0, 0, 0, 0, 0.5));
});
test("IST opening hours support overnight schedules and temporary closure", () => {
  const midnight = new Date("2026-01-01T18:45:00Z");
  assert.equal(isOpen("22:00", "03:00", true, midnight), true);
  assert.equal(isOpen("09:00", "21:00", true, midnight), false);
  assert.equal(isOpen("00:00", "00:00", false, midnight), false);
});
test("payment signatures reject forged payloads and CSV exports neutralize formulas", () => {
  const secret = "test";
  const sig = crypto
    .createHmac("sha256", secret)
    .update("order|payment")
    .digest("hex");
  assert.equal(validSignature("order|payment", sig, secret), true);
  assert.equal(validSignature("other|payment", sig, secret), false);
  assert.equal(validSignature("order|payment", "x", secret), false);
  assert.equal(csvCell("=SUM(A1:A2)"), '"\'=SUM(A1:A2)"');
  assert.equal(csvCell('a"b'), '"a""b"');
});

// Multiple portions still share a product's inventory and quantity limit.
import { cartKey, parseOptions } from "@/lib/menu";
import { parseCartRequest } from "@/lib/orders";
test("customizations keep distinct cart lines and share the product quantity cap", () => {
  assert.notEqual(
    cartKey({ id: "food", variantId: "small" }),
    cartKey({ id: "food", variantId: "large" }),
  );
  assert.equal(
    cartKey({ id: "food", addonIds: ["a", "b"] }),
    cartKey({ id: "food", addonIds: ["b", "a"] }),
  );
  assert.deepEqual(
    parseOptions("Regular | 0\nLarge | 50").map((o) => o.price),
    [0, 50],
  );
  assert.throws(() => parseOptions("Large | -1"));
  assert.ok(
    "error" in
      parseCartRequest([
        { id: "food", qty: 30, variantId: "small" },
        { id: "food", qty: 30, variantId: "large" },
      ]),
  );
  const parsed = parseCartRequest([
    { id: "food", qty: 1, variantId: "small" },
    { id: "food", qty: 1, variantId: "large" },
  ]);
  assert.ok("lines" in parsed && parsed.lines.length === 2);
});
