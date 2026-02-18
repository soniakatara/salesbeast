import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const presets = await prisma.scenarioPreset.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      phases: true,
      isActive: true,
    },
  });

  return NextResponse.json({
    scenarios: presets.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      phases: p.phases,
      isActive: p.isActive,
    })),
  });
}
