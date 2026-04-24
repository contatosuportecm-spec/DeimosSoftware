"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard",    path: "/dashboard" },
  { label: "Analytics",    path: "/analytics" },
  { label: "Criativos",    path: "/creatives" },
  { label: "Configurações", path: "/settings" },
];

export default function Topbar() {
  const pathname = usePathname();

  return (
    <header className="h-12 flex-shrink-0 flex items-center justify-between px-6 border-b border-border bg-bg-2">
      {/* Nav links */}
      <div className="flex items-center gap-6 h-full">
        {NAV.map(({ label, path }) => {
          const isActive =
            path === "/dashboard"
              ? pathname === "/dashboard" || pathname === "/"
              : pathname.startsWith(path);

          return (
            <Link
              key={path}
              href={path}
              className={cn(
                "relative flex items-center h-full text-xs transition-colors",
                isActive
                  ? "text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-nova" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Right icons */}
      <div className="flex items-center gap-3">
        <button className="text-text-muted hover:text-text-secondary transition-colors">
          <Search size={15} strokeWidth={1.5} />
        </button>

        <button className="relative text-text-muted hover:text-text-secondary transition-colors">
          <Bell size={15} strokeWidth={1.5} />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-nova" />
        </button>

        <div className="w-7 h-7 rounded-full bg-nova/20 border border-nova/30 flex items-center justify-center ml-1 cursor-pointer">
          <span className="text-[9px] font-semibold text-nova">CA</span>
        </div>
      </div>
    </header>
  );
}
