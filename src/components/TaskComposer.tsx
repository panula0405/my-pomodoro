import { FormEvent, useState } from "react";

interface TaskComposerProps {
  onSubmit: (message: string) => Promise<boolean>;
  isPlanning: boolean;
}

const TaskComposer = ({ onSubmit, isPlanning }: TaskComposerProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || isPlanning) {
      return;
    }

    const wasSuccessful = await onSubmit(trimmedMessage);

    if (wasSuccessful) {
      setMessage("");
    }
  };

  return (
    <form className="task-composer" onSubmit={handleSubmit}>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Tell me what you need to do today…"
        rows={2}
        maxLength={1000}
        aria-label="Describe your tasks"
      />

      <button
        type="submit"
        disabled={isPlanning || !message.trim()}
        aria-label="Create task plan"
      >
        {isPlanning ? "…" : "➤"}
      </button>
    </form>
  );
};

export default TaskComposer;
