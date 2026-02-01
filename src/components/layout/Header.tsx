"use client";

import { Bell, Search } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-header-height bg-surface border-b border-border flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-heading font-semibold text-text-primary">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-text-muted">{subtitle}</p>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="p-2 rounded-lg hover:bg-divider text-text-muted hover:text-text-primary transition-colors">
          <Search className="w-5 h-5" />
        </button>
        
        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-divider text-text-muted hover:text-text-primary transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
        </button>
      </div>
    </header>
  );
}