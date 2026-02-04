"use client";

import { forwardRef, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, style, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full px-3 py-2 text-text-primary bg-surface border border-border rounded-lg outline-none focus:border-primary resize-none transition-colors",
          className
        )}
        style={{ fontSize: "0.875rem", lineHeight: 1.5, ...style }}
        {...props}
      />
    );
  }
);

TextArea.displayName = "TextArea";
