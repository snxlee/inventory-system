import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where = {
    AND: [
      search ? { OR: [{ name: { contains: search } }, { barcode: { contains: search } }] } : {},
      category ? { category } : {},
    ],
  };

  const [products, total] = await Promise.all([
    db.product.findMany({ where, skip, take: limit, orderBy: { name: "asc" } }),
    db.product.count({ where }),
  ]);

  return Response.json({ products, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["admin", "manager"].includes(session.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const data = await request.json();
    const product = await db.product.create({ data });
    return Response.json(product, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create product" }, { status: 500 });
  }
}
