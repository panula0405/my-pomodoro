import TaskComposer from "./TaskComposer";
export interface Task {
  id: number;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  estimated_pomodoros: number;
  position: number;
  status: "todo" | "in_progress" | "done";
  planned_date: string;
  created_at: string;
}

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  isPlanning: boolean;
  onPlanRequest: (message: string) => Promise<boolean>;
  onDeleteTask: (taskId: number) => Promise<void>;
  onToggleTask: (task: Task) => Promise<void>;
}

const TaskList = ({
  tasks,
  isLoading,
  error,
  isOpen,
  isPlanning,
  onPlanRequest,
  onDeleteTask,
  onToggleTask,
}: TaskListProps) => {
  return (
    <section className={`task-panel ${isOpen ? "task-panel--open" : ""}`}>
      <header className="task-panel__header">
        <div>
          <p className="task-panel__label">Daily plan</p>
          <h2>Today’s tasks</h2>
        </div>

        <span className="task-panel__count">{tasks.length}</span>
      </header>

      {isLoading && <p>Loading tasks…</p>}

      {error && <p className="task-panel__error">{error}</p>}

      {!isLoading && !error && tasks.length === 0 && (
        <p className="task-panel__empty">No tasks planned for today.</p>
      )}

      {!isLoading && !error && tasks.length > 0 && (
        <ol className="task-list">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`task-card ${
                task.status === "done" ? "task-card--done" : ""
              }`}
            >
              <div className="task-card__top">
                <span
                  className={`task-card__priority task-card__priority--${task.priority}`}
                >
                  {task.priority}
                </span>

                <span>{task.estimated_pomodoros} sessions</span>
              </div>

              <h3>{task.title}</h3>

              {task.description && <p>{task.description}</p>}

              <div className="task-card__footer">
                <button
                  type="button"
                  className="task-card__complete"
                  onClick={() => void onToggleTask(task)}
                  aria-label={
                    task.status === "done"
                      ? `Mark ${task.title} as not completed`
                      : `Mark ${task.title} as completed`
                  }
                  aria-pressed={task.status === "done"}
                  title={
                    task.status === "done"
                      ? "Mark as not completed"
                      : "Mark as completed"
                  }
                >
                  {task.status === "done" && (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  className="task-card__delete"
                  onClick={() => void onDeleteTask(task.id)}
                  aria-label={`Delete ${task.title}`}
                  title="Delete task"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 7h16" />
                    <path d="M9 7V4h6v3" />
                    <path d="m6 7 1 13h10l1-13" />
                    <path d="M10 11v5M14 11v5" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <TaskComposer onSubmit={onPlanRequest} isPlanning={isPlanning} />
    </section>
  );
};

export default TaskList;
