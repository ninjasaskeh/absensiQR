import React from "react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { db } from "@/db/drizzle";
import { participant } from "@/db/schema";
import { desc } from "drizzle-orm";
import {
  ParticipantsTable,
  type ParticipantRow,
} from "@/components/participants-table";

const DashboardIndexPage = async () => {
  const rows = await db
    .select()
    .from(participant)
    .orderBy(desc(participant.createdAt));
  const total = rows.length;
  const hadir = rows.filter((r) => r.hadir).length;
  const belum = total - hadir;
  const rate = total > 0 ? (hadir / total) * 100 : 0;

  const latest: ParticipantRow[] = rows.slice(0, 10).map((p) => ({
    id: p.id,
    name: p.name,
    nik: p.nik,
    hadir: p.hadir,
    qrToken: p.qrToken,
  }));

  return (
    <>
      <SectionCards total={total} hadir={hadir} belum={belum} rate={rate} />
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
