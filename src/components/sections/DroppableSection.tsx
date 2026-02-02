"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DroppableSectionProps {
  id: string;
  children: React.ReactNode;
  isEmpty?: boolean;
}

export function DroppableSection({ id, children, isEmpty }: DroppableSectionProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-colors rounded-xl",
        isOver && "bg-primary-surface/50 ring-2 ring-primary ring-offset-2"
      )}
    >
      {children}
    </div>
  );
}