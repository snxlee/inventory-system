import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ barcode: string }> }
) {
  const { barcode } = await params;
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const product = await db.product.findUnique({ where: { barcode } });
  if (!product) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(product);
}
