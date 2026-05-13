"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Eye, FileText, Sparkles, Package, Zap, Feather, BookOpen, UserCircle, Pencil, type LucideIcon,
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

const KNOWLEDGE: NavItem[] = [
  { id: "vsl",         label: "VSL Studio",   icon: Pencil,     path: "/vsl-studio" },
  { id: "copywriters", label: "Copywriters",  icon: Feather,    path: "/copywriters" },
  { id: "library",     label: "Biblioteca",   icon: BookOpen,   path: "/library" },
  { id: "avatar",      label: "Avatar Vivo",  icon: UserCircle, path: "/avatar" },
  { id: "reverse",     label: "Reverse-Eng",  icon: Eye,        path: "/reverse-engineering" },
];

const W_OPEN = 176;   // 11rem = w-44
const W_CLOSED = 56;  // icons only

/* ── Eclipse logo mark ── */
function EclipseMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden className="flex-shrink-0">
      <defs>
        <radialGradient id="light" cx="72%" cy="22%" r="45%">
          <stop offset="0%"   stopColor="#FF8A1F" stopOpacity="1" />
          <stop offset="55%"  stopColor="#FF8A1F" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FF8A1F" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="14" cy="14" r="12.5" stroke="rgba(255,138,31,0.25)" strokeWidth="0.7" />
      <circle cx="14" cy="14" r="11" fill="rgba(0,0,0,0.55)" />
      <path
        d="M19.5 4.2 C24 6.8 26.5 11 26 15.5 C25.5 20 22.5 23.5 18.5 25"
        stroke="url(#light)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="19.8" cy="4.5" r="1.4" fill="#FF8A1F" opacity="0.9" />
      <circle cx="19.8" cy="4.5" r="2.8" fill="#FF8A1F" opacity="0.15" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);
  const [ready, setReady] = useState(false);

  // Start open, then after 1.5s allow collapse
  useEffect(() => {
    const t = setTimeout(() => {
      setExpanded(false);
      setReady(true);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <aside
      className="hidden md:flex flex-shrink-0 h-[100dvh] flex-col border-r border-white/[0.07] bg-black/40 backdrop-blur-xl overflow-hidden"
      style={{
        width: expanded ? W_OPEN : W_CLOSED,
        transition: ready ? "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
      }}
      onMouseEnter={() => ready && setExpanded(true)}
      onMouseLeave={() => ready && setExpanded(false)}
    >
      {/* Logo */}
      <Link href="/dashboard" className="block px-3.5 pt-5 pb-4 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-2.5">
          <EclipseMark />
          <div className={cn("overflow-hidden whitespace-nowrap", expanded ? "opacity-100 w-auto" : "opacity-0 w-0")}
            style={{ transition: "opacity 0.2s ease, width 0.3s ease" }}
          >
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
        <div className={cn("overflow-hidden whitespace-nowrap", expanded ? "opacity-100 h-auto mb-1.5" : "opacity-0 h-0 mb-0")}
          style={{ transition: "opacity 0.2s ease, height 0.2s ease" }}
        >
          <p className="px-3 pb-1.5 text-[9px] uppercase tracking-[0.22em] text-text-muted/60">
            Principal
          </p>
        </div>

        {PRINCIPAL.map((item) => {
          const isActive = pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.path}
              title={!expanded ? item.label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg text-[11px] transition-all duration-150",
                expanded ? "px-3 py-[7px]" : "px-0 py-[7px] justify-center",
                isActive
                  ? "text-text-primary bg-white/[0.07] shadow-sm"
                  : "text-text-muted hover:text-text-secondary hover:bg-white/[0.04]"
              )}
            >
              <Icon
                size={14}
                strokeWidth={1.5}
                className={cn("flex-shrink-0", isActive && "text-nova")}
              />
              <span className={cn(
                "font-medium overflow-hidden whitespace-nowrap",
                expanded ? "opacity-100 w-auto" : "opacity-0 w-0"
              )}
                style={{ transition: "opacity 0.2s ease" }}
              >
                {item.label}
              </span>
              {item.badge && isActive && expanded && (
                <span className="w-1.5 h-1.5 rounded-full bg-nova ml-auto" />
              )}
            </Link>
          );
        })}

        {/* Knowledge System section */}
        <div className={cn("overflow-hidden whitespace-nowrap pt-4", expanded ? "opacity-100 h-auto mb-1.5" : "opacity-0 h-0 mb-0")}
          style={{ transition: "opacity 0.2s ease, height 0.2s ease" }}
        >
          <p className="px-3 pb-1.5 text-[9px] uppercase tracking-[0.22em] text-text-muted/60">
            Knowledge
          </p>
        </div>

        {KNOWLEDGE.map((item) => {
          const isActive = pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.path}
              title={!expanded ? item.label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg text-[11px] transition-all duration-150",
                expanded ? "px-3 py-[7px]" : "px-0 py-[7px] justify-center",
                isActive
                  ? "text-text-primary bg-white/[0.07] shadow-sm"
                  : "text-text-muted hover:text-text-secondary hover:bg-white/[0.04]"
              )}
            >
              <Icon
                size={14}
                strokeWidth={1.5}
                className={cn("flex-shrink-0", isActive && "text-gold")}
              />
              <span className={cn(
                "font-medium overflow-hidden whitespace-nowrap",
                expanded ? "opacity-100 w-auto" : "opacity-0 w-0"
              )}
                style={{ transition: "opacity 0.2s ease" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className={cn(
        "border-t border-white/[0.06] flex items-center",
        expanded ? "px-3 py-3 gap-2.5" : "px-0 py-3 justify-center"
      )}>
        <div className="w-7 h-7 rounded-full bg-nova/15 border border-nova/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(255,138,31,0.25)]">
          <span className="text-[9px] font-semibold text-nova">CA</span>
        </div>
        <div className={cn("min-w-0 overflow-hidden whitespace-nowrap", expanded ? "opacity-100 w-auto" : "opacity-0 w-0")}
          style={{ transition: "opacity 0.2s ease" }}
        >
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
