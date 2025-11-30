import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { appendFeedback } from "@/lib/feedbackArchive";

const TOPIC_TO_ADDRESS: Record<string, string> = {
  bug: "oops@nexusarchive.lol",
  feature: "suggestions@nexusarchive.lol",
  deck: "decks@nexusarchive.lol",
  other: "contact@nexusarchive.lol",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawTopic = String(body.topic || "other");
    const topic = ["bug", "feature", "deck", "other"].includes(rawTopic)
      ? rawTopic
      : "other";

    const email = body.email ? String(body.email) : "";
    const message = String(body.message || "").trim();

    if (!message) {
      return NextResponse.json(
        { error: "Message cannot be empty." },
        { status: 400 }
      );
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || "465");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error("Missing SMTP env vars.");
      return NextResponse.json(
        { error: "Server email is not configured." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // SSL when 465
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const toAddress = TOPIC_TO_ADDRESS[topic] || "info@nexusarchive.lol";

    // --- FEEDBACK ARCHIVE LOG ---
    const now = new Date().toISOString();
    const userAgent = req.headers.get("user-agent");

    // generate a simple ID (timestamp + random)
    const id =
      now.replace(/\D/g, "").slice(0, 14) +
      "-" +
      Math.random().toString(36).slice(2, 8);

    // Log but don't let failures kill the request
    appendFeedback({
      id,
      topic,
      fromEmail: email || null,
      toEmail: toAddress,
      message,
      createdAt: now,
      userAgent,
    }).catch((err) => {
      console.error("Failed to append feedback log:", err);
    });

    // --- EMAIL SEND ---
    const mailOptions = {
      from: `"NexusArchive Contact" <${smtpUser}>`,
      to: toAddress,
      subject: `NexusArchive ${topic} message`,
      replyTo: email || undefined,
      text: [
        `ID: ${id}`,
        `Topic: ${topic}`,
        `From: ${email || "No email provided"}`,
        `To alias: ${toAddress}`,
        "",
        "Message:",
        message,
        "",
        `Created at: ${now}`,
      ].join("\n"),
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Failed to send the message." },
      { status: 500 }
    );
  }
}
