import { useEffect, useState } from "react";

interface TimerProps {
  timer: number;
  onComplete: () => void;
}

const Timer = ({ timer, onComplete }: TimerProps) => {
  const durationSeconds = Math.max(1, Math.round(timer * 60));
  const ringRadius = 108;
  const ringCircumference = 2 * Math.PI * ringRadius;

  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Reset the clock when the setting changes.
  useEffect(() => {
    setIsRunning(false);
    setHasCompleted(false);
    setTimeLeft(durationSeconds);
  }, [durationSeconds]);

  // Count down by one second.
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [isRunning, timeLeft]);

  // Complete the session and reset the clock.
  useEffect(() => {
    if (timeLeft === 0 && isRunning && !hasCompleted) {
      setHasCompleted(true);
      setIsRunning(false);
      onComplete();
      setTimeLeft(durationSeconds);
    }
  }, [timeLeft, isRunning, hasCompleted, durationSeconds, onComplete]);

  const toggleTimer = () => {
    setHasCompleted(false);
    setIsRunning((previous) => !previous);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setHasCompleted(false);
    setTimeLeft(durationSeconds);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  const progress = timeLeft / durationSeconds;
  const ringOffset = ringCircumference * (1 - progress);

  return (
    <section className="timer">
      <div className="timer-ring">
        <svg
          className="timer-ring__svg"
          viewBox="0 0 240 240"
          aria-hidden="true"
        >
          <circle className="timer-ring__track" cx="120" cy="120" r="108" />
          <circle
            className="timer-ring__progress"
            cx="120"
            cy="120"
            r={ringRadius}
            strokeDasharray={ringCircumference}
            strokeDashoffset={ringOffset}
          />
        </svg>

        <h1 className="clock">{formatTime(timeLeft)}</h1>
      </div>

      <div className="timer-controls">
        <button
          type="button"
          className="timer-button"
          onClick={toggleTimer}
          aria-label={isRunning ? "Pause timer" : "Start timer"}
          title={isRunning ? "Pause timer" : "Start timer"}
        >
          {isRunning ? "❚❚" : "▶"}
        </button>

        <button
          type="button"
          className="timer-button timer-button--reset"
          onClick={resetTimer}
          aria-label="Reset timer"
          title="Reset timer"
        >
          ↻
        </button>
      </div>
    </section>
  );
};

export default Timer;
