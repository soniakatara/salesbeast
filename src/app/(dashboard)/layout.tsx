import { Header } from "@/components/Header";
import { Nav } from "@/components/Nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="border-b border-neutral-800 bg-neutral-900/50 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto py-2">
          <Nav />
        </div>
      </div>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 bg-neutral-950">
        {children}
      </main>
    </>
  );
}
