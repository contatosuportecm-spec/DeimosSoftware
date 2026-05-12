"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Eye, FileText, Sparkles, Package, Zap, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: boolean;
};

const PRINCIPAL: NavItem[] = [
  { id: "dashboard", label: "Home",      icon: Home,     path: "/dashboard" },
  { id: "spy",       label: "Spy",       icon: Eye,      path: "/spy",       badge: true },
  { id: "ofertas",   label: "Ofertas",   icon: FileText, path: "/offer-briefings" },
  { id: "creatives", label: "Criativos", icon: Sparkles, path: "/creatives" },
  { id: "products",  label: "Produtos",  icon: Package,  path: "/products" },
  { id: "forge",     label: "AI Studio", icon: Zap,      path: "/forge" },
];

/* ── Eclipse logo mark ── */
function EclipseMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <defs>
        <radialGradient id="light" cx="72%" cy="22%" r="45%">
          <stop offset="0%"   stopColor="#FF8A1F" stopOpacity="1" />
          <stop offset="55%"  stopColor="#FF8A1F" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FF8A1F" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer circle */}
      <circle cx="14" cy="14" r="12.5" stroke="rgba(255,138,31,0.25)" strokeWidth="0.7" />

      {/* Inner dark circle (eclipse body) */}
      <circle cx="14" cy="14" r="11" fill="rgba(0,0,0,0.55)" />

      {/* Glow arc — top right */}
      <path
        d="M19.5 4.2 C24 6.8 26.5 11 26 15.5 C25.5 20 22.5 23.5 18.5 25"
        stroke="url(#light)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Bright flare point */}
      <circle cx="19.8" cy="4.5" r="1.4" fill="#FF8A1F" opacity="0.9" />
      <circle cx="19.8" cy="4.5" r="2.8" fill="#FF8A1F" opacity="0.15" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-44 flex-shrink-0 h-[100dvh] flex-col border-r border-white/[0.07] bg-black/40 backdrop-blur-xl">
      {/* Logo */}
      <Link href="/dashboard" className="block px-4 pt-5 pb-4 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-2.5">
          <EclipseMark />
          <div>
            <span className="font-sans font-semibold text-[11px] tracking-[0.28em] text-nova uppercase leading-none block">
              DEIMOS
            </span>
            <span className="text-[8px] tracking-[0.22em] text-text-muted uppercase leading-none block mt-0.5">
              Intelligence
            </span>
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 pt-3 pb-2 space-y-px">
        <SectionLabel>Principal</SectionLabel>

        {PRINCIPAL.map((item) => {
          const isActive = pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.path}
              className={cn(
                "flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[11px] transition-all duration-150",
                isActive
                  ? "text-text-primary bg-white/[0.07] shadow-sm"
                  : "text-text-muted hover:text-text-secondary hover:bg-white/[0.04]"
              )}
            >
              <Icon
                size={13}
                strokeWidth={1.5}
                className={cn(isActive && "text-nova")}
              />
              <span className="flex-1 font-medium">{item.label}</span>
              {item.badge && isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-nova" />
              )}
            </Link>
          );
        })}

      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-white/[0.06] flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-nova/15 border border-nova/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(255,138,31,0.25)]">
          <span className="text-[9px] font-semibold text-nova">CA</span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-text-primary truncate font-semibold leading-tight">
            Caio Andrade
          </p>
          <p className="text-[9px] text-text-muted truncate leading-tight mt-0.5">
            Co-founder · Pro
          </p>
        </div>
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1.5 text-[9px] uppercase tracking-[0.22em] text-text-muted/60">
      {children}
    </p>
  );
}
