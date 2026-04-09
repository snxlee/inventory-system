import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import SalesChart from "@/components/SalesChart";
import { format, subDays } from "date-fns";
import AuditorClient from "./AuditorClient";

export default async function AuditorPage() {
  await requireSession("auditor");

  const now = new Date();
  const weekAgo = subDays(now, 7);
  const monthAgo = subDays(now, 30);

  const [weeklySales, monthlySales, inventoryLogs] = await Promise.all([
    db.sale.findMany({
      where: { createdAt: { gte: weekAgo }, status: "completed" },
      select: { total: true, createdAt: true },
    }),
    db.sale.findMany({
      where: { createdAt: { gte: monthAgo }, status: "completed" },
      select: { total: true, createdAt: true },
    }),
    db.inventoryLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { product: { select: { name: true } } },
    }),
  ]);

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(now, 6 - i);
    const dateStr = format(date, "MM/dd");
    const revenue = weeklySales
      .filter((s: { createdAt: Date }) => format(new Date(s.createdAt), "MM/dd") === dateStr)
      .reduce((sum: number, s: { total: number }) => sum + s.total, 0);
    return { date: dateStr, revenue, count: 0 };
  });

  const monthlyData = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(now, 29 - i);
    const dateStr = format(date, "MM/dd");
    const revenue = monthlySales
      .filter((s: { createdAt: Date }) => format(new Date(s.createdAt), "MM/dd") === dateStr)
      .reduce((sum: number, s: { total: number }) => sum + s.total, 0);
    return { date: dateStr, revenue, count: 0 };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Auditor Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={weeklyData} type="line" title="Weekly Sales (Last 7 Days)" />
        <SalesChart data={monthlyData} type="bar" title="Monthly Sales (Last 30 Days)" />
      </div>

      <AuditorClient inventoryLogs={JSON.parse(JSON.stringify(inventoryLogs))} />
    </div>
  );
}
