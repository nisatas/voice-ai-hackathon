import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false, error: "FAL_API_KEY yok" }, { status: 500 });

    const body = await req.json();
    const text = (body?.text ?? "").toString().trim();

    if (!text) {
      return NextResponse.json({ ok: false, error: "text gerekli" }, { status: 400 });
    }

    const r = await fetch("https://fal.run/openrouter/router", {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        prompt: `
Sen bir reklam ajansı asistansın.
Aşağıdaki metinden kampanya paketi çıkar.

METİN:
${text}

JSON olarak döndür (sadece JSON):
{
  "brief_summary": "...",
  "target_audience": ["..."],
  "usp": "...",
  "ad_copies": ["A...", "B...", "C..."],
  "headlines": ["..."],
  "ctas": ["...","..."],
  "image_prompt": "...",
  "instagram_caption": "...",
  "facebook_post": "...",
  "hashtags": ["...","..."]
}
        `.trim(),
      }),
    });

    const rawText = await r.text();
    let data: any;
    try { data = JSON.parse(rawText); } catch { data = rawText; }

    if (!r.ok) {
      return NextResponse.json({ ok: false, error: "LLM failed", detail: data }, { status: 502 });
    }

    // Router genelde output döndürür
    return NextResponse.json({ ok: true, raw: data, output: data?.output ?? data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "error" }, { status: 500 });
  }
}
