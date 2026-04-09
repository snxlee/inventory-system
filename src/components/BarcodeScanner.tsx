"use client";
import { useState, useRef, useEffect } from "react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [manual, setManual] = useState("");
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manual.trim()) {
      onScan(manual.trim());
      setManual("");
    }
  };

  const startCamera = async () => {
    setScanning(true);
    if ("BarcodeDetector" in window) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setTimeout(() => {
          stream.getTracks().forEach((t) => t.stop());
          setScanning(false);
        }, 5000);
      } catch {
        setScanning(false);
      }
    } else {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Scan or type barcode..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Add
        </button>
      </form>
      <button
        onClick={startCamera}
        disabled={scanning}
        className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {scanning ? "Scanning..." : "📷 Use Camera Scanner"}
      </button>
    </div>
  );
}
