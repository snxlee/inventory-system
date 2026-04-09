import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionMock, saleFindManyMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  saleFindManyMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSession: getSessionMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    sale: {
      findMany: saleFindManyMock,
    },
  },
}));

import { GET } from "@/app/api/members/[id]/purchases/route";

describe("GET /api/members/[id]/purchases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const response = await GET(new Request("http://localhost/api/members/m1/purchases"), {
      params: Promise.resolve({ id: "m1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns member purchases sorted by createdAt desc", async () => {
    getSessionMock.mockResolvedValueOnce({ userId: "u1", role: "auditor" });
    saleFindManyMock.mockResolvedValueOnce([
      { id: "s2", memberId: "m1", total: 50 },
      { id: "s1", memberId: "m1", total: 30 },
    ]);

    const response = await GET(new Request("http://localhost/api/members/m1/purchases"), {
      params: Promise.resolve({ id: "m1" }),
    });
    const payload = (await response.json()) as Array<{ id: string; memberId: string; total: number }>;

    expect(response.status).toBe(200);
    expect(payload).toHaveLength(2);
    expect(payload[0].id).toBe("s2");
    expect(saleFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { memberId: "m1" },
        orderBy: { createdAt: "desc" },
      }),
    );
  });
});
