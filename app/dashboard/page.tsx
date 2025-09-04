import React from "react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { db } from "@/db/drizzle";
import { participant } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import {
  ParticipantsTable,
  type ParticipantRow,
} from "@/components/participants-table";
import { unstable_cache } from "next/cache";

// Force dynamic rendering to prevent prerender errors
export const dynamic = "force-dynamic";

const getStats = unstable_cache(
  async () => {
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(participant);
    const [{ value: hadirCount }] = await db
      .select({ value: count() })
      .from(participant)
      .where(eq(participant.hadir, true));
    return { total, hadirCount } as const;
  },
  ["participants-stats"],
  { revalidate: 10, tags: ["participants"] },
);

const getLatest = unstable_cache(
  async () => {
    const latestRows = await db
      .select({
        id: participant.id,
        name: participant.name,
        nik: participant.nik,
        hadir: participant.hadir,
        qrToken: participant.qrToken,
        createdAt: participant.createdAt,
      })
      .from(participant)
      .orderBy(desc(participant.createdAt))
      .limit(10);
    return latestRows as typeof latestRows;
  },
  ["participants-latest"],
  { revalidate: 10, tags: ["participants"] },
);

const DashboardIndexPage = async () => {
  const { total, hadirCount } = await getStats();
  const belum = total - hadirCount;
  const rate = total > 0 ? (hadirCount / total) * 100 : 0;

  const latestRows = await getLatest();

  const latest: ParticipantRow[] = latestRows.map((p) => ({
    id: p.id,
    name: p.name,
    nik: p.nik,
    hadir: p.hadir,
    qrToken: p.qrToken,
  }));

  return (
    <>
      <SectionCards
        total={total}
        hadir={hadirCount}
        belum={belum}
        rate={rate}
      />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <div className="px-4 lg:px-6">
        <h2 className="mb-3 text-base font-semibold">Peserta Terbaru</h2>
        <div className="rounded-lg border bg-card p-3 sm:p-4">
          <ParticipantsTable data={latest} />
        </div>
      </div>
    </>
  );
};
export default DashboardIndexPage;
