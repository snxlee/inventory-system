import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const sale = await db.sale.findUnique({
    where: { id },
    include: {
      clerk: { select: { name: true } },
      member: true,
      items: { include: { product: true } },
    },
  });
  if (!sale) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(sale);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["admin", "manager"].includes(session.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { status } = await request.json() as { status: string };
    const sale = await db.sale.update({ where: { id }, data: { status } });
    return Response.json(sale);
  } catch {
    return Response.json({ error: "Failed to update sale" }, { status: 500 });
  }
}
