"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { IconCircleCheckFilled, IconLoader } from "@tabler/icons-react";

export type ParticipantRow = {
  id: string;
  name: string;
  nik: string;
  hadir: boolean;
  qrToken: string;
};

export function ParticipantsTable({ data }: { data: ParticipantRow[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pageSize, setPageSize] = React.useState(10);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (d) =>
        d.name.toLowerCase().includes(q) || d.nik.toLowerCase().includes(q),
    );
  }, [data, query]);

  const columns = React.useMemo<ColumnDef<ParticipantRow>[]>(
    () => [
      {
        header: "#",
        cell: ({ row }) => row.index + 1,
        size: 40,
      },
      {
        accessorKey: "name",
        header: "Nama",
        cell: ({ row }) => row.original.name,
      },
      {
        accessorKey: "nik",
        header: "NIK",
        cell: ({ row }) => row.original.nik,
      },
      {
        accessorKey: "hadir",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {row.original.hadir ? (
              <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
            ) : (
              <IconLoader />
            )}
            {row.original.hadir ? "Hadir" : "Belum"}
          </Badge>
        ),
      },
      {
        id: "qr",
        header: "QR",
        cell: ({ row }) => (
          <a
            className="text-primary underline"
            href={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(row.original.qrToken)}`}
            target="_blank"
            rel="noreferrer"
          >
            Lihat QR
          </a>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => {
          const p = row.original;
          const onMark = async () => {
            try {
              const res = await fetch("/api/participants/checkin", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ token: p.qrToken }),
              });
              if (!res.ok) throw new Error("Gagal menandai hadir");
              toast.success("Berhasil menandai hadir");
              router.refresh();
            } catch {
              toast.error("Gagal menandai hadir");
            }
          };
          return (
            <div className="text-right">
              <Button
                size="sm"
                variant="outline"
                onClick={onMark}
                disabled={p.hadir}
              >
                Tandai Hadir
              </Button>
            </div>
          );
        },
      },
    ],
    [router],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  React.useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Filter nama atau NIK..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2">
          <select
            className="h-8 rounded-md border px-2 text-sm"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {[10, 20, 30, 40, 50].map((ps) => (
              <option key={ps} value={ps}>
                {ps} / halaman
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="cursor-pointer select-none"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Tidak ada data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2">
        <div className="text-sm text-muted-foreground">
          Halaman {table.getState().pagination.pageIndex + 1} dari{" "}
          {table.getPageCount() || 1}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}
