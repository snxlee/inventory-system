import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import SalesChart from "@/components/SalesChart";
import InventoryChart from "@/components/InventoryChart";
import StatCard from "@/components/StatCard";
import { format, subDays } from "date-fns";

export default async function ManagerPage() {
  await requireSession("manager");

  const now = new Date();
  const monthAgo = subDays(now, 30);
  const weekAgo = subDays(now, 7);

  const [monthlySales, products, topItems] = await Promise.all([
    db.sale.findMany({
      where: { createdAt: { gte: monthAgo }, status: "completed" },
      select: { total: true, createdAt: true },
    }),
    db.product.findMany({ take: 15, orderBy: { quantity: "asc" } }),
    db.saleItem.findMany({
      where: { sale: { createdAt: { gte: weekAgo } } },
      include: { product: { select: { name: true } } },
    }),
  ]);

  const salesData = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(now, 29 - i);
    const dateStr = format(date, "MM/dd");
    const revenue = monthlySales
      .filter((s: { createdAt: Date }) => format(new Date(s.createdAt), "MM/dd") === dateStr)
      .reduce((sum: number, s: { total: number }) => sum + s.total, 0);
    return { date: dateStr, revenue, count: 0 };
  });

  const productSales = topItems.reduce<Record<string, { name: string; qty: number }>>((acc: Record<string, { name: string; qty: number }>, item: { productId: string; product: { name: string }; quantity: number }) => {
    if (!acc[item.productId]) acc[item.productId] = { name: item.product.name, qty: 0 };
    acc[item.productId].qty += item.quantity;
    return acc;
  }, {});
  const topProducts = Object.values(productSales)
    .sort((a: { name: string; qty: number }, b: { name: string; qty: number }) => b.qty - a.qty)
    .slice(0, 8)
    .map((p: { name: string; qty: number }) => ({ date: p.name.slice(0, 15), revenue: p.qty, count: 0 }));

  const inventoryData = products.slice(0, 10).map((p: { name: string; quantity: number; minQuantity: number }) => ({
    name: p.name.slice(0, 15),
    quantity: p.quantity,
    minQuantity: p.minQuantity,
  }));

  const totalRevenue = monthlySales.reduce((sum: number, s: { total: number }) => sum + s.total, 0);
  const totalSales = monthlySales.length;
  const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Manager Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Monthly Revenue" value={`₱${totalRevenue.toFixed(0)}`} icon="💰" color="green" />
        <StatCard title="Total Sales" value={totalSales} icon="🛒" color="blue" />
        <StatCard title="Avg Sale Value" value={`₱${avgSale.toFixed(0)}`} icon="📊" color="purple" />
        <StatCard title="Products" value={products.length} icon="📦" color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={salesData} type="line" title="Sales Revenue (Last 30 Days)" />
        <SalesChart data={topProducts} type="bar" title="Top Selling Products (This Week)" />
      </div>

      <InventoryChart data={inventoryData} title="Inventory Levels (Low Stock First)" />
    </div>
  );
}
