import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false, error: "FAL_API_KEY yok" }, { status: 500 });

    const body = await req.json();
    const audio_url = body?.audio_url;

    if (!audio_url) {
      return NextResponse.json({ ok: false, error: "audio_url gerekli" }, { status: 400 });
    }

    const r = await fetch("https://fal.run/freya-mypsdi253hbk/freya-stt/generate", {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audio_url }),
    });

    const data = await r.json();

    if (!r.ok) {
      return NextResponse.json({ ok: false, error: "STT failed", detail: data }, { status: 502 });
    }

    // Freya STT şu an { text: "..." } dönüyor
    return NextResponse.json({ ok: true, text: data?.text, raw: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "error" }, { status: 500 });
  }
}
