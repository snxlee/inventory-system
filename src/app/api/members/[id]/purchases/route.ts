import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const sales = await db.sale.findMany({
    where: { memberId: id },
    include: { items: { include: { product: true } }, clerk: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(sales);
}
