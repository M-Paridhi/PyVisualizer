import { create } from "zustand";
import { Snapshot, ExecuteResponse, PlayState } from "../types/execution";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const DEFAULT_CODE = `# Welcome to PyVisualizer!
# Write Python code and click Visualize.

def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

result = factorial(5)
print(result)

nums = [3, 1, 4, 1, 5]
nums.sort()

student = {"name": "Alice", "score": 95}
student["grade"] = "A"
`.trim();

interface ExecutionStore {
  // ── Editor ─────────────────────────────────────────────────────────────────
  code: string;
  setCode: (code: string) => void;

  // ── Trace data ─────────────────────────────────────────────────────────────
  snapshots: Snapshot[];
  currentStep: number;
  totalSteps: number;

  // ── UI state ───────────────────────────────────────────────────────────────
  playState: PlayState;
  speed: number;          // ms per step
  isLoading: boolean;
  error: string | null;

  // ── Derived ────────────────────────────────────────────────────────────────
  currentSnapshot: Snapshot | null;

  // ── Actions ────────────────────────────────────────────────────────────────
  visualize: () => Promise<void>;
  stepForward: () => void;
  stepBackward: () => void;
  play: () => void;
  pause: () => void;
  restart: () => void;
  jumpTo: (step: number) => void;
  setSpeed: (ms: number) => void;

  // internal
  _playInterval: ReturnType<typeof setInterval> | null;
  _tickPlay: () => void;
}

export const useExecutionStore = create<ExecutionStore>((set, get) => ({
  code: DEFAULT_CODE,
  setCode: (code) => set({ code }),

  snapshots: [],
  currentStep: 0,
  totalSteps: 0,
  playState: "idle",
  speed: 800,
  isLoading: false,
  error: null,
  currentSnapshot: null,
  _playInterval: null,

  // ── Visualize ──────────────────────────────────────────────────────────────
  visualize: async () => {
    const { code, _playInterval } = get();
    if (_playInterval) clearInterval(_playInterval);

    set({ isLoading: true, error: null, playState: "idle", snapshots: [], currentStep: 0, totalSteps: 0, currentSnapshot: null });

    try {
      const res = await fetch(`${API_URL}/api/v1/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? `Server error ${res.status}`);
      }

      const data: ExecuteResponse = await res.json();

      if (!data.success && data.error && data.snapshots.length === 0) {
        set({
          error: `${data.error.type}: ${data.error.message}` + (data.error.line ? ` (line ${data.error.line})` : ""),
          isLoading: false,
        });
        return;
      }

      set({
        snapshots: data.snapshots,
        totalSteps: data.total_steps,
        currentStep: 0,
        currentSnapshot: data.snapshots[0] ?? null,
        isLoading: false,
        playState: "paused",
      });
    } catch (e: unknown) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  // ── Playback ───────────────────────────────────────────────────────────────
  stepForward: () => {
    const { currentStep, totalSteps, snapshots } = get();
    const next = Math.min(currentStep + 1, totalSteps - 1);
    set({ currentStep: next, currentSnapshot: snapshots[next] });
  },

  stepBackward: () => {
    const { currentStep, snapshots } = get();
    const prev = Math.max(currentStep - 1, 0);
    set({ currentStep: prev, currentSnapshot: snapshots[prev] });
  },

  play: () => {
    const { _playInterval, totalSteps, currentStep } = get();
    if (_playInterval) clearInterval(_playInterval);
    if (currentStep >= totalSteps - 1) {
      set({ currentStep: 0, currentSnapshot: get().snapshots[0] });
    }

    const interval = setInterval(() => get()._tickPlay(), get().speed);
    set({ playState: "playing", _playInterval: interval });
  },

  pause: () => {
    const { _playInterval } = get();
    if (_playInterval) clearInterval(_playInterval);
    set({ playState: "paused", _playInterval: null });
  },

  restart: () => {
    const { _playInterval, snapshots } = get();
    if (_playInterval) clearInterval(_playInterval);
    set({ currentStep: 0, currentSnapshot: snapshots[0] ?? null, playState: "paused", _playInterval: null });
  },

  jumpTo: (step) => {
    const { snapshots, totalSteps } = get();
    const clamped = Math.max(0, Math.min(step, totalSteps - 1));
    set({ currentStep: clamped, currentSnapshot: snapshots[clamped] });
  },

  setSpeed: (ms) => {
    const { playState, _playInterval } = get();
    set({ speed: ms });
    // If currently playing, restart the interval at new speed
    if (playState === "playing" && _playInterval) {
      clearInterval(_playInterval);
      const interval = setInterval(() => get()._tickPlay(), ms);
      set({ _playInterval: interval });
    }
  },

  _tickPlay: () => {
    const { currentStep, totalSteps, snapshots, _playInterval } = get();
    const next = currentStep + 1;
    if (next >= totalSteps) {
      if (_playInterval) clearInterval(_playInterval);
      set({ playState: "finished", _playInterval: null });
    } else {
      set({ currentStep: next, currentSnapshot: snapshots[next] });
    }
  },
}));

