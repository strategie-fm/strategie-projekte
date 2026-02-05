"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in input/textarea
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    // Ignore if modifier keys
    const hasModifier = e.metaKey || e.ctrlKey;

    switch (e.key) {
      case "g":
        if (!hasModifier) {
          const handleSecondKey = (e2: KeyboardEvent) => {
            document.removeEventListener("keydown", handleSecondKey);
            switch (e2.key.toLowerCase()) {
              case "h":
              case "t": // t = today = home
                router.push("/");
                break;
              case "i":
                router.push("/inbox");
                break;
              case "m":
                router.push("/my-tasks");
                break;
              case "u":
                router.push("/upcoming");
                break;
              case "s":
                router.push("/search");
                break;
              case "d":
                router.push("/dashboard");
                break;
            }
          };
          document.addEventListener("keydown", handleSecondKey, { once: true });
          setTimeout(() => {
            document.removeEventListener("keydown", handleSecondKey);
          }, 1000);
        }
        break;

      case "n":
        if (!hasModifier) {
          e.preventDefault();
          window.dispatchEvent(new Event("openNewTaskModal"));
        }
        break;

      case "/":
        if (!hasModifier) {
          e.preventDefault();
          if (pathname !== "/search") {
            router.push("/search");
          }
        }
        break;

      case "1":
        if (!hasModifier) router.push("/dashboard");
        break;

      case "2":
        if (!hasModifier) router.push("/");
        break;

      case "3":
        if (!hasModifier) router.push("/my-tasks");
        break;

      case "4":
        if (!hasModifier) router.push("/upcoming");
        break;

      case "5":
        if (!hasModifier) router.push("/inbox");
        break;

      case "6":
        if (!hasModifier) router.push("/search");
        break;
    }
  }, [router, pathname]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return <>{children}</>;
}