import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CheckCircle2, Circle, Calendar, Tag } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-sidebar-width">
        <Header 
          title="Heute" 
          subtitle="Mittwoch, 29. Januar 2026" 
        />
        
        <div className="p-6">
          {/* Überfällig Section */}
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-error mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-error" />
              Überfällig (2)
            </h2>
            <div className="bg-surface rounded-xl shadow-sm border border-border">
              <TaskItem 
                title="Quartalsbericht fertigstellen"
                project="Marketing Q1"
                projectColor="#059669"
                dueDate="Gestern"
                priority="p1"
                overdue
              />
              <TaskItem 
                title="Kundenpräsentation vorbereiten"
                project="Website Relaunch"
                projectColor="#3b82f6"
                dueDate="Vor 2 Tagen"
                priority="p2"
                overdue
              />
            </div>
          </section>

          {/* Heute Section */}
          <section>
            <h2 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Heute (4)
            </h2>
            <div className="bg-surface rounded-xl shadow-sm border border-border">
              <TaskItem 
                title="Daily Standup Meeting"
                project="Entwicklung"
                projectColor="#3b82f6"
                dueDate="09:00"
                labels={["Meeting"]}
              />
              <TaskItem 
                title="API Dokumentation aktualisieren"
                project="Website Relaunch"
                projectColor="#3b82f6"
                priority="p2"
                subtasks="2/4"
              />
              <TaskItem 
                title="Design-Review mit Team"
                project="Website Relaunch"
                projectColor="#3b82f6"
                dueDate="14:00"
                assignees={["AS", "TM"]}
              />
              <TaskItem 
                title="E-Mails beantworten"
                project="Inbox"
                projectColor="#6b7280"
                priority="p3"
                recurring
                isLast
              />
            </div>
          </section>

          {/* Add Task */}
          <button className="mt-4 w-full flex items-center gap-3 px-4 py-3 border-2 border-dashed border-border rounded-xl text-text-muted hover:border-primary hover:text-primary transition-colors">
            <span className="text-lg">+</span>
            <span>Aufgabe hinzufügen</span>
          </button>
        </div>
      </main>
    </div>
  );
}

interface TaskItemProps {
  title: string;
  project: string;
  projectColor: string;
  dueDate?: string;
  priority?: "p1" | "p2" | "p3" | "p4";
  labels?: string[];
  subtasks?: string;
  assignees?: string[];
  recurring?: boolean;
  overdue?: boolean;
  isLast?: boolean;
}

function TaskItem({ 
  title, 
  project, 
  projectColor, 
  dueDate, 
  priority,
  labels,
  subtasks,
  assignees,
  recurring,
  overdue,
  isLast 
}: TaskItemProps) {
  const priorityColors = {
    p1: "border-error text-error",
    p2: "border-warning text-warning",
    p3: "border-info text-info",
    p4: "border-border text-text-muted",
  };

  return (
    <div className={`flex items-center gap-4 px-4 py-3 hover:bg-primary-bg/50 transition-colors ${!isLast ? "border-b border-divider" : ""}`}>
      {/* Checkbox */}
      <button className={`w-5 h-5 rounded-full border-2 flex-shrink-0 hover:bg-primary-surface/50 transition-colors ${priority ? priorityColors[priority] : "border-border"}`}>
      </button>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary">{title}</div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
          {dueDate && (
            <span className={overdue ? "text-error" : ""}>{dueDate}</span>
          )}
          {dueDate && <span>·</span>}
          <span className="flex items-center gap-1">
            <span 
              className="w-2 h-2 rounded-sm" 
              style={{ backgroundColor: projectColor }}
            />
            {project}
          </span>
          {recurring && (
            <>
              <span>·</span>
              <span>🔄</span>
            </>
          )}
          {labels?.map((label) => (
            <span 
              key={label}
              className="px-1.5 py-0.5 rounded bg-info-light text-info text-[10px] font-medium"
            >
              {label}
            </span>
          ))}
          {priority && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
              priority === "p1" ? "bg-error-light text-error" :
              priority === "p2" ? "bg-warning-light text-warning" :
              priority === "p3" ? "bg-info-light text-info" :
              "bg-divider text-text-muted"
            }`}>
              {priority.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {subtasks && (
          <span className="text-xs text-text-muted">{subtasks}</span>
        )}
        {assignees && (
          <div className="flex -space-x-1">
            {assignees.map((initials) => (
              <div 
                key={initials}
                className="w-6 h-6 rounded-full bg-primary-surface text-primary text-[10px] font-medium flex items-center justify-center border-2 border-surface"
              >
                {initials}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}