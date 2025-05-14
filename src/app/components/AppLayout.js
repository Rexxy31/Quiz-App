"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function AppLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);

    const toggleSidebar = () =>  setCollapsed(prev => !prev);{}


  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}>
        <h2 className="text-xl font-bold mb-4">CEH</h2>
        <SidebarLink href="/" label="Home" />
        <SidebarLink href="/quiz" label="Quiz" />
        <SidebarLink href="/about" label="About" />
        <SidebarLink href="/contact" label="Contact" />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}

function SidebarLink({ href, label, icon, collapsed }) {
  return (
    <Link
      href={href}
      className="relative group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
    >
      {icon}
      {!collapsed ? (
        <span>{label}</span>
      ) : (
        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 w-max whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all z-50 shadow-lg">
          {label}
          <span className="absolute top-1/2 left-0 -translate-y-1 w-0 h-0 border-t-4 border-l-4 border-gray-800 border-r-4" />
        </span>
      )}
    </Link>
  );
}
