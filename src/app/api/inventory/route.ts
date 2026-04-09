import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    db.inventoryLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { name: true, barcode: true } } },
    }),
    db.inventoryLog.count(),
  ]);

  return Response.json({ logs, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["admin", "manager"].includes(session.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { productId, type, quantity, notes } = await request.json() as {
      productId: string;
      type: string;
      quantity: number;
      notes?: string;
    };
    const log = await db.inventoryLog.create({ data: { productId, type, quantity, notes } });
    await db.product.update({
      where: { id: productId },
      data: { quantity: { increment: quantity } },
    });
    return Response.json(log, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to log inventory" }, { status: 500 });
  }
}
