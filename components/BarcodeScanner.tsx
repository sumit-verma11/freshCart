"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { haptic } from "@/lib/haptics";

interface BarcodeScannerProps {
  onScan:  (code: string) => void;
  onClose: () => void;
}

/**
 * Full-screen camera overlay that scans barcodes using @zxing/browser.
 * Dynamically import this component with `ssr: false`.
 */
export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stopped = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let readerInstance: any = null;

    async function start() {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      readerInstance = reader;
      if (stopped || !videoRef.current) return;

      try {
        await reader.decodeFromVideoDevice(
          undefined, // use default camera
          videoRef.current,
          (result, err) => {
            if (result) {
              haptic(100);
              onScan(result.getText());
            }
            // suppress continuous "not found" errors
            void err;
          }
        );
      } catch {
        // camera permission denied or unavailable
      }
    }

    start();

    return () => {
      stopped = true;
      readerInstance?.reset();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col">
      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Targeting reticle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-60 h-60 rounded-2xl border-4 border-primary animate-pulse"
          style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)" }}
        />
        <p className="absolute bottom-[calc(50%-140px)] text-white text-sm font-semibold
                       bg-black/50 px-4 py-1.5 rounded-full">
          Point at barcode
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20
                   text-white flex items-center justify-center hover:bg-white/30
                   transition-colors"
        aria-label="Close scanner"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
