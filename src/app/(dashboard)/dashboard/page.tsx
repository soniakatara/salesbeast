import { auth } from "@/auth";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";

const navItems = [
  {
    href: "/roleplay",
    title: "Roleplay",
    description: "Chat with the coach through a sales scenario",
  },
  {
    href: "/rate",
    title: "Rate my conversation",
    description: "Paste a transcript for scores and feedback",
  },
  {
    href: "/playbooks",
    title: "Playbooks",
    description: "Manage scripts and objection library",
  },
  {
    href: "/history",
    title: "History",
    description: "Past sessions and conversation detail",
  },
  {
    href: "/insights",
    title: "Insights",
    description: "Top weaknesses and average score",
  },
];

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
          Welcome{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="mt-2 text-neutral-400">
          Choose an activity below to practice or get feedback.
        </p>
      </div>
      <Section>
        <div className="grid gap-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card
                padding="md"
                className="hover:border-neutral-700 transition-colors block"
              >
                <span className="font-medium text-violet-400 hover:text-violet-300">
                  {item.title}
                </span>
                <p className="text-sm text-neutral-500 mt-1">{item.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
