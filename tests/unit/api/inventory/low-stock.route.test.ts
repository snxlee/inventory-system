import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionMock, findManyMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  findManyMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSession: getSessionMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    product: {
      findMany: findManyMock,
    },
  },
}));

import { GET } from "@/app/api/inventory/low-stock/route";

describe("GET /api/inventory/low-stock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const response = await GET();
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Unauthorized");
  });

  it("returns only products at or below min quantity", async () => {
    getSessionMock.mockResolvedValueOnce({ userId: "u1", role: "auditor" });
    findManyMock.mockResolvedValueOnce([
      { id: "p1", name: "Rice", quantity: 3, minQuantity: 5 },
      { id: "p2", name: "Milk", quantity: 10, minQuantity: 5 },
      { id: "p3", name: "Eggs", quantity: 5, minQuantity: 5 },
    ]);

    const response = await GET();
    const payload = (await response.json()) as Array<{ id: string; name: string }>;

    expect(response.status).toBe(200);
    expect(payload).toEqual([
      { id: "p1", name: "Rice", quantity: 3, minQuantity: 5 },
      { id: "p3", name: "Eggs", quantity: 5, minQuantity: 5 },
    ]);
    expect(findManyMock).toHaveBeenCalledWith({ orderBy: { quantity: "asc" } });
  });
});
