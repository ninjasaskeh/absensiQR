import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { participant } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionCookie } from "better-auth/cookies";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = getSessionCookie(req);
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rows = await db
      .select()
      .from(participant)
      .orderBy(participant.createdAt);
    return NextResponse.json({ data: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to get user!" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = getSessionCookie(req);
    if (!sessionCookie) {
      return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
    }
    const body = await req.json();
    const name: string | undefined = body?.name;
    const nik: string | undefined = body?.nik;
    if (!name || !nik) {
      return NextResponse.json(
        { error: "name dan nik wajib diisi" },
        { status: 400 },
      );
    }
    // Periksa NIK unik
    const exists = await db
      .select()
      .from(participant)
      .where(eq(participant.nik, nik))
      .limit(1);
    if (exists.length) {
      return NextResponse.json(
        { error: "NIK sudah terdaftar" },
        { status: 409 },
      );
    }
    const [row] = await db
      .insert(participant)
      .values({ name, nik })
      .returning();
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Gagal membuat peserta" },
      { status: 500 },
    );
  }
}
