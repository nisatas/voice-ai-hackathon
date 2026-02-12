import { NextResponse } from "next/server";
export const runtime = "nodejs";

function pickAudioUrl(data: any): string | undefined {
  return (
    data?.audio_url ||
    data?.url ||
    data?.output?.audio_url ||
    data?.output?.url ||
    data?.audio?.url ||
    data?.result?.audio_url ||
    data?.data?.audio_url ||
    data?.data?.url ||
    data?.output?.audio?.url
  );
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "FAL_API_KEY yok" }, { status: 500 });
    }

    const body = await req.json();
    const text = (body?.text ?? "").toString().trim();

    if (!text) {
      return NextResponse.json({ ok: false, error: "text gerekli" }, { status: 400 });
    }

    // 1) İlk deneme: { input: { text } }
    const tryPayloads = [
      { input: { text } },
      { text }, // 2) İkinci deneme: { text }
    ];

    let lastRaw: any = null;

    for (const payload of tryPayloads) {
      const r = await fetch("https://fal.run/freya-mypsdi253hbk/freya-tts/generate", {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const rawText = await r.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = rawText;
      }

      console.log("🧪 TTS PAYLOAD:", payload);
      console.log("🧪 RAW TTS RESPONSE:", data);

      lastRaw = { status: r.status, data };

      if (r.ok) {
        const audioUrl = pickAudioUrl(data);
        return NextResponse.json({
          ok: true,
          audio_url: audioUrl,
          raw: data,
        });
      }
    }

    // İki format da olmadıysa:
    return NextResponse.json(
      { ok: false, error: "TTS failed", detail: lastRaw },
      { status: 502 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "error" },
      { status: 500 }
    );
  }
}
