import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function getSecret() {
  const value = process.env.JWT_SECRET;
  if (value) return new TextEncoder().encode(value);

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }

  return new TextEncoder().encode("fallback-secret-for-development-only");
}

export async function createSession(userId: string, role: string) {
  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<{ userId: string; role: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecret());
    return { userId: payload.userId as string, role: payload.role as string };
  } catch {
    return null;
  }
}

export async function requireSession(role?: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (role && session.role !== role) redirect("/dashboard");
  return session;
}
