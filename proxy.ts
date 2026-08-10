import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase() ?? "";
  const isWaterPumpHost = host.startsWith("pump.") || host.startsWith("water-pump.");

  if (!isWaterPumpHost) return NextResponse.next();

  const pathname = request.nextUrl.pathname;
  const shouldPassThrough =
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname === "/water-pump";

  if (shouldPassThrough) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/water-pump";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
