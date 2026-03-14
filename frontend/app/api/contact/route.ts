import { NextResponse } from "next/server";

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  topic?: unknown;
  message?: unknown;
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
      };
    };

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validatePayload(payload: ContactPayload): ContactValidationResult {
  const name = getString(payload.name);
  const email = getString(payload.email);
  const topic = getString(payload.topic);
  const message = getString(payload.message);

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
    },
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ContactPayload;
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

    const { name, email, topic, message } = validation.data;

    // Replace with email provider integration after MVP validation.
    console.info("[contact_submission]", {
      name,
      email,
      topic,
      messagePreview: `${message.slice(0, 80)}${message.length > 80 ? "..." : ""}`,
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Message received. I will reply within one business day.",
      },
      { status: 201 },
    );
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
}
