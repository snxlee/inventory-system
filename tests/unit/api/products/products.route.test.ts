import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionMock, findManyMock, countMock, createMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSession: getSessionMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    product: {
      findMany: findManyMock,
      count: countMock,
      create: createMock,
    },
  },
}));

import { GET, POST } from "@/app/api/products/route";

describe("/api/products route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 without session", async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const response = await GET(new Request("http://localhost/api/products"));
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Unauthorized");
  });

  it("GET returns paginated products for authenticated user", async () => {
    getSessionMock.mockResolvedValueOnce({ userId: "u1", role: "clerk" });
    findManyMock.mockResolvedValueOnce([{ id: "p1", name: "Rice" }]);
    countMock.mockResolvedValueOnce(1);

    const response = await GET(
      new Request("http://localhost/api/products?search=rice&category=Food&page=1&limit=10"),
    );
    const payload = (await response.json()) as {
      products: Array<{ id: string; name: string }>;
      total: number;
      page: number;
      pages: number;
    };

    expect(response.status).toBe(200);
    expect(payload.total).toBe(1);
    expect(payload.page).toBe(1);
    expect(payload.pages).toBe(1);
    expect(payload.products[0].name).toBe("Rice");
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
        orderBy: { name: "asc" },
      }),
    );
  });

  it("POST returns 403 for non-manager/admin", async () => {
    getSessionMock.mockResolvedValueOnce({ userId: "u1", role: "auditor" });

    const response = await POST(
      new Request("http://localhost/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Product" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("POST creates product for manager", async () => {
    getSessionMock.mockResolvedValueOnce({ userId: "u2", role: "manager" });
    createMock.mockResolvedValueOnce({ id: "p2", name: "Cooking Oil" });

    const response = await POST(
      new Request("http://localhost/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Cooking Oil", barcode: "111", price: 55, quantity: 7 }),
      }),
    );
    const payload = (await response.json()) as { id: string; name: string };

    expect(response.status).toBe(201);
    expect(payload.name).toBe("Cooking Oil");
    expect(createMock).toHaveBeenCalledTimes(1);
  });
});
