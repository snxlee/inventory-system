import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionMock, findUniqueMock, updateMock, deleteMock, bcryptHashMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
  bcryptHashMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSession: getSessionMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: findUniqueMock,
      update: updateMock,
      delete: deleteMock,
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: bcryptHashMock,
  },
}));

import { GET, PUT, DELETE } from "@/app/api/users/[id]/route";

describe("/api/users/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 403 when unauthenticated", async () => {
      getSessionMock.mockResolvedValueOnce(null);

      const response = await GET(new Request("http://localhost/api/users/u1"), {
        params: Promise.resolve({ id: "u1" }),
      });

      expect(response.status).toBe(403);
    });

    it("returns 403 for non-admin", async () => {
      getSessionMock.mockResolvedValueOnce({ userId: "u1", role: "manager" });

      const response = await GET(new Request("http://localhost/api/users/u1"), {
        params: Promise.resolve({ id: "u1" }),
      });

      expect(response.status).toBe(403);
    });

    it("returns 404 when user not found", async () => {
      getSessionMock.mockResolvedValueOnce({ userId: "u_admin", role: "admin" });
      findUniqueMock.mockResolvedValueOnce(null);

      const response = await GET(new Request("http://localhost/api/users/u999"), {
        params: Promise.resolve({ id: "u999" }),
      });

      expect(response.status).toBe(404);
    });

    it("returns user details for admin (without password)", async () => {
      getSessionMock.mockResolvedValueOnce({ userId: "u_admin", role: "admin" });
      findUniqueMock.mockResolvedValueOnce({
        id: "u1",
        name: "Alice",
        email: "alice@coop.com",
        role: "manager",
        active: true,
        createdAt: new Date("2026-04-01"),
      });

      const response = await GET(new Request("http://localhost/api/users/u1"), {
        params: Promise.resolve({ id: "u1" }),
      });
      const payload = (await response.json()) as { id: string; name: string; email: string; role: string };

      expect(response.status).toBe(200);
      expect(payload.name).toBe("Alice");
      expect(payload).not.toHaveProperty("passwordHash");
    });
  });

  describe("PUT", () => {
    it("returns 403 when unauthenticated", async () => {
      getSessionMock.mockResolvedValueOnce(null);

      const response = await PUT(
        new Request("http://localhost/api/users/u1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Updated Alice" }),
        }),
        { params: Promise.resolve({ id: "u1" }) },
      );

      expect(response.status).toBe(403);
    });

    it("returns 403 for non-admin", async () => {
      getSessionMock.mockResolvedValueOnce({ userId: "u1", role: "manager" });

      const response = await PUT(
        new Request("http://localhost/api/users/u1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Updated Alice" }),
        }),
        { params: Promise.resolve({ id: "u1" }) },
      );

      expect(response.status).toBe(403);
      expect(updateMock).not.toHaveBeenCalled();
    });

    it("updates user without password for admin", async () => {
      getSessionMock.mockResolvedValueOnce({ userId: "u_admin", role: "admin" });
      updateMock.mockResolvedValueOnce({ id: "u1", name: "Updated Alice", email: "alice@coop.com" });

      const response = await PUT(
        new Request("http://localhost/api/users/u1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Updated Alice", email: "alice@coop.com" }),
        }),
        { params: Promise.resolve({ id: "u1" }) },
      );

      expect(response.status).toBe(200);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "u1" },
          data: { name: "Updated Alice", email: "alice@coop.com" },
        }),
      );
      expect(bcryptHashMock).not.toHaveBeenCalled();
    });

    it("hashes password and updates user when password provided", async () => {
      getSessionMock.mockResolvedValueOnce({ userId: "u_admin", role: "admin" });
      bcryptHashMock.mockResolvedValueOnce("hashed-password-123");
      updateMock.mockResolvedValueOnce({ id: "u1", name: "Alice" });

      const response = await PUT(
        new Request("http://localhost/api/users/u1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Alice", password: "newpass123" }),
        }),
        { params: Promise.resolve({ id: "u1" }) },
      );

      expect(response.status).toBe(200);
      expect(bcryptHashMock).toHaveBeenCalledWith("newpass123", 10);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ passwordHash: "hashed-password-123" }),
        }),
      );
    });

    it("returns 500 on update failure", async () => {
      getSessionMock.mockResolvedValueOnce({ userId: "u_admin", role: "admin" });
      updateMock.mockRejectedValueOnce(new Error("db error"));

      const response = await PUT(
        new Request("http://localhost/api/users/u1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Updated Alice" }),
        }),
        { params: Promise.resolve({ id: "u1" }) },
      );
      const payload = (await response.json()) as { error: string };

      expect(response.status).toBe(500);
      expect(payload.error).toBe("Failed to update user");
    });
  });

  describe("DELETE", () => {
    it("returns 403 when unauthenticated", async () => {
      getSessionMock.mockResolvedValueOnce(null);

      const response = await DELETE(new Request("http://localhost/api/users/u1"), {
        params: Promise.resolve({ id: "u1" }),
      });

      expect(response.status).toBe(403);
    });

    it("returns 403 for non-admin", async () => {
      getSessionMock.mockResolvedValueOnce({ userId: "u1", role: "manager" });

      const response = await DELETE(new Request("http://localhost/api/users/u1"), {
        params: Promise.resolve({ id: "u1" }),
      });

      expect(response.status).toBe(403);
      expect(deleteMock).not.toHaveBeenCalled();
    });

    it("deletes user for admin", async () => {
      getSessionMock.mockResolvedValueOnce({ userId: "u_admin", role: "admin" });
      deleteMock.mockResolvedValueOnce({ id: "u1" });

      const response = await DELETE(new Request("http://localhost/api/users/u1"), {
        params: Promise.resolve({ id: "u1" }),
      });
      const payload = (await response.json()) as { success: boolean };

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(deleteMock).toHaveBeenCalledWith({ where: { id: "u1" } });
    });

    it("returns 500 on delete failure", async () => {
      getSessionMock.mockResolvedValueOnce({ userId: "u_admin", role: "admin" });
      deleteMock.mockRejectedValueOnce(new Error("db error"));

      const response = await DELETE(new Request("http://localhost/api/users/u1"), {
        params: Promise.resolve({ id: "u1" }),
      });
      const payload = (await response.json()) as { error: string };

      expect(response.status).toBe(500);
      expect(payload.error).toBe("Failed to delete user");
    });
  });
});
