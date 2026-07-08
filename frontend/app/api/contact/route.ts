import { NextResponse } from "next/server";

import { recordChange } from "@/lib/change-log";
import { createContactSubmission } from "@/lib/insights-store";

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
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
        phone: string;
        topic: string;
        message: string;
        website: string;
      };
    };

interface ContactSubmission {
  name: string;
  email: string;
  phone?: string;
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
  const phone = getString(payload.phone);
  const topic = getString(payload.topic);
  const message = getString(payload.message);
  const website = getString(payload.website);

  if (!name || name.length < 2) {
    return { ok: false, message: "Please provide your name (at least 2 characters)." };
  }

  if (!email || !email.includes("@")) {
    return { ok: false, message: "Please provide a valid email address." };
  }

  if (phone && phone.length < 7) {
    return { ok: false, message: "Please provide a valid phone number or leave it blank." };
  }

  if (!message || message.length < 10) {
    return { ok: false, message: "Please provide a short message (at least 10 characters)." };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      phone,
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
  const webhookUrl = process.env.CONTACT_WEBHOOK_URL?.trim();
  const toEmail = process.env.CONTACT_TO_EMAIL?.trim();
  const payload = {
    ...submission,
    to: toEmail || undefined,
    submittedAt: new Date().toISOString(),
  };

  if (webhookUrl) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.CONTACT_WEBHOOK_SECRET
          ? { Authorization: `Bearer ${process.env.CONTACT_WEBHOOK_SECRET}` }
          : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Contact webhook failed with ${response.status}`);
    }

    return;
  }

  console.info("[contact_submission]", {
    name: submission.name,
    email: submission.email,
    phone: submission.phone || undefined,
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

  const { name, email, phone, topic, message, website } = validation.data;
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

  // Persist to the admin inbox first (best-effort — never blocks delivery).
  const submissionId = await createContactSubmission({
    name,
    email,
    phone: phone || null,
    topic: topic || "Portfolio contact",
    message,
  });
  if (submissionId) {
    await recordChange({
      entity: "settings",
      action: "create",
      entityId: submissionId,
      field: "contact",
      summary: `New contact message from ${name}`,
    });
  }

  try {
    await deliverContactSubmission({
      name,
      email,
      phone,
      topic: topic || "Portfolio contact",
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
