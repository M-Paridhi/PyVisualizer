import React from "react";
import { Snapshot } from "../../types/execution";
import { formatValue, getTypeColor } from "../../utils/formatValue";

interface Props {
  snapshot: Snapshot | null;
}

const VariablesPanel: React.FC<Props> = ({ snapshot }) => {
  if (!snapshot) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        No variables yet
      </div>
    );
  }

  // Show globals at module level, or locals from top of call stack
  const inFunction = snapshot.stack.length > 0;
  const frame = inFunction ? snapshot.stack[snapshot.stack.length - 1] : null;
  const vars = frame ? frame.locals : snapshot.globals;
  const scopeLabel = frame ? `Local — ${frame.function}()` : "Global scope";

  const entries = Object.entries(vars);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
          Variables
        </span>
        <span className="ml-auto text-xs text-zinc-500">{scopeLabel}</span>
      </div>

      {entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs">
          — empty scope —
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {entries.map(([name, val]) => (
            <div
              key={name}
              className="flex items-start gap-2 px-3 py-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 transition-colors group"
            >
              <span
                className="font-mono text-sm text-white font-medium min-w-[80px] shrink-0"
              >
                {name}
              </span>

              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 mt-0.5"
                style={{
                  color: getTypeColor(val.type),
                  backgroundColor: `${getTypeColor(val.type)}18`,
                  border: `1px solid ${getTypeColor(val.type)}30`,
                }}
              >
                {val.type}
              </span>

              <span className="font-mono text-sm text-zinc-300 break-all">
                {formatValue(val)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Also show globals when inside a function */}
      {inFunction && Object.keys(snapshot.globals).length > 0 && (
        <div className="border-t border-zinc-700">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Global scope</span>
          </div>
          <div className="px-2 pb-2 space-y-1">
            {Object.entries(snapshot.globals).map(([name, val]) => (
              <div
                key={name}
                className="flex items-start gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/60 opacity-70"
              >
                <span className="font-mono text-xs text-zinc-400 min-w-[80px] shrink-0">{name}</span>
                <span className="font-mono text-xs text-zinc-500 break-all">{formatValue(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VariablesPanel;