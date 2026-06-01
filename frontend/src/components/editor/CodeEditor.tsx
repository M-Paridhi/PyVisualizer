import React from "react";
import Editor from "@monaco-editor/react";
import { useExecutionStore } from "../../store/executionStore";

interface Props {
  highlightLine: number | null;
}

const CodeEditor: React.FC<Props> = ({ highlightLine }) => {
  const { code, setCode } = useExecutionStore();

  function handleEditorMount(editor: any, monaco: any) {
    // Highlight the currently executing line in amber
    editor.onDidChangeModelContent(() => {});

    if (highlightLine !== null && highlightLine > 0) {
      editor.deltaDecorations([], [
        {
          range: new monaco.Range(highlightLine, 1, highlightLine, 1),
          options: {
            isWholeLine: true,
            className: "executing-line-highlight",
            glyphMarginClassName: "executing-line-glyph",
          },
        },
      ]);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-700 bg-zinc-800">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <span className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs text-zinc-400 font-mono ml-2">main.py</span>
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          defaultLanguage="python"
          theme="vs-dark"
          value={code}
          onChange={(v) => setCode(v ?? "")}
          onMount={handleEditorMount}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            renderLineHighlight: "line",
            tabSize: 4,
            insertSpaces: true,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;