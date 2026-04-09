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

import { GET } from "@/app/api/sales/summary/route";

describe("GET /api/sales/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const response = await GET(new Request("http://localhost/api/sales/summary?period=daily"));
    expect(response.status).toBe(401);
  });

  it("returns revenue summary for authenticated user", async () => {
    getSessionMock.mockResolvedValueOnce({ userId: "u1", role: "auditor" });
    saleFindManyMock.mockResolvedValueOnce([
      { total: 120, createdAt: new Date("2026-04-09") },
      { total: 80, createdAt: new Date("2026-04-09") },
    ]);

    const response = await GET(new Request("http://localhost/api/sales/summary?period=weekly"));
    const payload = (await response.json()) as { totalRevenue: number; count: number; period: string };

    expect(response.status).toBe(200);
    expect(payload.totalRevenue).toBe(200);
    expect(payload.count).toBe(2);
    expect(payload.period).toBe("weekly");
  });
});
