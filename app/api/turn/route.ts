import { NextResponse } from "next/server";

export const runtime = "nodejs";

function pickTranscript(sttData: any): string | undefined {
  return (
    sttData?.text ||
    sttData?.output?.text ||
    sttData?.output?.transcript ||
    sttData?.output?.transcription ||
    sttData?.result?.text
  );
}

export async function POST(req: Request) {
  try {
    // 0) ENV kontrol
    const apiKey = process.env.FAL_API_KEY;
    console.log("KEY SON 6:", apiKey ? apiKey.slice(-6) : "undefined");

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "FAL_API_KEY env bulunamadı. .env.local proje kökünde mi ve içinde FAL_API_KEY=... var mı?",
        },
        { status: 500 }
      );
    }

    // 1) İstek body’si
    const body = await req.json();
    const audioUrl: string | undefined = body.audio_url;

    if (!audioUrl) {
      return NextResponse.json(
        { ok: false, error: "audio_url missing" },
        { status: 400 }
      );
    }

    console.log("POST ÇALIŞTI - audio_url:", audioUrl);

    // 2) FREYA STT (audio_url ile) -> generate endpoint
    const sttResponse = await fetch(
      "https://fal.run/freya-mypsdi253hbk/freya-stt/generate",
      {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        // Bu endpoint audio_url'yu body kökünde istiyor
        body: JSON.stringify({
          audio_url: audioUrl,
        }),
      }
    );

    const sttText = await sttResponse.text();

    // STT JSON parse
    let sttData: any;
    try {
      sttData = JSON.parse(sttText);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "STT response JSON değil",
          stt_raw: sttText,
        },
        { status: 502 }
      );
    }

    console.log("🧪 RAW STT RESPONSE:", JSON.stringify(sttData, null, 2));

    // STT hata döndürdüyse
    if (!sttResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "STT request failed",
          stt_status: sttResponse.status,
          stt_data: sttData,
        },
        { status: 502 }
      );
    }

    const transcript = pickTranscript(sttData);

    if (!transcript) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "STT başarılı ama transcript alanı bulunamadı. RAW STT response’u inceleyin.",
          stt_data: sttData,
        },
        { status: 502 }
      );
    }

    console.log("🎙️ STT ÇIKTI:", transcript);
    console.log("➡️ LLM'E GEÇİYORUM");

    // 3) LLM Router (doğru endpoint) + prompt formatı
    const llmResponse = await fetch("https://fal.run/openrouter/router", {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        prompt: `
Sen bir performans pazarlama uzmanısın.
Kullanıcının sesinden çıkan metne göre reklam çıktıları üret.

KULLANICI METNİ:
${transcript}

Şu formatta döndür (Türkçe):
1) Brief Özeti (1-2 cümle)
2) Hedef Kitle (madde madde)
3) Değer Önerisi + USP
4) 3 Reklam Metni (A/B/C)
5) 5 Başlık
6) 2 CTA
7) Görsel Prompt (1 adet)
8) Platform + Mini Bütçe (örn: IG %50, TikTok %30, Google %20)
        `.trim(),
      }),
    });

    const llmText = await llmResponse.text();
    console.log("🧠 RAW LLM RESPONSE:", llmText);

    // LLM JSON parse
    let llmData: any;
    try {
      llmData = JSON.parse(llmText);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "LLM response JSON değil",
          llm_raw: llmText,
        },
        { status: 502 }
      );
    }

    // LLM hata döndürdüyse
    if (!llmResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "LLM request failed",
          llm_status: llmResponse.status,
          llm_data: llmData,
        },
        { status: 502 }
      );
    }

    // Router çıktısı çoğunlukla output alanında geliyor
    const llmOutput =
      llmData?.output ||
      llmData?.choices?.[0]?.message?.content ||
      llmData?.result ||
      llmData;

    return NextResponse.json({
      ok: true,
      transcript,
      result: llmOutput,
    });
  } catch (error: any) {
    console.error("HATA:", error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
