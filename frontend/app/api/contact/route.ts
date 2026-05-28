import { NextResponse } from "next/server";

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  topic?: unknown;
  message?: unknown;
  website?: unknown;
}

type ContactValidationResult =
  | { ok: false; message: string }
  | {
      ok: true;
      data: {
        name: string;
        email: string;
        topic: string;
        message: string;
        website: string;
      };
    };

interface ContactSubmission {
  name: string;
  email: string;
  topic: string;
  message: string;
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const requestLog = new Map<string, number[]>();

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validatePayload(payload: ContactPayload): ContactValidationResult {
  const name = getString(payload.name);
  const email = getString(payload.email);
  const topic = getString(payload.topic);
  const message = getString(payload.message);
  const website = getString(payload.website);

  if (!name || name.length < 2) {
    return { ok: false, message: "Please provide your name (at least 2 characters)." };
  }

  if (!email || !email.includes("@")) {
    return { ok: false, message: "Please provide a valid email address." };
  }

  if (!topic) {
    return { ok: false, message: "Please select a topic." };
  }

  if (!message || message.length < 10) {
    return { ok: false, message: "Please provide a short message (at least 10 characters)." };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      topic,
      message,
      website,
    },
  };
}

function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

function isRateLimited(clientKey: string, now = Date.now()): boolean {
  const recentRequests = requestLog.get(clientKey) ?? [];
  const validWindow = recentRequests.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (validWindow.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(clientKey, validWindow);
    return true;
  }

  validWindow.push(now);
  requestLog.set(clientKey, validWindow);
  return false;
}

function isLikelyBotSubmission(website: string): boolean {
  return website.length > 0;
}

async function deliverContactSubmission(submission: ContactSubmission): Promise<void> {
  // Provider integration hook:
  // 1) map submission fields to provider payload
  // 2) await provider client call
  // 3) throw on provider failure to return a 5xx response
  console.info("[contact_submission]", {
    name: submission.name,
    email: submission.email,
    topic: submission.topic,
    messagePreview: `${submission.message.slice(0, 80)}${submission.message.length > 80 ? "..." : ""}`,
  });
}

export async function POST(request: Request) {
  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_JSON",
          message: "Unable to process the request payload.",
        },
      },
      { status: 400 },
    );
  }

  const validation = validatePayload(payload);

  if (!validation.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validation.message,
        },
      },
      { status: 400 },
    );
  }

  const { name, email, topic, message, website } = validation.data;
  const clientKey = getClientKey(request);

  if (isLikelyBotSubmission(website)) {
    return NextResponse.json(
      {
        ok: true,
        message: "Message received. I will reply within one business day.",
      },
      { status: 202 },
    );
  }

  if (isRateLimited(clientKey)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please wait a minute before trying again.",
        },
      },
      { status: 429 },
    );
  }

  try {
    await deliverContactSubmission({
      name,
      email,
      topic,
      message,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "DELIVERY_ERROR",
          message: "Message delivery failed. Please email directly.",
        },
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      message: "Message received. I will reply within one business day.",
    },
    { status: 201 },
  );
}
