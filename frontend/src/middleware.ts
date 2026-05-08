import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Client-side auth is handled by the layout components.
// This middleware only handles basic redirects.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root redirect - let client handle auth
  if (pathname === "/") {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
