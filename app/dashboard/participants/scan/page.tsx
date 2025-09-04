"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { toast } from "sonner";
import { Camera, CameraOff } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function ScanQRPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [tokenValue, setTokenValue] = useState("");
  const [scannerKb, setScannerKb] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const manualInputRef = useRef<HTMLInputElement | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Minimal typings for BarcodeDetector to avoid any
  type Barcode = { rawValue?: string; displayValue?: string };
  type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => {
    detect: (source: HTMLVideoElement) => Promise<Barcode[]>;
  };

  const handleToken = useCallback(async (token: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/participants/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        // If already checked in, show info and resume scanning
        if (res.status === 409) {
          toast.info(
            `Sudah check-in: ${data?.data?.name ?? "Peserta"} (diabaikan)`,
          );
          setBusy(false);
          scanningRef.current = true;
          manualInputRef.current?.focus();
          return;
        }
        throw new Error(data?.error || "Failed");
      }
      toast.success(`Check-in berhasil: ${data.data?.name ?? "Peserta"}`);
      // Tetap di halaman ini: resume scanning dan refocus input
      setBusy(false);
      scanningRef.current = true;
      manualInputRef.current?.focus();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Token tidak valid";
      toast.error(message);
      setBusy(false);
      scanningRef.current = true;
    }
  }, []);

  useEffect(() => {
    let canceled = false;
    let videoEl: HTMLVideoElement | null = null;
    const stopCamera = () => {
      scanningRef.current = false;
      const video = videoEl || videoRef.current;
      if (video) {
        try {
          video.pause();
        } catch {}
        video.srcObject = null;
      }
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
    const start = async () => {
      try {
        const hasDetector =
          typeof (globalThis as { BarcodeDetector?: unknown })
            .BarcodeDetector !== "undefined";
        setSupported(hasDetector);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (canceled) return;
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          videoEl = video;
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
          const BD = (globalThis as { BarcodeDetector?: BarcodeDetectorCtor })
            .BarcodeDetector;
          if (BD) {
            const detector = new BD({ formats: ["qr_code"] });
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
          }
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
    if (cameraOn) {
      start();
    } else {
      stopCamera();
    }

    return () => {
      canceled = true;
      stopCamera();
    };
  }, [handleToken, cameraOn]);

  const onManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = tokenValue.trim();
    if (!token) return toast.error("Masukkan token QR");
    await handleToken(token);
    // Reset and refocus for next scan
    setTokenValue("");
    manualInputRef.current?.focus();
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
        <div className="flex gap-2">
          <Link
            href="/dashboard/participants"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Back to list
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-3 sm:p-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              {supported === null && cameraOn
                ? "Menyiapkan kamera..."
                : !cameraOn
                  ? "Kamera dimatikan"
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
            <div className="pt-2 items-center justify-center flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCameraOn((v) => !v)}
                aria-label={cameraOn ? "Matikan Kamera" : "Nyalakan Kamera"}
                className="size-8"
              >
                {cameraOn ? (
                  <CameraOff className="size-6" />
                ) : (
                  <Camera className="size-6" />
                )}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Tips: Pastikan pencahayaan cukup dan QR berada dalam fokus kamera.
            </div>
          </div>
        </div>

        <form
          onSubmit={onManualSubmit}
          className="rounded-lg border bg-card p-3 sm:p-4 grid gap-3 content-start self-start"
        >
          <div className="grid gap-2">
            <Label htmlFor="token">Token QR (manual)</Label>
            <Input
              id="token"
              name="token"
              placeholder="Tempel token QR di sini"
              autoFocus
              ref={manualInputRef}
              value={tokenValue}
              onChange={(e) => {
                setTokenValue(e.target.value);
                if (scannerKb) {
                  if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
                  idleTimerRef.current = setTimeout(() => {
                    // Auto-submit after short idle if value exists
                    if (!busy && manualInputRef.current) {
                      manualInputRef.current.form?.requestSubmit();
                    }
                  }, 150);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // Enter from scanner: submit immediately
                  e.preventDefault();
                  if (!busy) {
                    manualInputRef.current?.form?.requestSubmit();
                  }
                }
              }}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                id="scannerKb"
                checked={scannerKb}
                onCheckedChange={(v) => setScannerKb(Boolean(v))}
              />
              <Label htmlFor="scannerKb" className="cursor-pointer">
                Mode Scanner Keyboard: Auto-submit
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => manualInputRef.current?.focus()}
              >
                Fokuskan Input
              </Button>
            </div>
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
              disabled={!cameraOn}
            >
              Resume Scan
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Gunakan input manual jika kamera tidak tersedia atau gagal
            mendeteksi.
            <br />
            Tips: Untuk pemindai QR fisik (USB/Bluetooth), fokuskan input ini.
            Pemindai biasanya bertindak seperti keyboard dan menekan Enter
            setelah mengetik token.
          </div>
        </form>
      </div>
    </div>
  );
}
