import { NextResponse } from "next/server"
export function middleware(request) {
  const path = request.nextUrl.pathname
  if (path === "/") return NextResponse.rewrite(new URL("/home.html", request.url))
  if (path === "/portal") return NextResponse.rewrite(new URL("/portal.html", request.url))
  return NextResponse.next()
}
export const config = { matcher: ["/", "/portal"] }
