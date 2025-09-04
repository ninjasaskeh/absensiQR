import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { participant } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionCookie } from "better-auth/cookies";
import { revalidateTag } from "next/cache";

// Mark hadir by QR token
export async function POST(req: NextRequest) {
  try {
    const sessionCookie = getSessionCookie(req);
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const token: string | undefined = body?.token || body?.qrToken;
    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }
    const existing = await db
      .select()
      .from(participant)
      .where(eq(participant.qrToken, token))
      .limit(1);
    if (!existing.length) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 },
      );
    }
    if (existing[0].hadir) {
      return NextResponse.json(
        { error: "Participant already checked in", data: existing[0] },
        { status: 409 },
      );
    }
    const [updated] = await db
      .update(participant)
      .set({ hadir: true, updatedAt: new Date() })
      .where(eq(participant.qrToken, token))
      .returning();

    // Invalidate ISR caches tagged with 'participants'
    revalidateTag("participants");

    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }
}
