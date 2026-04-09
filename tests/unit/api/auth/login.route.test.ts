import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock, compareMock, createSessionMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  compareMock: vi.fn(),
  createSessionMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: compareMock,
  },
}));

vi.mock("@/lib/auth", () => ({
  createSession: createSessionMock,
}));

import { POST } from "@/app/api/auth/login/route";

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not found", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "missing@coop.com", password: "wrong" }),
    });

    const response = await POST(request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Invalid credentials");
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it("returns 200 and role for valid credentials", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "user_1",
      role: "admin",
      active: true,
      passwordHash: "hashed",
    });
    compareMock.mockResolvedValueOnce(true);

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@coop.com", password: "admin123" }),
    });

    const response = await POST(request);
    const payload = (await response.json()) as { success: boolean; role: string };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ success: true, role: "admin" });
    expect(createSessionMock).toHaveBeenCalledWith("user_1", "admin");
  });
});
