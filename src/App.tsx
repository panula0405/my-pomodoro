import { useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import Timer from "./components/Timer";
import Button from "./components/Button";

function App() {
  return (
    <div className="bg-blue-500 text-white p-4 rounded">
      <h2>🍅 Pomodoro session</h2>
      <Timer timer={25}></Timer>
      <p>To change the length of your session click on the clock 😁</p>
    </div>
  );
}

export default App;
