"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ScanQRPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let canceled = false;
    const start = async () => {
      try {
        const hasDetector =
          typeof (window as any).BarcodeDetector !== "undefined";
        setSupported(hasDetector);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (canceled) return;
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          // Ensure attributes set before attaching stream
          video.playsInline = true;
          video.muted = true;
          video.srcObject = stream;
          // Wait for metadata before playing to avoid play() interruptions
          await new Promise<void>((resolve) => {
            const onMeta = () => {
              video.removeEventListener("loadedmetadata", onMeta);
              resolve();
            };
            video.addEventListener("loadedmetadata", onMeta);
          });
          if (video.paused) {
            try {
              await video.play();
            } catch {
              // Autoplay might be blocked; user interaction will be needed
            }
          }
        }
        if (hasDetector) {
          const detector = new (window as any).BarcodeDetector({
            formats: ["qr_code"],
          });
          scanningRef.current = true;
          const tick = async () => {
            if (!scanningRef.current || canceled) return;
            try {
              const video = videoRef.current;
              if (video && !video.paused && video.readyState >= 2) {
                const barcodes = await detector.detect(video);
                if (barcodes && barcodes.length > 0) {
                  const value =
                    barcodes[0].rawValue || barcodes[0].displayValue;
                  if (value) {
                    scanningRef.current = false;
                    await handleToken(value);
                    return;
                  }
                }
              }
            } catch {}
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        } else {
          toast.message(
            "BarcodeDetector tidak didukung, gunakan input manual.",
          );
        }
      } catch (e) {
        console.error(e);
        toast.error(
          "Gagal mengakses kamera. Izinkan kamera atau gunakan input manual.",
        );
      }
    };
    start();

    return () => {
      canceled = true;
      scanningRef.current = false;
      const video = videoRef.current;
      if (video) {
        try {
          video.pause();
        } catch {}
        video.srcObject = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleToken = async (token: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/participants/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      toast.success(`Check-in berhasil: ${data.data?.name ?? "Peserta"}`);
      router.push("/dashboard/participants");
    } catch (e: any) {
      toast.error(e.message || "Token tidak valid");
      setBusy(false);
      scanningRef.current = true;
    }
  };

  const onManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const token = String(fd.get("token") || "").trim();
    if (!token) return toast.error("Masukkan token QR");
    await handleToken(token);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Scan QR</h1>
          <p className="text-sm text-muted-foreground">
            Arahkan kamera ke QR peserta untuk menandai kehadiran.
          </p>
        </div>
        <Link href="/dashboard/participants">
          <Button variant="outline" size="sm">
            Back to list
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-3 sm:p-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              {supported === null
                ? "Menyiapkan kamera..."
                : supported
                  ? "Pemindaian otomatis aktif"
                  : "Pemindaian otomatis tidak didukung"}
            </div>
            <div className="rounded-md overflow-hidden border">
              <video
                ref={videoRef}
                className="w-full bg-black/70 aspect-video"
                playsInline
                muted
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Tips: Pastikan pencahayaan cukup dan QR berada dalam fokus kamera.
            </div>
          </div>
        </div>

        <form
          onSubmit={onManualSubmit}
          className="rounded-lg border bg-card p-3 sm:p-4 grid gap-3 content-start"
        >
          <div className="grid gap-2">
            <Label htmlFor="token">Token QR (manual)</Label>
            <Input
              id="token"
              name="token"
              placeholder="Tempel token QR di sini"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Memproses..." : "Check-in"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                scanningRef.current = true;
              }}
            >
              Resume Scan
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Gunakan input manual jika kamera tidak tersedia atau gagal
            mendeteksi.
          </div>
        </form>
      </div>
    </div>
  );
}
