import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public paths that don't need auth
  const publicPaths = [
    "/",
    "/pricing",
    "/contact",
    "/demo",
    "/login",
    "/signup",
    "/success",
  ];

  const publicPrefixes = [
    "/api/cron/",
    "/api/auth/",
    "/api/stripe/",
    "/api/seed",
    "/api/contact",
    "/api/test",
    "/api/setup-tab",
    "/_next/",
    "/favicon.ico",
    "/images/",
    "/fonts/",
  ];

  const isPublic = publicPaths.includes(pathname) ||
    publicPrefixes.some((p) => pathname.startsWith(p));

  if (isPublic) return;

  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|fonts).*)"],
};
