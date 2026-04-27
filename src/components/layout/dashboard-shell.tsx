"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/navigation";
import { ChannelBadge } from "@/components/layout/channel-badge";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl p-4 md:p-6">
        <div className="mb-6 rounded-3xl bg-gradient-to-br from-slate-950 to-emerald-950 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-200">Dashboard operacional</p>
              <h1 className="mt-1 text-2xl font-semibold md:text-4xl">Central Comercial ASM</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200 md:text-base">
                Gestão de clientes, tabelas, promoções, respostas e pedidos do dia em um fluxo único.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-slate-300">Canal atual</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                <MessageCircle size={18} /> WhatsApp comercial 1:1
              </p>
              <ChannelBadge />
            </div>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between lg:hidden">
          <p className="text-sm font-semibold text-slate-600">Navegação</p>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
          >
            {isMenuOpen ? <X size={16} /> : <Menu size={16} />}
            Menu
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <aside
            className={cn(
              "rounded-3xl border border-slate-100 bg-white p-3 shadow-sm lg:sticky lg:top-4 lg:block lg:h-fit",
              isMenuOpen ? "block" : "hidden"
            )}
          >
            <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Navegação</div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                      active ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </aside>

          <main className="space-y-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
