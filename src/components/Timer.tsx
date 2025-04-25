import React, { useEffect, useRef, useState } from "react";
import Button from "./Button";

interface Props {
  timer: number;
}

const Timer = ({ timer }: Props) => {
  const [timeLeft, setTimeLeft] = useState(timer * 60); // set seconds
  const [isRunning, setIsRunning] = useState(false); // true when timer is running
  const [isEditing, setIsEditing] = useState(false);
  const [inputMinutes, setInputMinutes] = useState("");
  const [savedTime, setSavedTime] = useState(timer * 60);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1); // subtract 1 second
      }, 1000); // every second, 1000milli = 1 sek
    }

    return () => clearInterval(timer); // stop when component unmounts or dependencies change
  }, [isRunning, timeLeft]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsEditing(false);
      }
    };

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    // Format as "MM:SS" with leading zeros
    const paddedMins = mins.toString().padStart(2, "0");
    const paddedSecs = secs.toString().padStart(2, "0");

    return `${paddedMins}:${paddedSecs}`;
  };
  const startTime = () => {
    setIsRunning(true);
  };
  const stopTime = () => {
    setIsRunning(false);
  };
  const saveTime = () => {
    const mins = parseInt(inputMinutes);
    if (!isNaN(mins)) {
      setTimeLeft(mins * 60);
      setSavedTime(mins * 60);
    }
    setIsEditing(false);
    setInputMinutes("");
  };
  const resetTime = () => {
    setIsRunning(false);
    setTimeLeft(savedTime);
  };

  return (
    <div>
      {isEditing && (
        <>
          <input
            ref={inputRef}
            type="number"
            value={inputMinutes}
            onChange={(e) => setInputMinutes(e.target.value)}
            autoFocus
            className="timer-input"
            placeholder="Enter minutes"
          />
          <p></p>
          <Button type="button-s" onClick={saveTime}>
            Save
          </Button>
        </>
      )}
      <div>
        <h1 className="clock" onClick={() => setIsEditing(true)}>
          {formatTime(timeLeft)}
        </h1>

        <Button type="button-s" onClick={startTime}>
          start
        </Button>
        <Button type="button-s" onClick={stopTime}>
          stop
        </Button>
        <Button type="button-r" onClick={resetTime}>
          reset
        </Button>
      </div>
    </div>
  );
};

export default Timer;
