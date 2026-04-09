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
    member: {
      findMany: findManyMock,
      count: countMock,
      create: createMock,
    },
  },
}));

import { GET, POST } from "@/app/api/members/route";

describe("/api/members route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const response = await GET(new Request("http://localhost/api/members"));
    expect(response.status).toBe(401);
  });

  it("GET returns members list with paging", async () => {
    getSessionMock.mockResolvedValueOnce({ userId: "u1", role: "clerk" });
    findManyMock.mockResolvedValueOnce([{ id: "m1", name: "Alice", memberId: "MEM-001" }]);
    countMock.mockResolvedValueOnce(1);

    const response = await GET(new Request("http://localhost/api/members?search=Alice&page=1&limit=10"));
    const payload = (await response.json()) as {
      members: Array<{ id: string; name: string; memberId: string }>;
      total: number;
      page: number;
      pages: number;
    };

    expect(response.status).toBe(200);
    expect(payload.total).toBe(1);
    expect(payload.members[0].memberId).toBe("MEM-001");
  });

  it("POST rejects non-admin and non-manager", async () => {
    getSessionMock.mockResolvedValueOnce({ userId: "u1", role: "auditor" });

    const response = await POST(
      new Request("http://localhost/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Bob", memberId: "MEM-002" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("POST creates member for manager", async () => {
    getSessionMock.mockResolvedValueOnce({ userId: "u2", role: "manager" });
    createMock.mockResolvedValueOnce({ id: "m2", name: "Bob", memberId: "MEM-002" });

    const response = await POST(
      new Request("http://localhost/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Bob", memberId: "MEM-002" }),
      }),
    );
    const payload = (await response.json()) as { id: string; name: string };

    expect(response.status).toBe(201);
    expect(payload.name).toBe("Bob");
  });

  it("POST returns 500 when DB create fails", async () => {
    getSessionMock.mockResolvedValueOnce({ userId: "u2", role: "manager" });
    createMock.mockRejectedValueOnce(new Error("db down"));

    const response = await POST(
      new Request("http://localhost/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Carol", memberId: "MEM-003" }),
      }),
    );
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(payload.error).toBe("Failed to create member");
  });
});
