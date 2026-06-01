import React from "react";
import { useExecutionStore } from "../../store/executionStore";

// ── Icon primitives ────────────────────────────────────────────────────────────
const Rewind = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
  </svg>
);
const StepBack = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
  </svg>
);
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);
const StepFwd = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 4-5.5 4V6z" transform="scale(-1,1) translate(-24,0)" />
    <path d="M16 6h2v12h-2z" />
    <path d="M6 6l8.5 6L6 18V6z" />
  </svg>
);
const RestartIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
  </svg>
);

const SPEED_OPTIONS = [
  { label: "0.5×", ms: 1600 },
  { label: "1×", ms: 800 },
  { label: "2×", ms: 400 },
  { label: "4×", ms: 200 },
];

const PlaybackControls: React.FC = () => {
  const {
    playState, speed, currentStep, totalSteps,
    visualize, play, pause, restart, stepForward, stepBackward, jumpTo, setSpeed,
    isLoading,
  } = useExecutionStore();

  const hasTrace = totalSteps > 0;
  const isPlaying = playState === "playing";

  return (
    <div className="flex flex-col gap-3 px-4 py-3 bg-zinc-900 border-t border-zinc-700">
      {/* Timeline scrubber */}
      {hasTrace && (
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-600 font-mono w-6 text-right">{currentStep + 1}</span>
          <input
            type="range"
            min={0}
            max={totalSteps - 1}
            value={currentStep}
            onChange={(e) => jumpTo(Number(e.target.value))}
            className="flex-1 accent-violet-500 h-1.5 cursor-pointer"
          />
          <span className="text-[10px] text-zinc-600 font-mono w-6">{totalSteps}</span>
        </div>
      )}

      {/* Controls row */}
      <div className="flex items-center gap-2">
        {/* Visualize / Run button */}
        <button
          onClick={visualize}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M9.4 18l10-6-10-6v12z" /></svg>
          )}
          {isLoading ? "Running…" : "Visualize"}
        </button>

        <div className="w-px h-6 bg-zinc-700 mx-1" />

        {/* Restart */}
        <ControlBtn onClick={restart} disabled={!hasTrace} title="Restart">
          <RestartIcon />
        </ControlBtn>

        {/* Step back */}
        <ControlBtn onClick={stepBackward} disabled={!hasTrace || currentStep === 0} title="Step backward">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M6 6h2v12H6zM17.5 12 9 6v12z" />
          </svg>
        </ControlBtn>

        {/* Play / Pause */}
        <button
          onClick={isPlaying ? pause : play}
          disabled={!hasTrace}
          title={isPlaying ? "Pause" : "Play"}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Step forward */}
        <ControlBtn onClick={stepForward} disabled={!hasTrace || currentStep >= totalSteps - 1} title="Step forward">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z" />
          </svg>
        </ControlBtn>

        <div className="w-px h-6 bg-zinc-700 mx-1" />

        {/* Speed selector */}
        <div className="flex items-center gap-1">
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.ms}
              onClick={() => setSpeed(opt.ms)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                speed === opt.ms
                  ? "bg-violet-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* State badge */}
        {hasTrace && (
          <span className="ml-auto text-[10px] text-zinc-600 capitalize">{playState}</span>
        )}
      </div>
    </div>
  );
};

const ControlBtn: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, title, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
  >
    {children}
  </button>
);

export default PlaybackControls;