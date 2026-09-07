import assert from "node:assert/strict";
import test from "node:test";
import { MAX_QTY, isIndianMobile, isIndianState, isServiceable, parseCartRequest, priceOrder } from "@/lib/orders";

const RATES = { deliveryFee: 40, freeDeliveryOver: 500 };

test("priceOrder charges delivery below the free threshold and not at or above it", () => {
  assert.deepEqual(priceOrder([], RATES), { subtotal: 0, delivery: 0, total: 0 });
  assert.deepEqual(priceOrder([{ price: 100, qty: 2 }], RATES), {
    subtotal: 200,
    delivery: 40,
    total: 240,
  });
  // Exactly at the threshold already qualifies for free delivery.
  assert.deepEqual(priceOrder([{ price: 250, qty: 2 }], RATES), {
    subtotal: 500,
    delivery: 0,
    total: 500,
  });
  assert.deepEqual(priceOrder([{ price: 300, qty: 2 }], RATES), {
    subtotal: 600,
    delivery: 0,
    total: 600,
  });
});

test("parseCartRequest rejects carts that are empty or malformed", () => {
  for (const bad of [undefined, null, "khaja", [], [{ id: "khaja" }], [{ id: "", qty: 1 }]]) {
    assert.ok("error" in parseCartRequest(bad), `expected rejection for ${JSON.stringify(bad)}`);
  }
  for (const qty of [0, -3, 1.5, Number.NaN, "many"]) {
    assert.ok("error" in parseCartRequest([{ id: "khaja", qty }]), `expected rejection for ${qty}`);
  }
});

test("parseCartRequest merges repeated ids", () => {
  const result = parseCartRequest([
    { id: "khaja", qty: 2 },
    { id: "rasgulla", qty: 1 },
    { id: "khaja", qty: 3 },
  ]);
  assert.ok("lines" in result);
  assert.deepEqual(result.lines, [
    { id: "khaja", qty: 5 },
    { id: "rasgulla", qty: 1 },
  ]);
});

test("parseCartRequest caps quantity after merging, not per line", () => {
  const split = Array.from({ length: MAX_QTY }, () => ({ id: "khaja", qty: 2 }));
  // Every line is individually under the cap; together they are far over it.
  assert.ok("error" in parseCartRequest(split));
  assert.ok("lines" in parseCartRequest([{ id: "khaja", qty: MAX_QTY }]));
});

test("isServiceable matches pincode prefixes and treats an empty list as everywhere", () => {
  assert.equal(isServiceable("751001", ""), true);
  assert.equal(isServiceable("999999", "   ,  "), true);

  const area = "751, 752 7530";
  assert.equal(isServiceable("751001", area), true);
  assert.equal(isServiceable("752 110", area), true); // digits only are compared
  assert.equal(isServiceable("753001", area), true);
  assert.equal(isServiceable("753101", area), false); // 7531 is not 7530
  assert.equal(isServiceable("682001", area), false);
});

test("isIndianMobile accepts Indian mobiles in common formats and rejects the rest", () => {
  for (const ok of ["6370649364", "+91 63706 49364", "+91-6370649364", "916370649364", "06370649364", "9163706493"]) {
    assert.equal(isIndianMobile(ok), true, ok);
  }
  for (const no of ["5370649364", "637064936", "63706493641", "+44 7700 900123", "12345", "", "abc"]) {
    assert.equal(isIndianMobile(no), false, no);
  }
});

test("isIndianState is an exact match against the known list", () => {
  assert.equal(isIndianState("Odisha"), true);
  assert.equal(isIndianState("Delhi"), true);
  assert.equal(isIndianState("odisha"), false);
  assert.equal(isIndianState("Orissa"), false);
  assert.equal(isIndianState("California"), false);
});
