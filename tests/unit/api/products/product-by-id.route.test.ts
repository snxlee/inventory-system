import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionMock, findUniqueMock, updateMock, deleteMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSession: getSessionMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    product: {
      findUnique: findUniqueMock,
      update: updateMock,
      delete: deleteMock,
    },
  },
}));

import { GET, PUT, DELETE } from "@/app/api/products/[id]/route";

describe("/api/products/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      getSessionMock.mockResolvedValueOnce(null);

      const response = await GET(new Request("http://localhost/api/products/p1"), {
        params: Promise.resolve({ id: "p1" }),
      });

      expect(response.status).toBe(401);
    });

    it("returns 404 when product not found", async () => {
      getSessionMock.mockResolvedValueOnce({ userId: "u1", role: "clerk" });
      findUniqueMock.mockResolvedValueOnce(null);

      const response = await GET(new Request("http://localhost/api/products/p999"), {
        params: Promise.resolve({ id: "p999" }),
      });

      expect(response.status).toBe(404);
    });

    it("returns product details for authenticated user", async () => {
      getSessionMock.mockResolvedValueOnce({ userId: "u1", role: "clerk" });
      findUniqueMock.mockResolvedValueOnce({ id: "p1", name: "Rice", price: 50 });

      const response = await GET(new Request("http://localhost/api/products/p1"), {
        params: Promise.resolve({ id: "p1" }),
      });
      const payload = (await response.json()) as { id: string; name: string; price: number };

      expect(response.status).toBe(200);
      expect(payload.name).toBe("Rice");
    });
  });

  describe("PUT", () => {
    it("returns 403 when unauthenticated", async () => {
      getSessionMock.mockResolvedValueOnce(null);

      const response = await PUT(
        new Request("http://localhost/api/products/p1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Updated Rice" }),
        }),
        { params: Promise.resolve({ id: "p1" }) },
      );

      expect(response.status).toBe(403);
    });

    it("returns 403 for non-admin and non-manager", async () => {
      getSessionMock.mockResolvedValueOnce({ userId: "u1", role: "auditor" });

      const response = await PUT(
        new Request("http://localhost/api/products/p1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Updated Rice" }),
        }),
        { params: Promise.resolve({ id: "p1" }) },
      );

      expect(response.status).toBe(403);
      expect(updateMock).not.toHaveBeenCalled();
    });

    it("updates product for manager", async () => {
      getSessionMock.mockResolvedValueOnce({ userId: "u2", role: "manager" });
      updateMock.mockResolvedValueOnce({ id: "p1", name: "Updated Rice" });

      const response = await PUT(
        new Request("http://localhost/api/products/p1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Updated Rice", price: 60 }),
        }),
        { params: Promise.resolve({ id: "p1" }) },
      );
      const payload = (await response.json()) as { id: string; name: string };

      expect(response.status).toBe(200);
      expect(payload.name).toBe("Updated Rice");
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "p1" },
          data: { name: "Updated Rice", price: 60 },
        }),
      );
    });

    it("returns 500 on update failure", async () => {
      getSessionMock.mockResolvedValueOnce({ userId: "u2", role: "manager" });
      updateMock.mockRejectedValueOnce(new Error("db error"));

      const response = await PUT(
        new Request("http://localhost/api/products/p1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Updated Rice" }),
        }),
        { params: Promise.resolve({ id: "p1" }) },
      );
      const payload = (await response.json()) as { error: string };

      expect(response.status).toBe(500);
      expect(payload.error).toBe("Failed to update product");
    });
  });

  describe("DELETE", () => {
    it("returns 403 when unauthenticated", async () => {
      getSessionMock.mockResolvedValueOnce(null);

      const response = await DELETE(new Request("http://localhost/api/products/p1"), {
        params: Promise.resolve({ id: "p1" }),
      });

      expect(response.status).toBe(403);
    });

    it("returns 403 for non-admin", async () => {
      getSessionMock.mockResolvedValueOnce({ userId: "u1", role: "manager" });

      const response = await DELETE(new Request("http://localhost/api/products/p1"), {
        params: Promise.resolve({ id: "p1" }),
      });

      expect(response.status).toBe(403);
      expect(deleteMock).not.toHaveBeenCalled();
    });

    it("deletes product for admin", async () => {
      getSessionMock.mockResolvedValueOnce({ userId: "u3", role: "admin" });
      deleteMock.mockResolvedValueOnce({ id: "p1" });

      const response = await DELETE(new Request("http://localhost/api/products/p1"), {
        params: Promise.resolve({ id: "p1" }),
      });
      const payload = (await response.json()) as { success: boolean };

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(deleteMock).toHaveBeenCalledWith({ where: { id: "p1" } });
    });

    it("returns 500 on delete failure", async () => {
      getSessionMock.mockResolvedValueOnce({ userId: "u3", role: "admin" });
      deleteMock.mockRejectedValueOnce(new Error("db error"));

      const response = await DELETE(new Request("http://localhost/api/products/p1"), {
        params: Promise.resolve({ id: "p1" }),
      });
      const payload = (await response.json()) as { error: string };

      expect(response.status).toBe(500);
      expect(payload.error).toBe("Failed to delete product");
    });
  });
});
