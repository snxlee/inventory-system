"use client";
import { useState } from "react";
import Link from "next/link";

interface NavbarProps {
  user: { name: string; role: string };
}

export default function Navbar({ user }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const roleLinks: Record<string, { href: string; label: string }[]> = {
    admin: [
      { href: "/dashboard/admin", label: "Dashboard" },
      { href: "/dashboard/admin#users", label: "Users" },
      { href: "/dashboard/admin#activity", label: "Activity" },
    ],
    manager: [
      { href: "/dashboard/manager", label: "Dashboard" },
      { href: "/dashboard/manager#inventory", label: "Inventory" },
    ],
    auditor: [
      { href: "/dashboard/auditor", label: "Dashboard" },
      { href: "/dashboard/auditor#members", label: "Members" },
    ],
    clerk: [
      { href: "/dashboard/clerk", label: "POS" },
    ],
  };

  const links = roleLinks[user.role] || [];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-bold text-lg text-blue-600">
              CoopInventory
            </Link>
            <div className="hidden md:flex gap-4">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-gray-600">
              {user.name} <span className="capitalize text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-1">{user.role}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Logout
            </button>
            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
