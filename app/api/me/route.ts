import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "").trim();

  // Hackathon için sadece demo-token-123 kabul edelim
  if (token !== "demo-token-123") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: { email: "demo@user.com" },
  });
}
