import { db } from "@/db/drizzle";
import { participant } from "@/db/schema";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ParticipantsTable } from "@/components/participants-table";
import { Badge } from "@/components/ui/badge";
import { count, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

const getCounts = unstable_cache(
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
  ["participants-counts"],
  { revalidate: 10, tags: ["participants"] },
);

const ParticipantsPage = async () => {
  const { total, hadirCount } = await getCounts();

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
          <Link
            href="/dashboard/participants/add"
            className={buttonVariants({ size: "sm" })}
          >
            Tambah Peserta
          </Link>
          <Link
            href="/dashboard/participants/scan"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Pindai QR
          </Link>
        </div>
      </div>

      {total === 0 ? (
        <div className="grid place-items-center rounded-lg border border-dashed p-12 text-center">
          <div className="space-y-2">
            <p className="text-base font-medium">Belum ada peserta</p>
            <p className="text-sm text-muted-foreground">
              Tambahkan peserta untuk menghasilkan QR dan mulai pemindaian.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/participants/add"
                className={buttonVariants()}
              >
                Tambah Peserta
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <div className="p-3 sm:p-4">
            {/* Provide empty initial data, client table will fetch */}
            <ParticipantsTable data={[]} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantsPage;
