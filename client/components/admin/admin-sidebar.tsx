"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  FaChartLine,
  FaQuestionCircle,
  FaClipboardList,
} from "react-icons/fa";

export default function AdminSidebar() {
  const pathname = usePathname();

  const routes = [
    {
      name: "home",
      link: "/admin",
      icon: <FaChartLine />,
      label: "Home",
      exact: true,
    },
    {
      name: "tests",
      link: "/admin/tests",
      icon: <FaQuestionCircle />,
      label: "Tests",
    },
    {
      name: "questions",
      link: "/admin/questions",
      icon: <FaClipboardList />,
      label: "Questions",
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col items-center w-14 min-w-14 py-6 space-y-6 bg-sidebar border-r border-border sticky top-[calc(3rem+var(--banner-h,0px))] h-[calc(100dvh-3rem-var(--banner-h,0px))]">
        {routes.map((r) => {
          const isActive = r.exact
            ? pathname === r.link
            : pathname.startsWith(r.link);

          return (
            <Link
              key={r.name}
              href={r.link}
              className={`group p-3 rounded-lg transition-colors flex items-center justify-center ${isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
                }`}
              aria-label={r.label}
            >
              <div className="relative text-xl">
                {r.icon}
                <span className="absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow group-hover:opacity-100 transition-opacity z-50">
                  {r.label}
                </span>
              </div>
            </Link>
          );
        })}
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 bg-sidebar border-t border-border px-4 py-2">
        {routes.map((r) => {
          const isActive = r.exact
            ? pathname === r.link
            : pathname.startsWith(r.link);

          return (
            <Link
              key={r.name}
              href={r.link}
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
              aria-label={r.label}
            >
              <div className="text-xl">{r.icon}</div>
              <span className="text-[10px] font-medium">{r.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
