import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { db } from "@/db/drizzle";
import { session, user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = getSessionCookie(req);
    if (!token) {
      return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
    }

    const sess = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);
    if (!sess.length) {
      return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
    }

    const uid = sess[0].userId;
    const rows = await db.select().from(user).where(eq(user.id, uid)).limit(1);
    if (!rows.length) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 },
      );
    }

    const u = rows[0];
    return NextResponse.json({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image || null,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Gagal mengambil data pengguna" },
      { status: 500 },
    );
  }
}
