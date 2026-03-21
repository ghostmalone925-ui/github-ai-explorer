import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bug,
  ChevronDown,
  ChevronRight,
  Circle,
  CornerDownRight,
  Layers,
  Minus,
  Pause,
  Play,
  Plus,
  Power,
  RefreshCw,
  SkipForward,
  Square,
  Trash2,
  Variable,
} from "lucide-react";
import React, { useCallback, useState } from "react";

// ── Debug types ─────────────────────────────────────────────────────────────

export type DebugState = "idle" | "running" | "paused" | "stopped";

export interface Breakpoint {
  id: string;
  file: string;
  line: number;
  enabled: boolean;
  condition?: string;
  hitCount: number;
}

export interface DebugVariable {
  name: string;
  value: string;
  type: string;
  children?: DebugVariable[];
}

export interface StackFrame {
  id: string;
  functionName: string;
  file: string;
  line: number;
  isCurrentFrame: boolean;
}

export interface DebugSession {
  state: DebugState;
  breakpoints: Breakpoint[];
  variables: DebugVariable[];
  callStack: StackFrame[];
  currentFile: string | null;
  currentLine: number | null;
}

interface DebuggerPanelProps {
  session: DebugSession;
  onStartDebug: () => void;
  onStopDebug: () => void;
  onPause: () => void;
  onResume: () => void;
  onStepOver: () => void;
  onStepInto: () => void;
  onStepOut: () => void;
  onToggleBreakpoint: (id: string) => void;
  onRemoveBreakpoint: (id: string) => void;
  onClearBreakpoints: () => void;
  hasProject: boolean;
}

// ── Section collapse helper ─────────────────────────────────────────────────

