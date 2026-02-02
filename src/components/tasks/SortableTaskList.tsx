"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTaskItem } from "./SortableTaskItem";
import type { TaskWithRelations } from "@/types/database";
import { updateTask } from "@/lib/database";

interface SortableTaskListProps {
  tasks: TaskWithRelations[];
  onTasksReorder: (tasks: TaskWithRelations[]) => void;
  onTaskUpdate: (task: TaskWithRelations) => void;
  onTaskClick?: (task: TaskWithRelations) => void;
  showProject?: boolean;
}

export function SortableTaskList({
  tasks,
  onTasksReorder,
  onTaskUpdate,
  onTaskClick,
  showProject = true,
}: SortableTaskListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: { active: { id: string | number } }) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);

    const newTasks = arrayMove(tasks, oldIndex, newIndex);
    onTasksReorder(newTasks);

    // Update positions in database
    const updates = newTasks.map((task, index) => 
      updateTask(task.id, { position: index })
    );
    await Promise.all(updates);
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="bg-surface rounded-xl shadow-sm border border-border">
          {tasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              onUpdate={onTaskUpdate}
              onClick={onTaskClick}
              showProject={showProject}
              isDragging={activeId === task.id}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}