"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Inbox,
  Calendar,
  CalendarDays,
  Search,
  Plus,
  FolderKanban,
  Users,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const navigation = [
  { name: "Inbox", href: "/inbox", icon: Inbox },
  { name: "Heute", href: "/today", icon: Calendar },
  { name: "Anstehend", href: "/upcoming", icon: CalendarDays },
  { name: "Suche", href: "/search", icon: Search },
];

const projects = [
  { name: "Website Relaunch", href: "/projects/1", color: "#3b82f6" },
  { name: "Marketing Q1", href: "/projects/2", color: "#059669" },
  { name: "Produkt-Roadmap", href: "/projects/3", color: "#f59e0b" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-sidebar-width bg-sidebar-bg flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-hover">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-heading font-bold text-lg">
            STRATEGIE
          </span>
        </Link>
      </div>

      {/* Quick Add Button */}
      <div className="p-3">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Neue Aufgabe</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-active text-sidebar-text-active"
                    : "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Projects Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-medium text-sidebar-text/60 uppercase tracking-wider">
              Projekte
            </span>
            <button className="p-1 rounded hover:bg-sidebar-hover text-sidebar-text/60 hover:text-sidebar-text-active">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            {projects.map((project) => {
              const isActive = pathname === project.href;
              return (
                <Link
                  key={project.name}
                  href={project.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-active text-sidebar-text-active"
                      : "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active"
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="truncate">{project.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Teams Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-medium text-sidebar-text/60 uppercase tracking-wider">
              Teams
            </span>
            <button className="p-1 rounded hover:bg-sidebar-hover text-sidebar-text/60 hover:text-sidebar-text-active">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            <Link
              href="/teams/1"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active transition-colors"
            >
              <Users className="w-5 h-5" />
              <span>Entwicklung</span>
            </Link>
            <Link
              href="/teams/2"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active transition-colors"
            >
              <Users className="w-5 h-5" />
              <span>Marketing</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-hover">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-hover cursor-pointer transition-colors group">
          <div className="w-8 h-8 rounded-full bg-primary-surface text-primary flex items-center justify-center text-sm font-medium">
            {user?.email?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-sidebar-text-active truncate">
              {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
            </div>
            <div className="text-xs text-sidebar-text/60">
              {user?.email || ""}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-sidebar-active transition-all"
            title="Abmelden"
          >
            <LogOut className="w-4 h-4 text-sidebar-text/60" />
          </button>
        </div>
      </div>
    </aside>
  );
}