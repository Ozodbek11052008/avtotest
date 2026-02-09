import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { text } = (body && typeof body === "object" ? body : {}) as { text?: string };
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json(
        { ok: false, skipped: true, reason: "Telegram not configured (set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID)" },
        { status: 200 }
      );
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    const bodyText = await tgRes.text();
    if (!tgRes.ok) {
      return NextResponse.json(
        { ok: false, error: "Telegram API error", details: bodyText },
        { status: 502 }
      );
    }
    let json: unknown;
    try {
      json = JSON.parse(bodyText);
    } catch {
      json = { result: bodyText };
    }
    return NextResponse.json(json);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

