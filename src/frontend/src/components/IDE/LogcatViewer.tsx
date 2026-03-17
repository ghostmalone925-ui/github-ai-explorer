import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  Bug,
  Filter,
  Info,
  Pause,
  Play,
  Search,
  Trash2,
  X,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ── Logcat types ────────────────────────────────────────────────────────────
export type LogLevel = "V" | "D" | "I" | "W" | "E" | "F";

export interface LogEntry {
  id: string;
  timestamp: string;
  pid: string;
  tid: string;
  level: LogLevel;
  tag: string;
  message: string;
}

interface LogcatViewerProps {
  logs: LogEntry[];
  isStreaming: boolean;
  onToggleStream: () => void;
  onClear: () => void;
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  V: "text-gray-400",
  D: "text-blue-400",
  I: "text-green-400",
  W: "text-yellow-400",
  E: "text-red-400",
  F: "text-red-600 font-bold",
};

const LEVEL_BG: Record<LogLevel, string> = {
  V: "bg-gray-400/10",
  D: "bg-blue-400/10",
  I: "bg-green-400/10",
  W: "bg-yellow-400/10",
  E: "bg-red-400/10",
  F: "bg-red-600/20",
};

const _LEVEL_LABELS: Record<LogLevel, string> = {
  V: "VERBOSE",
  D: "DEBUG",
  I: "INFO",
  W: "WARN",
  E: "ERROR",
  F: "FATAL",
};

// biome-ignore lint/correctness/noUnusedVariables: reserved for future use in log line rendering
function LevelIcon({ level }: { level: LogLevel }) {
  switch (level) {
    case "V":
    case "D":
      return <Bug className="w-3 h-3" />;
    case "I":
      return <Info className="w-3 h-3" />;
    case "W":
      return <AlertTriangle className="w-3 h-3" />;
    case "E":
    case "F":
      return <AlertCircle className="w-3 h-3" />;
  }
}

export function LogcatViewer({
  logs,
  isStreaming,
  onToggleStream,
  onClear,
}: LogcatViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState<LogLevel | "ALL">("ALL");
  const [filterText, setFilterText] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: logs triggers scroll on new entries
  }, [logs, autoScroll]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterLevel !== "ALL") {
        const levels: LogLevel[] = ["V", "D", "I", "W", "E", "F"];
        const minIndex = levels.indexOf(filterLevel);
        const logIndex = levels.indexOf(log.level);
        if (logIndex < minIndex) return false;
      }
      if (filterText) {
        const q = filterText.toLowerCase();
        if (
          !log.message.toLowerCase().includes(q) &&
          !log.tag.toLowerCase().includes(q)
        )
          return false;
      }
      if (filterTag && !log.tag.toLowerCase().includes(filterTag.toLowerCase()))
        return false;
      return true;
    });
  }, [logs, filterLevel, filterText, filterTag]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Bug className="w-3.5 h-3.5 text-green-400" />
          <span className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">
            Logcat
          </span>
          <span className="text-[9px] text-muted-foreground/50">
            {filteredLogs.length} / {logs.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-5 w-5 p-0 ${showFilters ? "text-primary" : ""}`}
          >
            <Filter className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleStream}
            className="h-5 w-5 p-0"
          >
            {isStreaming ? (
              <Pause className="w-3 h-3 text-yellow-400" />
            ) : (
              <Play className="w-3 h-3 text-green-400" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-5 w-5 p-0"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/30 bg-muted/10">
          {/* Level filter */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-muted-foreground/50 uppercase">
              Level:
            </span>
            <div className="flex gap-0.5">
              {(["ALL", "V", "D", "I", "W", "E"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFilterLevel(level)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors ${
                    filterLevel === level
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground/50 hover:text-foreground/70"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Text search */}
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <Search className="w-3 h-3 text-muted-foreground/40 shrink-0" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter messages..."
              className="flex-1 min-w-0 bg-transparent text-[10px] font-mono outline-none"
            />
            {filterText && (
              <button type="button" onClick={() => setFilterText("")}>
                <X className="w-3 h-3 text-muted-foreground/40" />
              </button>
            )}
          </div>

          {/* Tag filter */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-muted-foreground/50">Tag:</span>
            <input
              type="text"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              placeholder="tag"
              className="w-20 bg-transparent border-b border-border/30 text-[10px] font-mono outline-none"
            />
          </div>
        </div>
      )}

      {/* Log entries */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-background/30 font-mono"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-1">
              <Bug className="w-6 h-6 text-muted-foreground/20 mx-auto" />
              <p className="text-[10px] text-muted-foreground/40">
                {logs.length === 0
                  ? "No logcat output yet"
                  : "No logs match filters"}
              </p>
            </div>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`flex gap-1 px-2 py-[1px] text-[10px] leading-4 hover:bg-white/5 ${LEVEL_BG[log.level]}`}
            >
              <span className="text-muted-foreground/30 shrink-0 w-16 select-none">
                {log.timestamp}
              </span>
              <span className="text-muted-foreground/40 shrink-0 w-10 text-right select-none">
                {log.pid}
              </span>
              <span
                className={`shrink-0 w-5 text-center font-bold ${LEVEL_COLORS[log.level]}`}
              >
                {log.level}
              </span>
              <span className="text-cyan-400/70 shrink-0 w-24 truncate">
                {log.tag}
              </span>
              <span
                className={`flex-1 min-w-0 break-all ${LEVEL_COLORS[log.level]}`}
              >
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
