import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const [sales, total] = await Promise.all([
    db.sale.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        clerk: { select: { name: true } },
        member: { select: { name: true, memberId: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    }),
    db.sale.count({ where }),
  ]);

  return Response.json({ sales, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { items, memberId, discount, paymentMethod } = await request.json() as {
      items: { productId: string; quantity: number; price: number }[];
      memberId?: string;
      discount?: number;
      paymentMethod?: string;
    };

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0) - (discount || 0);

    const sale = await db.sale.create({
      data: {
        clerkId: session.userId,
        memberId: memberId || null,
        total,
        discount: discount || 0,
        paymentMethod: paymentMethod || "cash",
        status: "completed",
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // Update product quantities
    for (const item of items) {
      await db.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
      await db.inventoryLog.create({
        data: {
          productId: item.productId,
          type: "sale",
          quantity: -item.quantity,
          notes: `Sale ${sale.id}`,
        },
      });
    }

    return Response.json(sale, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
