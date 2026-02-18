"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-neutral-800 bg-neutral-900">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-semibold text-lg text-neutral-100">
          Sales Coach
        </Link>
        {status === "loading" ? (
          <span className="text-sm text-neutral-500">…</span>
        ) : session?.user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-400">
              {session.user.name ?? session.user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
