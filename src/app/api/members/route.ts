import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where = search
    ? { OR: [{ name: { contains: search } }, { memberId: { contains: search } }, { phone: { contains: search } }] }
    : {};

  const [members, total] = await Promise.all([
    db.member.findMany({ where, skip, take: limit, orderBy: { name: "asc" } }),
    db.member.count({ where }),
  ]);

  return Response.json({ members, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["admin", "manager"].includes(session.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const data = await request.json();
    const member = await db.member.create({ data });
    return Response.json(member, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create member" }, { status: 500 });
  }
}
