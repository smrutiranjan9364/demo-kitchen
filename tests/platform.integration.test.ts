import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
const testUrl = process.env.TEST_DATABASE_URL;
// Never run these fixtures against a remote or shared production database.
test(
  "transactional customer → restaurant → rider → delivery journey",
  { skip: !testUrl },
  async () => {
    if (!["127.0.0.1", "localhost"].includes(new URL(testUrl!).hostname))
      throw new Error(
        "Integration tests require an isolated localhost database.",
      );
    process.env.DATABASE_URL = testUrl;
    const { sql } = await import("@/lib/db");
    const { quoteOrder, submitOrder, transitionOrder, assignRider } =
      await import("@/lib/platform");
    const suffix = crypto.randomUUID();
    const customer = `customer-${suffix}`,
      vendor = `vendor-${suffix}`,
      rider = `rider-${suffix}`,
      restaurant = `restaurant-${suffix}`,
      product = `product-${suffix}`,
      coupon = `T-${suffix.toUpperCase()}`;
    try {
      for (const id of [customer, vendor, rider])
        await sql`INSERT INTO customers(id,email,phone,name,password_hash,salt,verified_at) VALUES(${id},${id + "@example.test"},'9876543210',${id},'unused','unused',now())`;
      await sql`INSERT INTO restaurants(id,owner_id,name,approval,pincodes,delivery_fee) VALUES(${restaurant},${vendor},'Test kitchen','approved','751',40)`;
      await sql`INSERT INTO products(id,name,price,stock,restaurant_id) VALUES(${product},'Test meal',200,5,${restaurant})`;
      await sql`INSERT INTO riders(id,vehicle,approval,online) VALUES(${rider},'Test bike','approved',true)`;
      await sql`INSERT INTO coupons(code,kind,value,minimum,maximum,first_order,expires_at) VALUES(${coupon},'flat',20,100,20,true,now()+interval '1 day')`;
      const payload = {
        name: "Test customer",
        email: "test@example.test",
        phone: "9876543210",
        address: "Test street",
        city: "Bhubaneswar",
        state: "Odisha",
        pincode: "751001",
        payment: "Cash on Delivery",
        items: [{ id: product, qty: 1 }],
        landmark: "Test landmark",
        instructions: "Call on arrival",
        coupon,
        tip: 10,
      };
      const quote = await quoteOrder(payload, customer);
      assert.equal(quote.breakdown.total, 230);
      const input = {
        ...payload,
        fingerprint: quote.fingerprint,
        requestKey: crypto.randomUUID(),
      };
      const results = await Promise.all([
        submitOrder(input, customer),
        submitOrder(input, customer),
      ]);
      assert.equal(results[0].id, results[1].id);
      assert.equal(results.filter((r) => r.duplicate).length, 1);
      const order = results[0];
      assert.equal(
        (await sql`SELECT stock FROM products WHERE id=${product}`)[0].stock,
        4,
      );
      assert.equal(
        (await sql`SELECT landmark FROM orders WHERE id=${order.id}`)[0]
          .landmark,
        "Test landmark",
      );
      await assert.rejects(
        () => submitOrder({ ...input, phone: "9876543211" }, customer),
        /already used/,
      );
      await assert.rejects(() => quoteOrder(payload, customer), /already used/);
      await assert.rejects(
        () =>
          transitionOrder(order.id, "Confirmed", {
            id: customer,
            role: "restaurant",
          }),
        /access denied/,
      );
      await assert.rejects(
        () =>
          transitionOrder(order.id, "Delivered", {
            id: "admin",
            role: "admin",
          }),
        /Cannot change/,
      );
      for (const state of ["Confirmed", "Preparing", "Ready for Pickup"])
        await transitionOrder(order.id, state, {
          id: vendor,
          role: "restaurant",
        });
      await assignRider(order.id, rider, rider);
      await assert.rejects(
        () => assignRider(order.id, rider, rider),
        /active delivery/,
      );
      await transitionOrder(order.id, "Picked Up", {
        id: rider,
        role: "rider",
      });
      await transitionOrder(order.id, "Dispatched", {
        id: rider,
        role: "rider",
      });
      await assert.rejects(
        () =>
          transitionOrder(
            order.id,
            "Delivered",
            { id: rider, role: "rider" },
            "",
            "000000",
          ),
        /incorrect/,
      );
      const [stored] =
        await sql`SELECT delivery_code FROM orders WHERE id=${order.id}`;
      await transitionOrder(
        order.id,
        "Delivered",
        { id: rider, role: "rider" },
        "",
        stored.delivery_code,
      );
      assert.equal(
        (await sql`SELECT payment_status FROM orders WHERE id=${order.id}`)[0]
          .payment_status,
        "paid",
      );
      assert.equal(
        (
          await sql`SELECT rider_amount FROM earnings WHERE order_id=${order.id}`
        )[0].rider_amount,
        50,
      );
      await assert.rejects(
        () =>
          transitionOrder(
            order.id,
            "Cancelled",
            { id: "admin", role: "admin" },
            "test",
          ),
        /Cannot change/,
      );
      // Another order: cancellation restores inventory once, terminal transitions cannot repeat.
      const plain = { ...payload, coupon: "", tip: 0 };
      const q2 = await quoteOrder(plain, customer);
      const cancel = await submitOrder(
        {
          ...plain,
          requestKey: crypto.randomUUID(),
          fingerprint: q2.fingerprint,
        },
        customer,
      );
      await transitionOrder(
        cancel.id,
        "Cancelled",
        { id: customer, role: "customer" },
        "Changed plans",
      );
      assert.equal(
        (await sql`SELECT stock FROM products WHERE id=${product}`)[0].stock,
        4,
      );
      await assert.rejects(
        () =>
          transitionOrder(
            cancel.id,
            "Cancelled",
            { id: customer, role: "customer" },
            "again",
          ),
        /Cannot change/,
      );
      // Two different customers race for the last item.
      await sql`UPDATE products SET stock=1 WHERE id=${product}`;
      const q3 = await quoteOrder(plain, customer);
      const race = await Promise.allSettled([
        submitOrder(
          {
            ...plain,
            requestKey: crypto.randomUUID(),
            fingerprint: q3.fingerprint,
          },
          customer,
        ),
        submitOrder(
          {
            ...plain,
            requestKey: crypto.randomUUID(),
            fingerprint: q3.fingerprint,
          },
          vendor,
        ),
      ]);
      assert.equal(race.filter((r) => r.status === "fulfilled").length, 1);
      assert.equal(
        (await sql`SELECT stock FROM products WHERE id=${product}`)[0].stock,
        0,
      );
      await assert.rejects(
        () => quoteOrder({ ...plain, pincode: "110001" }, customer),
        /does not deliver/,
      );
      await sql`UPDATE restaurants SET enabled=false WHERE id=${restaurant}`;
      await assert.rejects(() => quoteOrder(plain, customer), /closed/);
    } finally {
      // Keep the isolated fixtures for browser inspection; the test database is disposable.
      await sql.end();
    }
  },
);