function Section({
  title,
  icon,
  defaultOpen,
  badge,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  badge?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);

  return (
    <div className="border-b border-border/30 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-muted/30 text-[11px] font-medium"
      >
        <div className="flex items-center gap-1.5">
          {open ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
          {icon}
          <span>{title}</span>
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </button>
      {open && <div className="px-3 pb-2">{children}</div>}
    </div>
  );
}

// ── Variable tree renderer ──────────────────────────────────────────────────

function VariableItem({
  variable,
  depth,
}: {
  variable: DebugVariable;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = variable.children && variable.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-1 py-0.5 hover:bg-muted/20 rounded cursor-default group"
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-3 h-3 flex items-center justify-center"
          >
            {expanded ? (
              <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-2.5 h-2.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-3" />
        )}
        <span className="text-[11px] text-blue-400">{variable.name}</span>
        <span className="text-[10px] text-muted-foreground/50">=</span>
        <span className="text-[11px] text-green-400 truncate">
          {variable.value}
        </span>
        <span className="text-[10px] text-muted-foreground/40 ml-auto opacity-0 group-hover:opacity-100">
          {variable.type}
        </span>
      </div>
      {expanded &&
        hasChildren &&
        variable.children!.map((child) => (
          <VariableItem
            key={child.name}
            variable={child}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function DebuggerPanel({
  session,
  onStartDebug,
  onStopDebug,
  onPause,
  onResume,
  onStepOver,
  onStepInto,
  onStepOut,
  onToggleBreakpoint,
  onRemoveBreakpoint,
  onClearBreakpoints,
  hasProject,
}: DebuggerPanelProps) {
  const isActive = session.state === "running" || session.state === "paused";
  const isPaused = session.state === "paused";

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/30 shrink-0">
        <div className="flex items-center gap-1.5">
          <Bug className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-medium">Debugger</span>
          {session.state !== "idle" && (
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                isPaused
                  ? "bg-yellow-500/20 text-yellow-400"
                  : session.state === "running"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {session.state}
            </span>
          )}
        </div>
      </div>

      {/* Debug controls */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border/30 bg-muted/10 shrink-0">
        {!isActive ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onStartDebug}
            disabled={!hasProject}
            className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
            title="Start debugging"
          >
            <Play className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <>
            {isPaused ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResume}
                className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
                title="Resume (F5)"
              >
                <Play className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPause}
                className="h-6 w-6 p-0 text-yellow-400 hover:text-yellow-300"
                title="Pause"
              >
                <Pause className="w-3.5 h-3.5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onStopDebug}
              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
              title="Stop (Shift+F5)"
            >
              <Square className="w-3.5 h-3.5" />
            </Button>

            <div className="w-px h-3 bg-border/30 mx-0.5" />

            <Button
              variant="ghost"
              size="sm"
              onClick={onStepOver}
              disabled={!isPaused}
              className="h-6 w-6 p-0"
              title="Step Over (F10)"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onStepInto}
              disabled={!isPaused}
              className="h-6 w-6 p-0"
              title="Step Into (F11)"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onStepOut}
              disabled={!isPaused}
              className="h-6 w-6 p-0"
              title="Step Out (Shift+F11)"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!hasProject ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Bug className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-[11px] text-muted-foreground/50">
              Create a project to start debugging
            </p>
          </div>
        ) : (
          <>
            {/* Variables */}
            <Section
              title="Variables"
              icon={<Variable className="w-3 h-3 text-blue-400" />}
              defaultOpen={true}
            >
              {session.variables.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/40 italic py-1">
                  {isPaused
                    ? "No variables in current scope"
                    : "Not paused at breakpoint"}
                </p>
              ) : (
                <div className="space-y-0">
                  {session.variables.map((v) => (
                    <VariableItem key={v.name} variable={v} depth={0} />
                  ))}
                </div>
              )}
            </Section>

            {/* Call Stack */}
            <Section
              title="Call Stack"
              icon={<Layers className="w-3 h-3 text-orange-400" />}
              defaultOpen={true}
              badge={session.callStack.length}
            >
              {session.callStack.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/40 italic py-1">
                  {isPaused ? "Empty call stack" : "Not paused at breakpoint"}
                </p>
              ) : (
                <div className="space-y-0.5">
                  {session.callStack.map((frame) => (
                    <div
                      key={frame.id}
                      className={`flex items-center gap-1.5 py-0.5 px-1 rounded text-[10px] cursor-pointer hover:bg-muted/30 ${
                        frame.isCurrentFrame
                          ? "bg-primary/10 text-primary"
                          : ""
                      }`}
                    >
                      {frame.isCurrentFrame && (
                        <ArrowRight className="w-2.5 h-2.5 text-yellow-400 shrink-0" />
                      )}
                      <span className="font-mono truncate">
                        {frame.functionName}
                      </span>
                      <span className="text-muted-foreground/40 ml-auto shrink-0">
                        {frame.file.split("/").pop()}:{frame.line}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Breakpoints */}
            <Section
              title="Breakpoints"
              icon={<Circle className="w-3 h-3 text-red-400" />}
              defaultOpen={true}
              badge={session.breakpoints.length}
            >
              <div className="space-y-0.5">
                {session.breakpoints.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/40 italic py-1">
                    No breakpoints set. Click the gutter in the editor to add
                    one.
                  </p>
                ) : (
                  <>
                    {session.breakpoints.map((bp) => (
                      <div
                        key={bp.id}
                        className="flex items-center gap-1.5 py-0.5 px-1 rounded text-[10px] hover:bg-muted/30 group"
                      >
                        <button
                          type="button"
                          onClick={() => onToggleBreakpoint(bp.id)}
                          className="shrink-0"
                        >
                          <Circle
                            className={`w-2.5 h-2.5 ${
                              bp.enabled
                                ? "text-red-400 fill-red-400"
                                : "text-muted-foreground/40"
                            }`}
                          />
                        </button>
                        <span className="font-mono truncate">
                          {bp.file.split("/").pop()}
                        </span>
                        <span className="text-muted-foreground/50">
                          :{bp.line}
                        </span>
                        {bp.condition && (
                          <span className="text-yellow-400/60 text-[9px]">
                            ({bp.condition})
                          </span>
                        )}
                        {bp.hitCount > 0 && (
                          <span className="text-muted-foreground/30 text-[9px]">
                            hit: {bp.hitCount}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemoveBreakpoint(bp.id)}
                          className="ml-auto opacity-0 group-hover:opacity-100"
                        >
                          <Minus className="w-2.5 h-2.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClearBreakpoints}
                      className="h-5 text-[10px] text-muted-foreground/50 hover:text-destructive px-1 mt-1"
                    >
                      <Trash2 className="w-2.5 h-2.5 mr-1" />
                      Clear all
                    </Button>
                  </>
                )}
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
