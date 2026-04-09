import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }
    await createSession(user.id, user.role);
    return Response.json({ success: true, role: user.role });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
