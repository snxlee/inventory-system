import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Navbar from "@/components/Navbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { name: true, role: true },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user || { name: "User", role: session.role }} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
