interface SettingsSidebarProps {
  isOpen: boolean;
  timerMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  batchSize: number;
  onTimerMinutesChange: (minutes: number) => void;
  onShortBreakMinutesChange: (minutes: number) => void;
  onLongBreakMinutesChange: (minutes: number) => void;
  onBatchSizeChange: (size: number) => void;
}

const SettingsSidebar = ({
  isOpen,
  timerMinutes,
  shortBreakMinutes,
  longBreakMinutes,
  batchSize,
  onTimerMinutesChange,
  onShortBreakMinutesChange,
  onLongBreakMinutesChange,
  onBatchSizeChange,
}: SettingsSidebarProps) => {
  return (
    <aside className={`settings-sidebar ${isOpen ? "open" : ""}`}>
      <h2>Settings</h2>

      <label className="setting-field">
        <span>Timer length</span>

        <div className="setting-input">
          <input
            type="number"
            min="1"
            max="120"
            value={timerMinutes}
            onChange={(event) => {
              const value = Number(event.target.value);

              if (value > 0) {
                onTimerMinutesChange(value);
              }
            }}
          />

          <span>minutes</span>
        </div>
      </label>
      <label className="setting-field">
        <span>Short break</span>

        <div className="setting-input">
          <input
            type="number"
            min="0.05"
            max="60"
            step="0.05"
            value={shortBreakMinutes}
            onChange={(event) => {
              const value = Number(event.target.value);

              if (value > 0) {
                onShortBreakMinutesChange(value);
              }
            }}
          />

          <span>minutes</span>
        </div>
      </label>
      <label className="setting-field">
        <span>Long break</span>

        <div className="setting-input">
          <input
            type="number"
            min="0.05"
            max="120"
            step="0.05"
            value={longBreakMinutes}
            onChange={(event) => {
              const value = Number(event.target.value);

              if (value > 0) {
                onLongBreakMinutesChange(value);
              }
            }}
          />

          <span>minutes</span>
        </div>
      </label>

      <label className="setting-field">
        <span>Batch length</span>

        <div className="setting-input">
          <input
            type="number"
            min="1"
            max="10"
            value={batchSize}
            onChange={(event) => {
              const value = Number(event.target.value);

              if (Number.isInteger(value) && value > 0) {
                onBatchSizeChange(value);
              }
            }}
          />

          <span>sessions</span>
        </div>
      </label>
    </aside>
  );
};

export default SettingsSidebar;
