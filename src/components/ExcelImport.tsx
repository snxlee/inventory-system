"use client";
import { useState, useRef } from "react";

interface ExcelImportProps {
  type: "products" | "members";
  onComplete?: (count: number) => void;
}

export default function ExcelImport({ type, onComplete }: ExcelImportProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setResult("Please select a file"); return; }
    setLoading(true);
    setResult("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json() as { imported?: number; error?: string };
      if (data.error) {
        setResult(`Error: ${data.error}`);
      } else {
        setResult(`Imported ${data.imported} ${type}`);
        onComplete?.(data.imported || 0);
        if (fileRef.current) fileRef.current.value = "";
      }
    } catch {
      setResult("Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2"
        />
        <button
          onClick={handleImport}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Importing..." : `Import ${type}`}
        </button>
      </div>
      {result && (
        <p className={`text-sm ${result.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
          {result}
        </p>
      )}
    </div>
  );
}
