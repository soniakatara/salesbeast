import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SALT_ROUNDS = 10;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
      },
    });

    const defaultPlaybooks = [
      {
        title: "Opening hook",
        type: "opening_hooks",
        content:
          "We help teams like yours cut follow-up time by half.\nWhat's your biggest bottleneck right now?",
      },
      {
        title: "Objection responses",
        type: "objection_responses",
        content:
          "I hear you. Can I ask what you're comparing us to?\nWhat would need to be true for this to become a priority?",
      },
    ];
    for (const p of defaultPlaybooks) {
      await prisma.playbook.create({
        data: { userId: user.id, title: p.title, content: p.content, type: p.type },
      });
    }

    return NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 }
    );
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
