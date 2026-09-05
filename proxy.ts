// Next.js 16 renamed Middleware to Proxy. This gates the admin area:
// an optimistic presence-check of the session cookie (real HMAC verification
// happens in the dashboard layout and API route handlers).
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";
import { getSeoConfig, SEARCH_PARAMETERS } from "@/lib/seo";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(ADMIN_COOKIE)?.value);

  // Protect the dashboard: bounce to the login page only when there is no
  // session cookie at all. Token *validity* is checked in the dashboard layout
  // and the login page (which verify the HMAC), so a stale/invalid cookie shows
  // the login form instead of causing a redirect loop.
  if (pathname.startsWith("/backend/dashboard") && !hasSession) {
    return NextResponse.redirect(new URL("/backend", request.url));
  }

  const response = NextResponse.next();
  const searchVariant = ["/shop", "/categories", "/festival"].includes(pathname) &&
    Array.from(request.nextUrl.searchParams.keys()).some((key) => SEARCH_PARAMETERS.has(key.toLowerCase()));
  if (!getSeoConfig().indexable || pathname.startsWith("/backend") || searchVariant) {
    response.headers.set("X-Robots-Tag", "noindex, follow");
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.png|apple-icon.png|icon-|logo|sw.js|social-image).*)"],
};
