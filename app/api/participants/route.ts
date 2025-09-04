import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { participant } from "@/db/schema";
import { eq, ilike, or } from "drizzle-orm";
import { getSessionCookie } from "better-auth/cookies";
import { revalidateTag } from "next/cache";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = getSessionCookie(req);
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("query") || "").trim();
    const limitParam = Number(searchParams.get("limit") || "0");
    let limit = Number.isFinite(limitParam) ? Math.floor(limitParam) : 0;
    if (limit <= 0) limit = 50;
    if (limit > 500) limit = 500;

    const pageParam = Number(searchParams.get("page") || "1");
    const page = Number.isFinite(pageParam)
      ? Math.max(1, Math.floor(pageParam))
      : 1;
    const offset = (page - 1) * limit;

    const base = db.select().from(participant);
    const where = q
      ? or(ilike(participant.name, `%${q}%`), ilike(participant.nik, `%${q}%`))
      : undefined;

    const query = where
      ? base.where(where).orderBy(participant.createdAt)
      : base.orderBy(participant.createdAt);

    // Fetch one extra row to determine if there's a next page
    const rows = await query.limit(limit + 1).offset(offset);
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;

    return NextResponse.json({ data: pageRows, page, limit, hasMore });
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

    // Invalidate caches tagged with 'participants'
    revalidateTag("participants");

    return NextResponse.json({ data: row }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Gagal membuat peserta" },
      { status: 500 },
    );
  }
}
