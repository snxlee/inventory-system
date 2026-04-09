import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "daily";
  const now = new Date();

  let from: Date;
  if (period === "weekly") {
    from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "monthly") {
    from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const sales = await db.sale.findMany({
    where: { createdAt: { gte: from }, status: "completed" },
    select: { total: true, createdAt: true },
  });

  const totalRevenue = sales.reduce((sum: number, s: { total: number }) => sum + s.total, 0);
  const count = sales.length;

  return Response.json({ totalRevenue, count, period, from });
}
