import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSessionMock,
  saleFindManyMock,
  saleCountMock,
  saleCreateMock,
  productUpdateMock,
  inventoryLogCreateMock,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  saleFindManyMock: vi.fn(),
  saleCountMock: vi.fn(),
  saleCreateMock: vi.fn(),
  productUpdateMock: vi.fn(),
  inventoryLogCreateMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSession: getSessionMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    sale: {
      findMany: saleFindManyMock,
      count: saleCountMock,
      create: saleCreateMock,
    },
    product: {
      update: productUpdateMock,
    },
    inventoryLog: {
      create: inventoryLogCreateMock,
    },
  },
}));

import { GET, POST } from "@/app/api/sales/route";

describe("/api/sales route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const response = await GET(new Request("http://localhost/api/sales"));
    expect(response.status).toBe(401);
  });

  it("GET returns paged sales for authenticated users", async () => {
    getSessionMock.mockResolvedValueOnce({ userId: "clerk-1", role: "clerk" });
    saleFindManyMock.mockResolvedValueOnce([{ id: "s1", total: 150 }]);
    saleCountMock.mockResolvedValueOnce(1);

    const response = await GET(new Request("http://localhost/api/sales?page=1&limit=10"));
    const payload = (await response.json()) as {
      sales: Array<{ id: string; total: number }>;
      total: number;
      page: number;
      pages: number;
    };

    expect(response.status).toBe(200);
    expect(payload.total).toBe(1);
    expect(payload.sales[0].id).toBe("s1");
  });

  it("POST creates sale, updates stock, and writes inventory logs", async () => {
    getSessionMock.mockResolvedValueOnce({ userId: "clerk-1", role: "clerk" });
    saleCreateMock.mockResolvedValueOnce({ id: "sale-1", items: [{ productId: "p1", quantity: 2 }] });

    const response = await POST(
      new Request("http://localhost/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            { productId: "p1", quantity: 2, price: 10 },
            { productId: "p2", quantity: 1, price: 5 },
          ],
          discount: 3,
          paymentMethod: "cash",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(saleCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clerkId: "clerk-1",
          total: 22,
          discount: 3,
          paymentMethod: "cash",
        }),
      }),
    );
    expect(productUpdateMock).toHaveBeenCalledTimes(2);
    expect(inventoryLogCreateMock).toHaveBeenCalledTimes(2);
  });
});
