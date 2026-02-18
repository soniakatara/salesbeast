import { auth } from "@/auth";
import { NextResponse } from "next/server";

/** Get session or return 401 JSON. Use in API routes. */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null as null, userId: null as null, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, userId: session.user.id, res: null };
}
