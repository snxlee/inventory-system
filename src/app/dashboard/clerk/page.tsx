import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import POSClient from "./POSClient";

export default async function ClerkPage() {
  await requireSession("clerk");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todaySalesData, allProducts, recentSales] = await Promise.all([
    db.sale.findMany({
      where: { createdAt: { gte: today }, status: "completed" },
      select: { total: true },
    }),
    db.product.findMany({ select: { quantity: true, minQuantity: true } }),
    db.sale.findMany({
      where: { createdAt: { gte: today } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        items: { include: { product: { select: { name: true } } } },
      },
    }),
  ]);

  const todaySales = todaySalesData.length;
  const todayRevenue = todaySalesData.reduce((sum: number, s: { total: number }) => sum + s.total, 0);
  const lowStockCount = allProducts.filter((p: { quantity: number; minQuantity: number }) => p.quantity <= p.minQuantity).length;

  return (
    <POSClient
      todaySales={todaySales}
      todayRevenue={todayRevenue}
      lowStockCount={lowStockCount}
      recentSales={JSON.parse(JSON.stringify(recentSales))}
    />
  );
}
