import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body?.email ?? "").toString().trim();
    const password = (body?.password ?? "").toString();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "email ve password gerekli" },
        { status: 400 }
      );
    }

    // Hackathon demo: DB yok, sadece başarılı dönüyoruz
    return NextResponse.json({ ok: true, user: { email } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "error" }, { status: 500 });
  }
}
