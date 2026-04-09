import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const allProducts = await db.product.findMany({ orderBy: { quantity: "asc" } });
  const lowStock = allProducts.filter((p: { quantity: number; minQuantity: number }) => p.quantity <= p.minQuantity);
  return Response.json(lowStock);
}
