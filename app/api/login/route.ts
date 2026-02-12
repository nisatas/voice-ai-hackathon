import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body?.email ?? "").toString().trim();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "email gerekli" },
        { status: 400 }
      );
    }

    // Hackathon için demo token (gerçek güvenlik yok)
    const token = "demo-token-123";

    return NextResponse.json({
      ok: true,
      token,
      user: { email },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "login error" },
      { status: 500 }
    );
  }
}
