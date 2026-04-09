import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import StatCard from "@/components/StatCard";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  await requireSession("admin");

  const [users, activityLogs, products, members, sales] = await Promise.all([
    db.user.findMany({
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      orderBy: { name: "asc" },
    }),
    db.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true } } },
    }),
    db.product.count(),
    db.member.count(),
    db.sale.count({ where: { status: "completed" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Users" value={users.length} icon="👥" color="blue" />
        <StatCard title="Products" value={products} icon="📦" color="green" />
        <StatCard title="Members" value={members} icon="🏷️" color="purple" />
        <StatCard title="Total Sales" value={sales} icon="🛒" color="yellow" />
      </div>

      <AdminClient
        users={JSON.parse(JSON.stringify(users))}
        activityLogs={JSON.parse(JSON.stringify(activityLogs))}
      />
    </div>
  );
}
