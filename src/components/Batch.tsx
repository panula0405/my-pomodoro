interface BatchProps {
  completed: number;
  total: number;
  onReset: () => void;
}

const Batch = ({ completed, total, onReset }: BatchProps) => {
  return (
    <section className="batch">
      <div className="batch-dots">
        {Array.from({ length: total }).map((_, index) => (
          <span
            key={index}
            className={
              index < completed ? "batch-dot batch-dot--completed" : "batch-dot"
            }
          />
        ))}
      </div>

      <button
        type="button"
        className="batch-reset"
        onClick={onReset}
        aria-label="Reset batch"
        title="Reset batch"
      >
        ↻
      </button>
    </section>
  );
};

export default Batch;
