import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { syncProductsToSheets, syncSalesToSheets } from "@/lib/sheets";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const [products, sales] = await Promise.all([
      db.product.findMany(),
      db.sale.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    ]);
    await syncProductsToSheets(products as Record<string, unknown>[]);
    await syncSalesToSheets(sales as Record<string, unknown>[]);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Sync failed" }, { status: 500 });
  }
}
