import { db } from "@/db/drizzle";
import { participant } from "@/db/schema";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ParticipantsTable,
  type ParticipantRow,
} from "@/components/participants-table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const ParticipantsPage = async () => {
  const rows = await db.select().from(participant);
  const data: ParticipantRow[] = rows.map((p) => ({
    id: p.id,
    name: p.name,
    nik: p.nik,
    hadir: p.hadir,
    qrToken: p.qrToken,
  }));
  const total = data.length;
  const hadirCount = data.filter((d) => d.hadir).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Peserta</h1>
          <p className="text-sm text-muted-foreground">
            Kelola peserta dan tandai kehadiran melalui QR.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline">Total: {total}</Badge>
            <Badge variant="default">Hadir: {hadirCount}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/participants/add">
            <Button size="sm">Tambah Peserta</Button>
          </Link>
          <Link href="/dashboard/participants/scan">
            <Button variant="outline" size="sm">
              Pindai QR
            </Button>
          </Link>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="grid place-items-center rounded-lg border border-dashed p-12 text-center">
          <div className="space-y-2">
            <p className="text-base font-medium">Belum ada peserta</p>
            <p className="text-sm text-muted-foreground">
              Tambahkan peserta untuk menghasilkan QR dan mulai pemindaian.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/participants/add">
                <Button>Tambah Peserta</Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <div className="p-3 sm:p-4">
            <ParticipantsTable data={data} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantsPage;
