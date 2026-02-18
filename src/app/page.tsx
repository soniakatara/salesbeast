import { auth } from "@/auth";
import Link from "next/link";

const buttonPrimary =
  "rounded-sm font-medium inline-flex items-center justify-center py-2 px-3 text-sm bg-violet-600 hover:bg-violet-500 text-white border border-violet-500/50 transition-colors";
const buttonSecondary =
  "rounded-sm font-medium inline-flex items-center justify-center py-2 px-3 text-sm border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 transition-colors";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
        Sales Coach
      </h1>
      <p className="mt-2 text-neutral-400">
        Practice sales. Get feedback. Improve.
      </p>
      <div className="mt-6 flex gap-4">
        {session ? (
          <Link href="/dashboard" className={buttonPrimary}>
            Dashboard
          </Link>
        ) : (
          <>
            <Link href="/login" className={buttonPrimary}>
              Sign in
            </Link>
            <Link href="/register" className={buttonSecondary}>
              Register
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
