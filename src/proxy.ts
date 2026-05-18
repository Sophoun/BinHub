import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "./lib/auth";

export async function proxy(request: NextRequest) {
  const session = request.cookies.get("session")?.value;

  const isLoginPage = request.nextUrl.pathname === "/login";
  const isAdminPage = request.nextUrl.pathname.startsWith("/admin");

  if (!session && !isLoginPage && request.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session) {
    try {
      const parsed = await decrypt(session);
      const user = parsed.user;

      if (isLoginPage) {
        return NextResponse.redirect(
          new URL(user.role === "admin" ? "/admin" : "/dashboard", request.url),
        );
      }

      if (isAdminPage && user.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
