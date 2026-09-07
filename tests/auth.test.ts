import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import {
  ADMIN_MAX_AGE,
  signToken,
  verifyAdminToken,
  verifyCustomerToken,
} from "@/lib/token";

const SECRET = "test-secret";

test("a customer token never opens an admin session, and vice versa", () => {
  const customer = signToken({ k: "customer", u: "cus_1", t: Date.now() }, SECRET);
  const admin = signToken({ k: "admin", u: "rosy", r: "super", t: Date.now() }, SECRET);

  assert.equal(verifyAdminToken(customer, SECRET), null);
  assert.equal(verifyCustomerToken(admin, SECRET), null);

  assert.equal(verifyAdminToken(admin, SECRET)?.u, "rosy");
  assert.equal(verifyCustomerToken(customer, SECRET)?.u, "cus_1");
});

test("a customer token cannot smuggle a role past the kind check", () => {
  // Someone forges the payload shape but only holds a customer-kind token.
  const smuggled = signToken(
    { k: "customer", u: "cus_1", t: Date.now(), r: "super" } as unknown as Parameters<typeof signToken>[0],
    SECRET,
  );
  assert.equal(verifyAdminToken(smuggled, SECRET), null);
});

test("tampered, foreign-secret, legacy and expired tokens are rejected", () => {
  const admin = signToken({ k: "admin", u: "rosy", r: "super", t: Date.now() }, SECRET);

  assert.equal(verifyAdminToken(admin, "another-secret"), null);
  assert.equal(verifyAdminToken(admin.slice(0, -2) + "zz", SECRET), null);
  assert.equal(verifyAdminToken("not-a-token", SECRET), null);
  assert.equal(verifyAdminToken(undefined, SECRET), null);

  // A token from before the kind discriminator existed: correctly signed but no `k`.
  const legacyBody = Buffer.from(JSON.stringify({ u: "rosy", r: "super", t: Date.now() })).toString("base64url");
  const legacySig = crypto.createHmac("sha256", SECRET).update(legacyBody).digest("base64url");
  assert.equal(verifyAdminToken(`${legacyBody}.${legacySig}`, SECRET), null);

  const expired = signToken(
    { k: "admin", u: "rosy", r: "super", t: Date.now() - (ADMIN_MAX_AGE + 1) * 1000 },
    SECRET,
  );
  assert.equal(verifyAdminToken(expired, SECRET), null);
});
