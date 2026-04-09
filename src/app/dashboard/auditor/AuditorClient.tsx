"use client";
import { useState } from "react";
import DataTable from "@/components/DataTable";

interface InventoryLog {
  id: string;
  type: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
  product: { name: string };
}

interface Sale {
  id: string;
  total: number;
  createdAt: string;
  discount: number;
  paymentMethod: string;
  items: { product: { name: string }; quantity: number; price: number }[];
}

interface AuditorClientProps {
  inventoryLogs: InventoryLog[];
}

export default function AuditorClient({ inventoryLogs }: AuditorClientProps) {
  const [memberSearch, setMemberSearch] = useState("");
  const [memberSales, setMemberSales] = useState<Sale[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMemberName, setSelectedMemberName] = useState("");

  const searchMember = async () => {
    if (!memberSearch.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/members?search=${encodeURIComponent(memberSearch)}&limit=1`);
      const data = await res.json() as { members: { id: string; name: string }[] };
      if (data.members?.[0]) {
        const member = data.members[0];
        setSelectedMemberName(member.name);
        const salesRes = await fetch(`/api/members/${member.id}/purchases`);
        const sales = await salesRes.json() as Sale[];
        setMemberSales(sales);
      }
    } catch {
      console.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const logColumns = [
    {
      key: "product",
      label: "Product",
      render: (_: unknown, row: Record<string, unknown>) =>
        (row.product as { name: string }).name,
    },
    {
      key: "type",
      label: "Type",
      render: (v: unknown) => (
        <span
          className={`capitalize text-xs px-2 py-0.5 rounded-full ${
            String(v) === "sale" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {String(v)}
        </span>
      ),
    },
    {
      key: "quantity",
      label: "Qty",
      render: (v: unknown) => (
        <span className={Number(v) < 0 ? "text-red-600" : "text-green-600"}>
          {Number(v) > 0 ? "+" : ""}
          {String(v)}
        </span>
      ),
    },
    { key: "notes", label: "Notes", render: (v: unknown) => String(v ?? "-") },
    {
      key: "createdAt",
      label: "Date",
      render: (v: unknown) => new Date(String(v)).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-700 mb-3">Member Purchase History</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchMember()}
            placeholder="Search member name or ID..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={searchMember}
            disabled={searching}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {searching ? "..." : "Search"}
          </button>
        </div>
        {selectedMemberName && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Purchases for: {selectedMemberName}
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {memberSales.map((sale) => (
                <div key={sale.id} className="border border-gray-100 rounded-lg p-3 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-bold text-green-700">₱{sale.total.toFixed(2)}</span>
                  </div>
                  <div className="text-gray-500">
                    {sale.items.map((i) => `${i.product.name} x${i.quantity}`).join(", ")}
                  </div>
                </div>
              ))}
              {memberSales.length === 0 && (
                <p className="text-gray-400 text-xs text-center py-2">No purchases found</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-700 mb-3">Inventory Log</h2>
        <DataTable
          data={inventoryLogs as unknown as Record<string, unknown>[]}
          columns={logColumns}
        />
      </div>
    </div>
  );
}
