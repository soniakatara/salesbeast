const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const PHASES = JSON.stringify([
  "opening",
  "discovery",
  "pitch",
  "objection",
  "close",
]);

const presets = [
  { title: "Cold outreach", description: "First touch with a prospect who doesn't know you.", phases: PHASES, isActive: true },
  { title: "Demo follow-up", description: "Follow up after a product demo to address concerns and move to next step.", phases: PHASES, isActive: true },
  { title: "Pricing objection", description: "Handle pushback on price and justify value.", phases: PHASES, isActive: true },
  { title: "Closing negotiation", description: "Negotiate terms and get to yes.", phases: PHASES, isActive: true },
  { title: "Discovery call", description: "Ask questions to uncover needs and qualify the opportunity.", phases: PHASES, isActive: true },
];

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "demo1234";

const defaultPlaybooks = [
  {
    title: "Opening hook",
    type: "opening_hooks",
    content: "We help teams like yours cut follow-up time by half.\nWhat's your biggest bottleneck right now?",
  },
  {
    title: "Objection responses",
    type: "objection_responses",
    content: "I hear you. Can I ask what you're comparing us to?\nWhat would need to be true for this to become a priority?",
  },
];

async function main() {
  const presetCount = await prisma.scenarioPreset.count();
  if (presetCount === 0) {
    await prisma.scenarioPreset.createMany({ data: presets });
    console.log("Seeded scenario presets.");
  }

  let demoUser = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!demoUser) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    demoUser = await prisma.user.create({
      data: { email: DEMO_EMAIL, name: "Demo User", passwordHash },
    });
    console.log("Seeded demo user:", DEMO_EMAIL);
  }

  const playbookCount = await prisma.playbook.count({ where: { userId: demoUser.id } });
  if (playbookCount < 2) {
    for (const p of defaultPlaybooks) {
      await prisma.playbook.create({
        data: { userId: demoUser.id, title: p.title, content: p.content, type: p.type },
      });
    }
    console.log("Seeded 2 default playbooks for demo user.");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
