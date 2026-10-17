import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { NextRequest } from "next/server";

import { middleware } from "../middleware";

const root = join(import.meta.dir, "..");
const cardPath = join(root, "public/.well-known/agent-card.json");
const headers = readFileSync(join(root, "public/_headers"), "utf8");
const llms = readFileSync(join(root, "public/llms.txt"), "utf8");
const raw = readFileSync(cardPath, "utf8");

type AgentInterface = {
  url: string;
  protocolBinding: string;
  protocolVersion: string;
};

type AgentSkill = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples?: string[];
};

type AgentCard = {
  protocolVersion: string;
  name: string;
  description: string;
  url: string;
  version: string;
  documentationUrl: string;
  provider: { organization: string; url: string };
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    extendedAgentCard: boolean;
  };
  defaultInputModes: string[];
  defaultOutputModes: string[];
  supportedInterfaces: AgentInterface[];
  skills: AgentSkill[];
};

const card = JSON.parse(raw) as AgentCard;
const cardText = raw;

test("A2A agent card is valid JSON at the well-known public path", () => {
  expect(card.protocolVersion).toBe("1.0");
  expect(card.name).toBe("Card Blueprints");
  expect(card.version).toBe("1.0.0");
  expect(card.provider.organization).toBe("Cassidy Rice / Card Blueprints");
  expect(card.provider.url).toBe("https://cardblueprints.com");
  expect(card.documentationUrl).toBe("https://cardblueprints.com/what-is-cardology");
  expect(card.defaultInputModes.length).toBeGreaterThan(0);
  expect(card.defaultOutputModes.length).toBeGreaterThan(0);
  expect(card.supportedInterfaces.length).toBeGreaterThan(0);
  expect(card.skills.length).toBeGreaterThan(0);
});

test("skill takes a DOB and deep-links the free calculator; no retired offers", () => {
  const skill = card.skills.find((item) => item.id === "birth-card-from-dob");
  expect(skill).toBeDefined();
  if (!skill) return;

  expect(skill.description).toMatch(/date of birth|DOB/i);
  expect(skill.description).toContain("https://cardblueprints.com/birth-card-calculator");
  expect(skill.description).not.toContain("/products/one-question-reading");
  expect(skill.description).not.toMatch(/\$13\b/);
  expect(skill.description).not.toContain("/products/blueprint-report");
  expect(skill.description).toMatch(/hand-written readings/i);
  expect(skill.description).toMatch(/not fortune-telling/i);
  expect(skill.description).toMatch(/not tarot/i);
  expect(skill.examples?.join("\n")).not.toContain("/products/blueprint-report");
  expect(card.url).toBe("https://cardblueprints.com/birth-card-calculator");
  expect(card.supportedInterfaces[0]?.url).toBe(
    "https://cardblueprints.com/birth-card-calculator",
  );
});

test("agent card points to the hand-written readings, not retired offers", () => {
  expect(cardText).not.toMatch(/\$13\b/);
  expect(cardText).not.toContain("One Question Reading");
  expect(cardText).toMatch(/hand-written readings/i);
  expect(cardText).not.toContain("52xSeven Blueprint");
  expect(cardText).not.toContain("/products/blueprint-report");
  expect(cardText).not.toMatch(/\$129\b/);
  expect(cardText).not.toMatch(/\$297\b/);
  expect(cardText).not.toMatch(/\$19\b/);
  expect(cardText).not.toMatch(/\$9\b/);
  // All site offers were retired in Oct 2026; only the two Stan Store readings remain.
  expect(cardText).not.toMatch(/\$47\b/);
  expect(cardText).not.toContain("Deep Dive $9");
  expect(cardText).not.toContain("Personal Card Blueprint");
  expect(llms).toContain("https://cardblueprints.com/.well-known/agent-card.json");
  expect(llms).not.toContain("One Question Reading");
  expect(llms).not.toMatch(/\$47\b/);
  expect(llms).not.toContain("52xSeven Blueprint");
  expect(llms).not.toMatch(/\$9\b/);
  expect(llms).not.toContain("/products/one-question-reading");
  expect(llms).not.toContain("/products/blueprint-report");
  expect(llms).toContain("https://stan.store/mycardblueprint");
  expect(llms).not.toContain("stan.store/mycardblueprint/p/");
  expect(llms).not.toMatch(/\$(97|137|179)\b/);
});

test("Pages _headers serve the card as public JSON with CORS", () => {
  expect(headers).toContain("/.well-known/agent-card.json");
  expect(headers).toMatch(
    /\/\.well-known\/agent-card\.json\n(?:  .+\n)*  Content-Type: application\/json/,
  );
  expect(headers).toMatch(
    /\/\.well-known\/agent-card\.json\n(?:  .+\n)*  Access-Control-Allow-Origin: \*/,
  );
});

test("middleware leaves the agent card on 200 and opens CORS for other agents", () => {
  const response = middleware(
    new NextRequest(
      new Request("https://cardblueprints.com/.well-known/agent-card.json", {
        headers: { host: "cardblueprints.com" },
      }),
    ),
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("access-control-allow-origin")).toBe("*");
  expect(response.headers.get("cross-origin-resource-policy")).toBe(
    "cross-origin",
  );
});
