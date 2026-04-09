"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface InventoryDataPoint {
  name: string;
  quantity: number;
  minQuantity: number;
}

interface InventoryChartProps {
  data: InventoryDataPoint[];
  title?: string;
}

export default function InventoryChart({ data, title }: InventoryChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {title && <h3 className="font-semibold text-gray-700 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
          <Tooltip />
          <Bar dataKey="quantity" name="Stock">
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.quantity <= entry.minQuantity ? "#ef4444" : "#22c55e"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
