"use client";

import { ReactNode } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  children?: ReactNode;
}

export function Header({ title, subtitle, meta, children }: HeaderProps) {
  return (
    <header className="bg-background border-b border-border pb-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1 text-text-primary">{title}</h1>
          {subtitle && (
            <p className="text-body-lg text-text-muted mt-1">{subtitle}</p>
          )}
          {meta && (
            <div className="mt-2">{meta}</div>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
