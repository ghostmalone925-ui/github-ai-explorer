import { Button } from "@/components/ui/button";
import {
  ChevronUp,
  Maximize2,
  Minimize2,
  Plus,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Terminal types ──────────────────────────────────────────────────────────
export interface TerminalLine {
  id: string;
  text: string;
  type: "input" | "output" | "error" | "system";
}

export interface TerminalTab {
  id: string;
  name: string;
  lines: TerminalLine[];
  workingDirectory: string;
  isRunning: boolean;
}

interface IDETerminalProps {
  tabs: TerminalTab[];
  activeTabId: string | null;
  onAddTab: () => void;
  onCloseTab: (id: string) => void;
  onSelectTab: (id: string) => void;
  onExecuteCommand: (tabId: string, command: string) => void;
  onClear: (tabId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function IDETerminal({
  tabs,
  activeTabId,
  onAddTab,
  onCloseTab,
  onSelectTab,
  onExecuteCommand,
  onClear,
  isExpanded,
  onToggleExpand,
}: IDETerminalProps) {
  const [inputValue, setInputValue] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: lines triggers scroll on new output
  }, [activeTab?.lines]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeTabId || !inputValue.trim()) return;
      onExecuteCommand(activeTabId, inputValue.trim());
      setInputValue("");
      setHistoryIndex(-1);
    },
    [activeTabId, inputValue, onExecuteCommand],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!activeTab) return;
      const inputLines = activeTab.lines.filter((l) => l.type === "input");

      if (e.key === "ArrowUp") {
        e.preventDefault();
        const newIndex = Math.min(historyIndex + 1, inputLines.length - 1);
        setHistoryIndex(newIndex);
        if (newIndex >= 0) {
          const historyLine = inputLines[inputLines.length - 1 - newIndex];
          setInputValue(historyLine?.text.replace(/^\$ /, "") ?? "");
        }
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const newIndex = Math.max(historyIndex - 1, -1);
        setHistoryIndex(newIndex);
        if (newIndex >= 0) {
          const historyLine = inputLines[inputLines.length - 1 - newIndex];
          setInputValue(historyLine?.text.replace(/^\$ /, "") ?? "");
        } else {
          setInputValue("");
        }
      }
    },
    [activeTab, historyIndex],
  );

  const lineColor = (type: TerminalLine["type"]) => {
    switch (type) {
      case "input":
        return "text-green-400";
      case "output":
        return "text-foreground/70";
      case "error":
        return "text-red-400";
      case "system":
        return "text-yellow-400/70 italic";
    }
  };

  return (
    <div
      className={`flex flex-col border-t border-border/50 bg-[#0d1117] ${
        isExpanded ? "h-[50%]" : "h-[200px]"
      } transition-all`}
    >
      {/* Tab bar */}
      <div className="flex items-center bg-[#161b22] border-b border-border/30 shrink-0">
        <div className="flex items-center overflow-x-auto flex-1 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono border-r border-border/20 whitespace-nowrap transition-colors ${
                tab.id === activeTabId
                  ? "bg-[#0d1117] text-green-400"
                  : "text-muted-foreground/50 hover:text-foreground/70"
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>{tab.name}</span>
              {tab.isRunning && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="ml-1 opacity-0 group-hover:opacity-100 hover:text-destructive"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5 px-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddTab}
            className="h-5 w-5 p-0 text-muted-foreground/50 hover:text-foreground"
          >
            <Plus className="w-3 h-3" />
          </Button>
          {activeTabId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClear(activeTabId)}
              className="h-5 w-5 p-0 text-muted-foreground/50 hover:text-foreground"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="h-5 w-5 p-0 text-muted-foreground/50 hover:text-foreground"
          >
            {isExpanded ? (
              <Minimize2 className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Terminal output */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: click-to-focus is standard terminal behavior */}
      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="flex-1 overflow-y-auto p-2 font-mono text-[11px] leading-5 cursor-text"
      >
        {activeTab ? (
          <>
            {activeTab.lines.map((line) => (
              <div
                key={line.id}
                className={`${lineColor(line.type)} whitespace-pre-wrap break-all`}
              >
                {line.text}
              </div>
            ))}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground/30 text-[10px]">
            No terminal open
          </div>
        )}
      </div>

      {/* Input line */}
      {activeTab && (
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-2 py-1.5 border-t border-border/20 bg-[#161b22]"
        >
          <span className="text-green-400 text-[11px] font-mono shrink-0">
            {activeTab.workingDirectory.split("/").pop() || "~"}
            <span className="text-muted-foreground/50">$</span>
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={activeTab.isRunning}
            placeholder={
              activeTab.isRunning ? "Process running..." : "Type a command..."
            }
            className="flex-1 bg-transparent text-[11px] font-mono text-foreground outline-none placeholder:text-muted-foreground/30 disabled:opacity-50"
          />
        </form>
      )}
    </div>
  );
}
