"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import {
  IconCamera,
  IconQrcode,
  IconUsers,
  IconChevronRight,
} from "@tabler/icons-react";

const Home = () => {
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-svh">
      {/* Hero */}
      <section className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 pb-14 pt-16 text-center sm:gap-8 sm:pb-20 sm:pt-20">
        <Badge variant="outline" className="mb-2">
          Solusi Absensi Gathering
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Kelola Absensi Peserta dengan QR Code, cepat dan akurat
        </h1>
        <p className="text-muted-foreground max-w-2xl text-base sm:text-lg">
          Tambah peserta sekali klik, generate QR otomatis, dan tandai kehadiran
          dengan pemindaian kamera. Data tersaji rapi dan real-time.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Buka Dashboard
                  <IconChevronRight className="size-4" />
                </Button>
              </Link>
              <Link href="/dashboard/participants/add">
                <Button variant="outline" size="lg">
                  Tambah Peserta
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button size="lg" className="gap-2">
                  Masuk <IconChevronRight className="size-4" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Fitur */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <IconUsers className="size-5" />
                Tambah Peserta & QR
              </CardTitle>
              <CardDescription>
                Input nama dan NIK, QR code dibuat otomatis untuk setiap
                peserta.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Simpan dan unduh QR untuk dicetak atau dibagikan.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <IconQrcode className="size-5" />
                Pindai QR & Tandai Hadir
              </CardTitle>
              <CardDescription>
                Pemindaian via kamera perangkat atau input token manual.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Sekali pindai, status langsung menjadi &quot;Hadir&quot;.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <IconCamera className="size-5" />
                Data Tersaji Rapi
              </CardTitle>
              <CardDescription>
                Table peserta dengan filter, urut, dan pagination.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Lihat total, hadir, dan peserta terbaru di dashboard.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA akhir */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-xl border bg-card p-6 text-center sm:p-10">
          <h2 className="text-xl font-semibold sm:text-2xl">
            Siap memulai absensi yang lebih cepat?
          </h2>
          <p className="text-muted-foreground mt-2">
            Masuk sekarang dan kelola peserta gathering Anda.
          </p>
        </div>
      </section>
    </div>
  );
};
export default Home;
