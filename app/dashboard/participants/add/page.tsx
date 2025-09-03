"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

const schema = z.object({
  name: z.string().min(2, "Minimal 2 karakter"),
  nik: z.string().min(4, "Minimal 4 karakter"),
});

type FormValues = z.infer<typeof schema>;

type Created = {
  id: string;
  name: string;
  nik: string;
  qrToken: string;
  hadir: boolean;
};

const AddParticipantPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });
  const [created, setCreated] = useState<Created | null>(null);

  const onSubmit = async (values: FormValues) => {
    setCreated(null);
    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal menyimpan");
      setCreated(data.data);
      toast.success("Participant created");
      reset();
    } catch (e: any) {
      toast.error(e.message || "Gagal membuat participant");
    }
  };

  const copyToken = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.qrToken);
      toast.success("Token disalin ke clipboard");
    } catch {
      toast.error("Gagal menyalin token");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Add Participant
          </h1>
          <p className="text-sm text-muted-foreground">
            Masukkan nama dan NIK untuk menghasilkan QR.
          </p>
        </div>
        <Link href="/dashboard/participants">
          <Button variant="outline" size="sm">
            Back to list
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-lg border bg-card p-3 sm:p-4 grid gap-4 content-start"
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Nama peserta" {...register("name")} />
            {errors.name && (
              <span className="text-xs text-red-500">
                {errors.name.message}
              </span>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nik">NIK</Label>
            <Input id="nik" placeholder="NIK peserta" {...register("nik")} />
            {errors.nik && (
              <span className="text-xs text-red-500">{errors.nik.message}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Save & Generate QR"}
            </Button>
            <Button type="button" variant="outline" onClick={() => reset()}>
              Reset
            </Button>
          </div>
        </form>

        <div className="rounded-lg border bg-card p-3 sm:p-4 grid gap-3 content-start">
          {!created ? (
            <div className="text-sm text-muted-foreground">
              QR akan tampil di sini setelah peserta disimpan.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                QR untuk:{" "}
                <span className="font-medium text-foreground">
                  {created.name}
                </span>
              </div>
              <div className="rounded-md overflow-hidden border w-fit bg-white p-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(created.qrToken)}`}
                  alt="QR Code"
                  width={220}
                  height={220}
                />
              </div>
              <div className="text-xs break-all">Token: {created.qrToken}</div>
              <div className="flex gap-2">
                <Button size="sm" onClick={copyToken}>
                  Copy Token
                </Button>
                <a
                  className="text-primary underline text-sm leading-8"
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(created.qrToken)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buka QR (cetak)
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddParticipantPage;
