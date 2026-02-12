import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false, error: "FAL_API_KEY yok" }, { status: 500 });

    const body = await req.json();
    const prompt = (body?.prompt ?? "").toString().trim();

    if (!prompt) {
      return NextResponse.json({ ok: false, error: "prompt gerekli" }, { status: 400 });
    }

    const r = await fetch("https://fal.run/fal-ai/flux/dev", {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      // Çoğu image modeli { prompt: "..." } kabul eder
      body: JSON.stringify({ prompt }),
    });

    const rawText = await r.text();
    let data: any;
    try { data = JSON.parse(rawText); } catch { data = rawText; }

    if (!r.ok) {
      return NextResponse.json({ ok: false, error: "IMAGE failed", detail: data }, { status: 502 });
    }

    // Bazı modeller images:[{url}] döner; emin olmadığımız için raw da veriyoruz
    const imageUrl = data?.images?.[0]?.url || data?.image?.url;

    return NextResponse.json({ ok: true, image_url: imageUrl, raw: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "error" }, { status: 500 });
  }
}
