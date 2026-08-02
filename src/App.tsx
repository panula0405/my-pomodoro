import { useEffect, useState } from "react";
import "./App.css";
import Timer from "./components/Timer";
import Batch from "./components/Batch";
import SettingsSidebar from "./components/SettingsSidebar";
import TaskList, { type Task } from "./components/TaskList";
import { API_URL } from "./config";

interface PomodoroSettings {
  timer_minutes: number;
  short_break_minutes: number;
  long_break_minutes: number;
  batch_size: number;
}

interface PlannerResponse {
  summary: string;
  tasks: Task[];
}

type TimerMode = "focus" | "short_break" | "long_break";

const getLocalDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(0.05);
  const [batchSize, setBatchSize] = useState(3);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [timerMode, setTimerMode] = useState<TimerMode>("focus");
  const durationByMode: Record<TimerMode, number> = {
    focus: timerMinutes,
    short_break: shortBreakMinutes,
    long_break: longBreakMinutes,
  };
  const activeTimerMinutes = durationByMode[timerMode];
  const titleByMode: Record<TimerMode, string> = {
    focus: "Focus session",
    short_break: "Short break",
    long_break: "Long break",
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [isTasksOpen, setIsTasksOpen] = useState(true);
  const [isPlanning, setIsPlanning] = useState(false);

  useEffect(() => {
    //for GET to work
    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/settings`);

        if (!response.ok) {
          throw new Error(`Settings request failed: ${response.status}`);
        }

        const settings: PomodoroSettings = await response.json();

        setTimerMinutes(settings.timer_minutes);
        setShortBreakMinutes(settings.short_break_minutes);
        setLongBreakMinutes(settings.long_break_minutes);
        setBatchSize(settings.batch_size);
      } catch (error) {
        console.error("Could not load settings:", error);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setTasksLoading(true);
        setTasksError(null);

        const plannedDate = getLocalDate();

        const response = await fetch(
          `${API_URL}/api/tasks?planned_date=${plannedDate}`,
        );

        if (!response.ok) {
          throw new Error(`Tasks request failed: ${response.status}`);
        }

        const savedTasks: Task[] = await response.json();

        setTasks(savedTasks);
      } catch (error) {
        console.error("Could not load tasks:", error);
        setTasksError("Could not load today’s tasks.");
      } finally {
        setTasksLoading(false);
      }
    };

    loadTasks();
  }, []);

  const saveSettings = async (
    newTimerMinutes: number,
    newShortBreakMinutes: number,
    newLongBreakMinutes: number,
    newBatchSize: number,
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timer_minutes: newTimerMinutes,
          short_break_minutes: newShortBreakMinutes,
          long_break_minutes: newLongBreakMinutes,
          batch_size: newBatchSize,
        }),
      });

      if (!response.ok) {
        throw new Error(`Saving settings failed: ${response.status}`);
      }

      const savedSettings: PomodoroSettings = await response.json();

      console.log("Settings saved:", savedSettings);
    } catch (error) {
      console.error("Could not save settings:", error);
    }
  };

  const handleTimerMinutesChange = (newMinutes: number) => {
    setTimerMinutes(newMinutes);
    void saveSettings(
      newMinutes,
      shortBreakMinutes,
      longBreakMinutes,
      batchSize,
    );
  };

  const handleTimerComplete = () => {
    if (timerMode === "focus") {
      const newCompletedCount = completedSessions + 1;

      setCompletedSessions(newCompletedCount);

      if (newCompletedCount >= batchSize) {
        setTimerMode("long_break");
      } else {
        setTimerMode("short_break");
      }

      return;
    }

    if (timerMode === "long_break") {
      setCompletedSessions(0);
    }

    setTimerMode("focus");
  };

  const handleBatchSizeChange = (newSize: number) => {
    setBatchSize(newSize);

    setCompletedSessions((previous) => Math.min(previous, newSize));
    void saveSettings(
      timerMinutes,
      shortBreakMinutes,
      longBreakMinutes,
      newSize,
    );
  };

  const handleShortBreakChange = (newMinutes: number) => {
    setShortBreakMinutes(newMinutes);

    void saveSettings(timerMinutes, newMinutes, longBreakMinutes, batchSize);
  };

  const handleLongBreakChange = (newMinutes: number) => {
    setLongBreakMinutes(newMinutes);

    void saveSettings(timerMinutes, shortBreakMinutes, newMinutes, batchSize);
  };

  const handlePlanningRequest = async (message: string): Promise<boolean> => {
    try {
      setIsPlanning(true);
      setTasksError(null);

      const response = await fetch(`${API_URL}/api/planner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          planned_date: getLocalDate(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Planning request failed: ${response.status}`);
      }

      const plan: PlannerResponse = await response.json();

      setTasks((previous) =>
        [...previous, ...plan.tasks].sort(
          (first, second) => first.position - second.position,
        ),
      );

      return true;
    } catch (error) {
      console.error("Could not create plan:", error);
      setTasksError("Could not create your task plan.");
      return false;
    } finally {
      setIsPlanning(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      setTasksError(null);

      const response = await fetch(
        `${API_URL}/api/tasks/${taskId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(`Deleting task failed: ${response.status}`);
      }

      setTasks((previous) =>
        previous.filter((task) => task.id !== taskId),
      );
    } catch (error) {
      console.error("Could not delete task:", error);
      setTasksError("Could not delete the task.");
    }
  };

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";

    try {
      setTasksError(null);

      const response = await fetch(
        `${API_URL}/api/tasks/${task.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!response.ok) {
        throw new Error(`Updating task failed: ${response.status}`);
      }

      const updatedTask: Task = await response.json();

      setTasks((previous) =>
        previous.map((currentTask) =>
          currentTask.id === updatedTask.id ? updatedTask : currentTask,
        ),
      );
    } catch (error) {
      console.error("Could not update task:", error);
      setTasksError("Could not update the task.");
    }
  };

  return (
    <div className="app">
      <button
        type="button"
        className={`settings-toggle ${
          isSettingsOpen ? "settings-toggle--open" : ""
        }`}
        onClick={() => setIsSettingsOpen((previous) => !previous)}
        aria-label={isSettingsOpen ? "Close settings" : "Open settings"}
        title={isSettingsOpen ? "Close settings" : "Open settings"}
      >
        <svg className="settings-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.08 14H3v-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63 1.7 1.7 0 0 0 10 3.08V3h4v.09A1.7 1.7 0 0 0 15 4.64a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9 1.7 1.7 0 0 0 20.92 10H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
        </svg>
      </button>

      <SettingsSidebar
        isOpen={isSettingsOpen}
        timerMinutes={timerMinutes}
        shortBreakMinutes={shortBreakMinutes}
        longBreakMinutes={longBreakMinutes}
        batchSize={batchSize}
        onTimerMinutesChange={handleTimerMinutesChange}
        onShortBreakMinutesChange={handleShortBreakChange}
        onLongBreakMinutesChange={handleLongBreakChange}
        onBatchSizeChange={handleBatchSizeChange}
      />

      <div className="app-content">
        <main className="timer-page">
          <h2>{titleByMode[timerMode]}</h2>

          <Batch
            completed={completedSessions}
            total={batchSize}
            onReset={() => setCompletedSessions(0)}
          />

          <Timer timer={activeTimerMinutes} onComplete={handleTimerComplete} />
        </main>
        <button
          type="button"
          className={`tasks-toggle ${isTasksOpen ? "tasks-toggle--open" : ""}`}
          onClick={() => setIsTasksOpen((previous) => !previous)}
          aria-label={isTasksOpen ? "Hide tasks" : "Show tasks"}
          title={isTasksOpen ? "Hide tasks" : "Show tasks"}
        >
          {isTasksOpen ? "→" : "←"}
        </button>

        <TaskList
          tasks={tasks}
          isLoading={tasksLoading}
          error={tasksError}
          isOpen={isTasksOpen}
          isPlanning={isPlanning}
          onPlanRequest={handlePlanningRequest}
          onDeleteTask={handleDeleteTask}
          onToggleTask={handleToggleTask}
        />
      </div>
    </div>
  );
}

export default App;
