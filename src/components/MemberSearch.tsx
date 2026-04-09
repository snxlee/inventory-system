"use client";
import { useState, useEffect, useRef } from "react";

interface Member {
  id: string;
  memberId: string;
  name: string;
  phone?: string;
}

interface MemberSearchProps {
  onSelect: (member: Member | null) => void;
  selected?: Member | null;
}

export default function MemberSearch({ onSelect, selected }: MemberSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/members?search=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json() as { members: Member[] };
      setResults(data.members || []);
      setOpen(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (selected) {
    return (
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <span className="text-sm font-medium text-blue-800">{selected.name}</span>
        <span className="text-xs text-blue-600">({selected.memberId})</span>
        <button
          onClick={() => { onSelect(null); setQuery(""); }}
          className="ml-auto text-blue-400 hover:text-blue-600 text-xs"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search member (optional)..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
          {results.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { onSelect(m); setOpen(false); setQuery(""); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2"
            >
              <span className="font-medium">{m.name}</span>
              <span className="text-gray-400 text-xs">{m.memberId}</span>
              {m.phone && <span className="text-gray-400 text-xs ml-auto">{m.phone}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
