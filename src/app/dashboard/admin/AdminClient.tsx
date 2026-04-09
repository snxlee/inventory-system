"use client";
import { useState } from "react";
import DataTable from "@/components/DataTable";
import ExcelImport from "@/components/ExcelImport";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string } | null;
}

interface AdminClientProps {
  users: User[];
  activityLogs: ActivityLog[];
}

export default function AdminClient({ users: initialUsers, activityLogs }: AdminClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showAddUser, setShowAddUser] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "clerk" });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const user = await res.json() as User;
      setUsers((prev) => [...prev, user]);
      setShowAddUser(false);
      setNewUser({ name: "", email: "", password: "", role: "clerk" });
    } catch {
      alert("Failed to create user");
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !user.active }),
      });
      const updated = await res.json() as User;
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch {
      alert("Failed to update user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Delete this user?")) return;
    try {
      await fetch(`/api/users/${userId}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      alert("Failed to delete user");
    }
  };

  const handleSheetSync = async () => {
    setSyncStatus("Syncing...");
    try {
      await fetch("/api/sheets/sync", { method: "POST" });
      setSyncStatus("Synced!");
    } catch {
      setSyncStatus("Sync failed");
    }
    setTimeout(() => setSyncStatus(""), 3000);
  };

  const userColumns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (v: unknown) => (
        <span className="capitalize text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          {String(v)}
        </span>
      ),
    },
    {
      key: "active",
      label: "Status",
      render: (v: unknown, row: Record<string, unknown>) => (
        <button
          onClick={() => handleToggleActive(row as unknown as User)}
          className={`text-xs px-2 py-0.5 rounded-full ${
            v ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {v ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (_: unknown, row: Record<string, unknown>) => (
        <button
          onClick={() => handleDeleteUser(String(row.id))}
          className="text-xs text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      ),
    },
  ];

  const activityColumns = [
    {
      key: "user",
      label: "User",
      render: (_: unknown, row: Record<string, unknown>) =>
        (row.user as { name: string } | null)?.name || "System",
    },
    {
      key: "action",
      label: "Action",
      render: (v: unknown) => <span className="text-xs font-mono">{String(v)}</span>,
    },
    { key: "details", label: "Details", render: (v: unknown) => String(v ?? "-") },
    { key: "ipAddress", label: "IP", render: (v: unknown) => String(v ?? "-") },
    {
      key: "createdAt",
      label: "Date",
      render: (v: unknown) => new Date(String(v)).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      {/* User Management */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">User Management</h2>
          <button
            onClick={() => setShowAddUser(!showAddUser)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Add User
          </button>
        </div>

        {showAddUser && (
          <form
            onSubmit={handleAddUser}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-4 bg-gray-50 rounded-lg"
          >
            <input
              placeholder="Full Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="clerk">Clerk</option>
              <option value="auditor">Auditor</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <DataTable
          data={users as unknown as Record<string, unknown>[]}
          columns={userColumns}
        />
      </div>

      {/* Excel Import */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-700 mb-4">Excel Import</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Import Products (columns: barcode, name, category, price, cost, quantity, unit)
            </p>
            <ExcelImport type="products" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Import Members (columns: memberid, name, email, phone, address)
            </p>
            <ExcelImport type="members" />
          </div>
        </div>
      </div>

      {/* Google Sheets Sync */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-700">Google Sheets Sync</h2>
            <p className="text-sm text-gray-500 mt-1">Sync products and sales data to Google Sheets</p>
          </div>
          <button
            onClick={handleSheetSync}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            {syncStatus || "Sync Now"}
          </button>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-700 mb-4">Activity Log</h2>
        <DataTable
          data={activityLogs as unknown as Record<string, unknown>[]}
          columns={activityColumns}
        />
      </div>
    </div>
  );
}
