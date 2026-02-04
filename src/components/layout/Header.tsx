"use client";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="bg-background border-b border-border pb-4">
      <h1 className="text-h1 text-text-primary">{title}</h1>
      {subtitle && (
        <p className="text-body-lg text-text-muted mt-1">{subtitle}</p>
      )}
    </header>
  );
}
