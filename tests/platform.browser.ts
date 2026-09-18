// Run against the isolated development server; never point this at a live site.
import { chromium, expect } from "@playwright/test";
import postgres from "postgres";
import crypto from "node:crypto";
async function main() {
  const base = "http://localhost:5017";
  const sql = postgres(
    "postgres://smrutiranjanbarik@127.0.0.1:55439/postgres",
    { ssl: false },
  );
  const run = crypto.randomUUID().slice(0, 8),
    password = "Test-password-2026";
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const shopper = await browser.newContext({
    baseURL: base,
    viewport: { width: 390, height: 844 },
  });
  const vendor = await browser.newContext({ baseURL: base });
  const rider = await browser.newContext({ baseURL: base });
  const admin = await browser.newContext({ baseURL: base });
  const errors: string[] = [];
  async function register(context: typeof shopper, role: string) {
    const email = `${role.toLowerCase()}-${run}@example.test`;
    const response = await context.request.post("/api/account/register", {
      data: { name: `${role} browser`, email, phone: "9876543210", password },
    });
    expect(response.status(), await response.text()).toBe(201);
    const [customer] = await sql`SELECT id FROM customers WHERE email=${email}`;
    // Verified fixture: actual Gmail delivery is deliberately not simulated as success.
    await sql`UPDATE customers SET verified_at=now() WHERE id=${customer.id}`;
    return customer.id as string;
  }
  try {
    await sql`INSERT INTO settings(id,store_name,email,phone,delivery_fee,free_delivery_over) VALUES(1,'Test kitchen','test@example.test','9876543210',40,500) ON CONFLICT DO NOTHING`;
    const customerId = await register(shopper, "Customer"),
      vendorId = await register(vendor, "Vendor"),
      riderId = await register(rider, "Rider");
    const adminName = `admin-${run}`,
      salt = crypto.randomBytes(16).toString("hex"),
      hash = crypto.scryptSync(password, salt, 64).toString("hex");
    await sql`INSERT INTO users(username,password_hash,salt,role,permissions) VALUES(${adminName},${hash},${salt},'admin','["platform","orders"]'::jsonb)`;
    expect(
      (
        await admin.request.post("/api/admin/login", {
          data: { username: adminName, password },
        })
      ).status(),
    ).toBe(200);
    const vendorApply = await vendor.request.post("/api/partner", {
      data: {
        action: "register-restaurant",
        name: `Browser kitchen ${run}`,
        address: "Test pickup street, Bhubaneswar",
        phone: "9876543210",
        cuisine: "Odia",
        pincodes: "751",
      },
    });
    expect(vendorApply.status(), await vendorApply.text()).toBe(200);
    const [restaurant] =
      await sql`SELECT id FROM restaurants WHERE owner_id=${vendorId}`;
    expect(
      (
        await admin.request.post("/api/admin/platform", {
          data: {
            action: "approval",
            kind: "restaurant",
            id: restaurant.id,
            status: "approved",
          },
        })
      ).status(),
    ).toBe(200);
    const menu = await vendor.request.post("/api/partner", {
      data: {
        action: "menu",
        name: `Browser meal ${run}`,
        price: 100,
        stock: 10,
        description: "Freshly prepared test meal",
        weight: "1 plate",
        veg: true,
        available: true,
        variantsText: "Regular | 0\nLarge | 50",
        addonsText: "Extra chutney | 20",
      },
    });
    expect(menu.status(), await menu.text()).toBe(200);
    const [product] =
      await sql`SELECT id FROM products WHERE restaurant_id=${restaurant.id}`;
    const applyRider = await rider.request.post("/api/partner", {
      data: { action: "register-rider", vehicle: "Test bike" },
    });
    expect(applyRider.status()).toBe(200);
    expect(
      (
        await admin.request.post("/api/admin/platform", {
          data: {
            action: "approval",
            kind: "rider",
            id: riderId,
            status: "approved",
          },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await rider.request.post("/api/partner", {
          data: { action: "online", online: true },
        })
      ).status(),
    ).toBe(200);
    // Permission boundaries: customer session cannot act as restaurant or administrator.
    expect(
      (
        await shopper.request.post("/api/admin/platform", {
          data: { action: "block", id: vendorId, blocked: true },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await shopper.request.post("/api/partner", {
          data: {
            action: "menu",
            id: product.id,
            name: "Hijacked",
            price: 1,
            stock: 1,
          },
        })
      ).status(),
    ).toBe(403);
    const page = await shopper.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/account/settings");
    await expect(
      page.getByRole("heading", { name: "Account settings" }),
    ).toBeVisible();
    const addressPanel = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Saved addresses" }) });
    await addressPanel
      .getByLabel("Address", { exact: true })
      .fill("House 1, Test street");
    await addressPanel.getByLabel("City", { exact: true }).fill("Bhubaneswar");
    await addressPanel.getByLabel("Pincode", { exact: true }).fill("751001");
    await addressPanel
      .getByLabel("Landmark", { exact: true })
      .fill("Near test temple");
    await addressPanel
      .getByRole("button", { name: "Add address", exact: true })
      .click();
    await expect(
      addressPanel.getByText("Home · Customer browser"),
    ).toBeVisible();
    await page.goto(`/product/${product.id}`);
    await page.getByLabel("Large · ₹150").check();
    await page.getByLabel("Extra chutney +₹20").check();
    await page.getByLabel("Food instructions (optional)").fill("Less spicy");
    await page
      .getByRole("button", { name: "ADD TO CART", exact: true })
      .click();
    await page.goto("/checkout");
    await page.getByLabel("Use saved address").selectOption({ index: 1 });
    await page.getByLabel(/I confirm my delivery details/).check();
    await page
      .getByRole("button", { name: "REVIEW ORDER", exact: true })
      .click();
    await expect(page.getByText(/Review confirmed prices below/)).toBeVisible();
    await page
      .getByRole("button", { name: "CONFIRM & PLACE ORDER", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Order placed!" }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "TRACK ORDER / COMPLETE PAYMENT" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Delivery updates" }),
    ).toBeVisible();
    const [order] =
      await sql`SELECT id,delivery_code FROM orders WHERE customer_id=${customerId} ORDER BY created_at DESC LIMIT 1`;
    expect(order).toBeTruthy();
    const [priced] =
      await sql`SELECT items,total FROM orders WHERE id=${order.id}`;
    expect(priced.total).toBe(210);
    expect(priced.items[0].instructions).toBe("Less spicy");
    expect(priced.items[0].name).toContain("Large, Extra chutney");
    // Customer can't cancel another customer's order.
    expect(
      (
        await vendor.request.patch(`/api/orders/${order.id}`, {
          data: { reason: "not mine" },
        })
      ).status(),
    ).toBe(403);
    const vp = await vendor.newPage();
    vp.on("pageerror", (e) => errors.push(e.message));
    await vp.goto("/partner/restaurant");
    await vp.getByRole("button", { name: "Accept order", exact: true }).click();
    await vp.getByRole("button", { name: "Preparing", exact: true }).click();
    await vp
      .getByRole("button", { name: "Ready for Pickup", exact: true })
      .click();
    await expect(
      vp.getByRole("button", { name: "Ready for Pickup", exact: true }),
    ).toHaveCount(0);
    const rp = await rider.newPage();
    rp.on("pageerror", (e) => errors.push(e.message));
    await rp.goto("/partner/rider");
    await rp
      .getByText(`Browser kitchen ${run}`, { exact: true })
      .locator("..")
      .locator("..")
      .getByRole("button", { name: "Accept delivery", exact: true })
      .click();
    // Other test fixtures can be in the queue; confirm this order specifically if necessary.
    await expect(
      rp.getByRole("button", { name: "Confirm pickup", exact: true }),
    ).toBeVisible();
    const [assigned] =
      await sql`SELECT rider_id FROM orders WHERE id=${order.id}`;
    if (assigned.rider_id !== riderId)
      throw new Error("Unexpected delivery selected by test fixture");
    await rp
      .getByRole("button", { name: "Confirm pickup", exact: true })
      .click();
    await rp
      .getByRole("button", { name: "Start delivery", exact: true })
      .click();
    await rp
      .getByLabel("Customer's six-digit delivery code")
      .fill(order.delivery_code);
    await rp
      .getByRole("button", { name: "Confirm delivered", exact: true })
      .click();
    await expect(
      rp.getByText("No active delivery. Go online to see ready orders."),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByText("Delivered · Payment paid")).toBeVisible();
    await page.getByLabel("Restaurant rating (1–5)").fill("5");
    await page.getByLabel("Delivery rating (1–5)").fill("4");
    await page
      .getByLabel("Your review", { exact: true })
      .fill("Fresh food and careful delivery.");
    await page.getByRole("button", { name: "Save / update review" }).click();
    await expect(
      page.getByText("Thank you. Your review has been saved."),
    ).toBeVisible();
    const ticket = await shopper.request.post("/api/account/manage", {
      data: {
        action: "ticket",
        orderId: order.id,
        subject: "Browser support test",
        message: "Please confirm my delivery receipt.",
      },
    });
    expect(ticket.status()).toBe(200);
    const [support] =
      await sql`SELECT id FROM support_tickets WHERE customer_id=${customerId}`;
    expect(
      (
        await admin.request.post("/api/admin/platform", {
          data: {
            action: "ticket",
            id: support.id,
            status: "Resolved",
            reply: "Your delivery is confirmed.",
          },
        })
      ).status(),
    ).toBe(200);
    const ap = await admin.newPage();
    ap.on("pageerror", (e) => errors.push(e.message));
    await ap.goto("/backend/dashboard/platform");
    await expect(
      ap.getByRole("heading", { name: "Platform operations" }),
    ).toBeVisible();
    await ap.getByRole("button", { name: "Support", exact: true }).click();
    await expect(
      ap.getByText("Browser support test", { exact: true }).first(),
    ).toBeVisible();
    // Exercise one-time verification and password recovery without sending real email.
    const challenge = crypto.randomUUID(),
      code = "123456",
      digest = crypto
        .createHash("sha256")
        .update(`${challenge}:${code}`)
        .digest("hex");
    await sql`INSERT INTO auth_challenges(id,customer_id,purpose,digest,expires_at) VALUES(${challenge},${customerId},'reset',${digest},now()+interval '10 minutes')`;
    expect(
      (
        await shopper.request.patch("/api/account/challenge", {
          data: { id: challenge, code, password: "New-password-2026" },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await shopper.request.patch("/api/account/challenge", {
          data: { id: challenge, code, password: "New-password-2026" },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await shopper.request.post("/api/account/login", {
          data: { email: `customer-${run}@example.test`, password },
        })
      ).status(),
    ).toBe(401);
    await page.screenshot({
      path: "/private/tmp/kitchen-order-mobile.png",
      fullPage: true,
    });
    expect(errors).toEqual([]);
    console.log(
      "PASS: mobile address → review checkout → order tracking → vendor accept/prepare/ready → rider pickup/code/delivery; API ownership boundaries; no browser runtime errors.",
    );
  } finally {
    await browser.close();
    await sql.end();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
