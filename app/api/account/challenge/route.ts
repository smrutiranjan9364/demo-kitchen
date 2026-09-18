import crypto from "node:crypto";
import { sql } from "@/lib/db";
import {
  api,
  ApiError,
  body,
  required,
  rateLimit,
  sameOrigin,
} from "@/lib/api";
import { hashPassword, setCustomerSession } from "@/lib/auth";
import { sendMail } from "@/lib/mail";

export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const input = await body(request);
    await rateLimit("challenge:global", 100, 60);
    const email = required(input.email, "email").toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      throw new ApiError("Enter a valid email.");
    const purpose = input.purpose === "reset" ? "reset" : "verify";
    await rateLimit(`challenge:${email}`, 6);
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    )
      throw new ApiError(
        "Email delivery is not configured yet. Please contact support.",
        503,
      );
    const id = crypto.randomUUID();
    const [customer] =
      await sql`SELECT id FROM customers WHERE lower(email)=${email} AND NOT blocked`;
    if (customer) {
      const code = String(crypto.randomInt(100000, 1000000));
      const digest = crypto
        .createHash("sha256")
        .update(`${id}:${code}`)
        .digest("hex");
      await sql.begin(async (tx) => {
        await tx`SELECT id FROM customers WHERE id=${customer.id} FOR UPDATE`;
        await tx`UPDATE auth_challenges SET used_at=now() WHERE customer_id=${customer.id} AND purpose=${purpose} AND used_at IS NULL`;
        await tx`INSERT INTO auth_challenges(id,customer_id,purpose,digest,expires_at) VALUES(${id},${customer.id},${purpose},${digest},now()+interval '10 minutes')`;
      });
      const sent = await sendMail({
        to: email,
        subject:
          purpose === "reset"
            ? "Reset your Odia Kitchen password"
            : "Verify your Odia Kitchen email",
        text: `Your one-time code is ${code}. It expires in 10 minutes. Never share it with anyone. If you did not request this, ignore this email.`,
      });
      if (!sent) {
        await sql`UPDATE auth_challenges SET used_at=now() WHERE id=${id}`;
        throw new ApiError(
          "We couldn't send your email. Please try again later.",
          503,
        );
      }
    }
    return Response.json({
      id,
      message:
        "If an eligible account exists, a code has been emailed. It expires in 10 minutes.",
    });
  });
}
export async function PATCH(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const input = await body(request);
    const id = required(input.id, "challenge", 100);
    const code = required(input.code, "six-digit code", 6);
    await rateLimit(`verify:${id}`, 10);
    const password = typeof input.password === "string" ? input.password : "";
    const digest = crypto
      .createHash("sha256")
      .update(`${id}:${code}`)
      .digest("hex");
    const result = await sql.begin(async (tx) => {
      const [challenge] =
        await tx`SELECT * FROM auth_challenges WHERE id=${id} FOR UPDATE`;
      if (
        !challenge ||
        challenge.used_at ||
        new Date(challenge.expires_at).getTime() < Date.now() ||
        challenge.attempts >= 5
      )
        return null;
      await tx`UPDATE auth_challenges SET attempts=attempts+1 WHERE id=${id}`;
      if (digest !== challenge.digest) return null;
      if (challenge.purpose === "reset") {
        if (password.length < 8 || password.length > 128)
          throw new ApiError("Use a password between 8 and 128 characters.");
        const { hash, salt } = hashPassword(password);
        await tx`UPDATE customers SET password_hash=${hash},salt=${salt},session_version=session_version+1,verified_at=COALESCE(verified_at,now()) WHERE id=${challenge.customer_id}`;
      } else {
        await tx`UPDATE customers SET verified_at=now() WHERE id=${challenge.customer_id}`;
      }
      await tx`UPDATE auth_challenges SET used_at=now() WHERE customer_id=${challenge.customer_id} AND used_at IS NULL`;
      // Verified email ownership can claim matching guest orders; the phone must also match.
      await tx`UPDATE orders o SET customer_id=c.id FROM customers c WHERE c.id=${challenge.customer_id} AND o.customer_id IS NULL AND lower(o.email)=lower(c.email) AND regexp_replace(o.phone,'[^0-9]','','g')=regexp_replace(c.phone,'[^0-9]','','g')`;
      return String(challenge.customer_id);
    });
    if (!result)
      throw new ApiError(
        "This code is invalid, expired, or has too many attempts.",
      );
    await setCustomerSession(result);
    return Response.json({ ok: true });
  });
}
