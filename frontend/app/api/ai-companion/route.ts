import { NextResponse } from "next/server";

import { portfolioContent } from "@/content/portfolio-content";
import { getSiteConfig } from "@/lib/content-store";

export const runtime = "nodejs";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AiCompanionRequest {
  message?: string;
  history?: ChatMessage[];
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildPortfolioContext() {
  const identity = portfolioContent.identity;
  const metrics = portfolioContent.proofMetrics
    .map((metric) => `${metric.label}: ${metric.value} - ${metric.context}`)
    .join("\n");
  const projects = portfolioContent.projects
    .slice(0, 6)
    .map(
      (project) =>
        `${project.title}: ${project.problem} ${project.approach} Outcome: ${project.outcome}. Stack: ${project.stack.join(", ")}.`,
    )
    .join("\n");
  const experience = portfolioContent.experience.work
    .map((item) => `${item.title}, ${item.organization}, ${item.period}: ${item.highlights.join(" ")}`)
    .join("\n");

  return [
    `Name: ${identity.name}`,
    `Role: ${identity.role}`,
    `Location: ${identity.location}`,
    `Current: ${identity.currentlyAt}`,
    `Bio: ${identity.bio}`,
    `Focus: ${portfolioContent.about.paragraphs.join(" ")}`,
    `Principles: ${portfolioContent.about.principles.join("; ")}`,
    `Proof metrics:\n${metrics}`,
    `Experience:\n${experience}`,
    `Projects:\n${projects}`,
  ].join("\n\n");
}

function fallbackAnswer(message: string) {
  const lower = message.toLowerCase();
  const identity = portfolioContent.identity;

  if (lower.includes("project") || lower.includes("work")) {
    const featured = portfolioContent.projects.slice(0, 3).map((project) => project.title);
    return `I can walk you through ${identity.name}'s work. The strongest project signals are ${featured.join(", ")}. His portfolio emphasizes cloud infrastructure, automation, reliability, and measurable production outcomes.`;
  }

  if (lower.includes("strong") || lower.includes("skill") || lower.includes("stack") || lower.includes("tech")) {
    return `${identity.name}'s strongest technical lane is cloud and platform engineering: AWS, Terraform, serverless services, microservices, CI/CD, observability, and backend systems. He also presents full-stack delivery experience where it supports reliable product workflows.`;
  }

  if (lower.includes("contact") || lower.includes("email") || lower.includes("hire") || lower.includes("available")) {
    return `${identity.name} is open to cloud, platform, backend, and full-stack engineering conversations. You can reach him at ${identity.contactEmail}.`;
  }

  if (lower.includes("capital one") || lower.includes("experience")) {
    return `${identity.name} is currently at ${identity.currentlyAt}, focused on cloud infrastructure, microservice platforms, reliability, automation, and cost/performance outcomes.`;
  }

  return `I am Bhargava's AI companion preview. I can answer from the portfolio context now, and once OPENAI_API_KEY is configured I will provide richer grounded responses. Bhargava is a ${identity.role} in ${identity.location}, focused on AWS infrastructure, reliable systems, automation, and measurable engineering outcomes.`;
}

export async function POST(request: Request) {
  let payload: AiCompanionRequest;

  try {
    payload = (await request.json()) as AiCompanionRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const message = cleanText(payload.message);

  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  // /admin/settings (AI Companion section) takes precedence; env vars remain a fallback.
  const config = await getSiteConfig().catch(() => null);

  if (config && config.aiEnabled === false && !process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      answer: fallbackAnswer(message),
      mode: "local-preview",
    });
  }

  const apiKey = config?.openaiApiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      answer: fallbackAnswer(message),
      mode: "local-preview",
    });
  }

  const history = Array.isArray(payload.history) ? payload.history.slice(-8) : [];
  const context = buildPortfolioContext();
  const transcript = history.map((item) => `${item.role === "user" ? "Visitor" : "Companion"}: ${item.content}`).join("\n");

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config?.openaiModel || process.env.OPENAI_MODEL || "gpt-4o-mini",
        instructions: [
          config?.aiSystemPrompt?.trim() ||
            [
              "You are the AI companion on Bhargava Teja Borra's portfolio.",
              "Answer in first person only when referring to the companion, not as Bhargava.",
              "Use only the provided portfolio context. If a detail is missing, say that directly.",
              "Keep answers concise, specific, recruiter-friendly, and under 140 words unless asked for detail.",
            ].join("\n\n"),
          `Portfolio context:\n${context}`,
        ].join("\n\n"),
        input: `${transcript ? `Conversation so far:\n${transcript}\n\n` : ""}Visitor question: ${message}`,
        max_output_tokens: 420,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          answer: fallbackAnswer(message),
          mode: "local-preview",
          warning: `OpenAI request failed: ${response.status} ${errorText.slice(0, 180)}`,
        },
        { status: 200 },
      );
    }

    const data = (await response.json()) as { output_text?: string };
    const answer = cleanText(data.output_text) || fallbackAnswer(message);

    return NextResponse.json({ answer, mode: "openai" });
  } catch (error) {
    return NextResponse.json(
      {
        answer: fallbackAnswer(message),
        mode: "local-preview",
        warning: error instanceof Error ? error.message : "OpenAI request failed.",
      },
      { status: 200 },
    );
  }
}
