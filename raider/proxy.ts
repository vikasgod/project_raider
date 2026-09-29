import { NextRequest, NextResponse } from "next/server";
import { auth } from "./app/auth";

const PUBLIC_ROUTES = ["/"];
const PUBLIC_API_PREFIX = "/api/auth";
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await auth();
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }
  if (pathname === PUBLIC_API_PREFIX || pathname.startsWith(`${PUBLIC_API_PREFIX}/`)) {
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const role = session.user?.role;
  if (pathname.startsWith("/admin")) {
    if (role != "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
  if (pathname.startsWith("/partner")) {
    if(pathname.startsWith("/partner/onboarding")){
        return NextResponse.next()
    }
    if (role != "partner") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (pathname.startsWith("/api")) {
    if (!session || !session.user) {
      return Response.json(
        {
          message: "unauthorize",
        },
        { status: 401 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
