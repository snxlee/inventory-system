import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  if (!user) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(user);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { name, email, role, active, password } = await request.json() as {
      name?: string; email?: string; role?: string; active?: boolean; password?: string;
    };
    const updateData: Record<string, unknown> = { name, email, role, active };
    if (password) updateData.passwordHash = await bcrypt.hash(password, 10);
    Object.keys(updateData).forEach((k) => updateData[k] === undefined && delete updateData[k]);
    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    return Response.json(user);
  } catch {
    return Response.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await db.user.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
