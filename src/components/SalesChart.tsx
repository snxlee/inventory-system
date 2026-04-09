"use client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SalesDataPoint {
  date: string;
  revenue: number;
  count: number;
}

interface SalesChartProps {
  data: SalesDataPoint[];
  type?: "line" | "bar";
  title?: string;
}

export default function SalesChart({ data, type = "line", title }: SalesChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {title && <h3 className="font-semibold text-gray-700 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={250}>
        {type === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `₱${Number(v).toFixed(2)}`} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue" dot={false} />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `₱${Number(v).toFixed(2)}`} />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
