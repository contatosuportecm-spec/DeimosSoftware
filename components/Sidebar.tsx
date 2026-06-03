"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, Radar, Briefcase, PenTool, Box, Cpu, Library, Fingerprint, Brain, FlaskConical, Workflow, PanelLeft, type LucideIcon,
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
  { id: "dashboard", label: "Home",      icon: LayoutGrid,  path: "/dashboard" },
  { id: "spy",       label: "Spy",       icon: Radar,       path: "/spy",       badge: true },
  { id: "ofertas",   label: "Ofertas",   icon: Briefcase,   path: "/offer-briefings" },
  { id: "creatives", label: "Criativos", icon: PenTool,     path: "/creatives" },
  { id: "products",  label: "Produtos",  icon: Box,         path: "/products" },
  { id: "forge",     label: "AI Studio", icon: Cpu,         path: "/forge" },
  { id: "autoresearch", label: "AutoResearch", icon: FlaskConical, path: "/autoresearch" },
  { id: "funnels",      label: "Funnels",      icon: Workflow,      path: "/funnels" },
];

const KNOWLEDGE: NavItem[] = [
  { id: "brain",      label: "Brain",                icon: Brain,        path: "/brain" },
  { id: "biblioteca", label: "Biblioteca",           icon: Library,      path: "/biblioteca" },
  { id: "clientes",   label: "Clientes Artificiais", icon: Fingerprint,  path: "/clientes" },
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

  return (
    <aside
      className="hidden md:flex flex-shrink-0 h-[100dvh] flex-col border-r border-white/[0.07] bg-black/40 backdrop-blur-xl overflow-hidden"
      style={{
        width: expanded ? W_OPEN : W_CLOSED,
        transition: "width 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Header: logo + toggle button */}
      <div
        className={cn(
          "flex items-center h-[57px] border-b border-white/[0.06] overflow-hidden",
          expanded ? "px-3.5 gap-2.5" : "px-2 justify-center"
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity",
            !expanded && "hidden"
          )}
        >
          <img
            src="/logo.png"
            alt="Deimos"
            className="flex-shrink-0"
            style={{ width: 28, height: "auto" }}
          />
          <span className="text-[13px] font-semibold text-text-primary tracking-wide whitespace-nowrap overflow-hidden">
            Deimos
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          title={expanded ? "Fechar menu" : "Abrir menu"}
          aria-label={expanded ? "Fechar menu" : "Abrir menu"}
          aria-expanded={expanded}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 text-text-muted hover:text-text-secondary hover:bg-white/[0.05] transition-colors",
            expanded && "ml-auto"
          )}
        >
          <PanelLeft size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 pt-3 pb-2 space-y-px">
        <div className="overflow-hidden whitespace-nowrap mb-1.5"
          style={{ opacity: expanded ? 1 : 0, transition: "opacity 0.3s ease" }}
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
                "flex items-center gap-2.5 rounded-lg text-[11px] px-3 py-[7px]",
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
                style={{ transition: "opacity 0.3s ease" }}
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
        <div className="overflow-hidden whitespace-nowrap pt-4 mb-1.5"
          style={{ opacity: expanded ? 1 : 0, transition: "opacity 0.3s ease" }}
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
                "flex items-center gap-2.5 rounded-lg text-[11px] px-3 py-[7px]",
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
                style={{ transition: "opacity 0.3s ease" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-white/[0.06] flex items-center px-3 py-3 gap-2.5">
        <div className="w-7 h-7 rounded-full bg-nova/15 border border-nova/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(255,138,31,0.25)]">
          <span className="text-[9px] font-semibold text-nova">CA</span>
        </div>
        <div className={cn("min-w-0 overflow-hidden whitespace-nowrap", expanded ? "opacity-100 w-auto" : "opacity-0 w-0")}
          style={{ transition: "opacity 0.3s ease" }}
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
