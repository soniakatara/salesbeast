import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  // authorized() in auth.ts redirects to /login when false for /dashboard
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/roleplay", "/roleplay/:path*", "/rate", "/playbooks", "/notes", "/ask", "/history", "/history/:path*", "/insights"],
};
