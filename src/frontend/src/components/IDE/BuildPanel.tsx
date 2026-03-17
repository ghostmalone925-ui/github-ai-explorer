import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Hammer,
  Loader2,
  Package,
  Play,
  RotateCcw,
  Square,
  Trash2,
  Wrench,
  Zap,
} from "lucide-react";
import React, { useCallback, useState } from "react";

// ── Build task types ────────────────────────────────────────────────────────
export type BuildStatus = "idle" | "running" | "success" | "error";

export interface BuildTask {
  id: string;
  name: string;
  command: string;
  description: string;
}

export interface BuildOutput {
  timestamp: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
}

interface BuildPanelProps {
  buildStatus: BuildStatus;
  buildOutput: BuildOutput[];
  onRunTask: (task: BuildTask) => void;
  onStopBuild: () => void;
  onClearOutput: () => void;
  projectType: "kotlin" | "java";
  hasProject: boolean;
}

// ── Default Gradle tasks ────────────────────────────────────────────────────
const GRADLE_TASKS: BuildTask[] = [
  {
    id: "assemble-debug",
    name: "Build Debug APK",
    command: "./gradlew assembleDebug",
    description: "Compile and package a debug APK",
  },
  {
    id: "assemble-release",
    name: "Build Release APK",
    command: "./gradlew assembleRelease",
    description: "Compile and package a release APK",
  },
  {
    id: "install-debug",
    name: "Install Debug",
    command: "./gradlew installDebug",
    description: "Build and install debug APK on connected device",
  },
  {
    id: "clean",
    name: "Clean Project",
    command: "./gradlew clean",
    description: "Remove all build outputs",
  },
  {
    id: "lint",
    name: "Run Lint",
    command: "./gradlew lint",
    description: "Run Android lint checks",
  },
  {
    id: "test",
    name: "Run Unit Tests",
    command: "./gradlew test",
    description: "Execute unit tests",
  },
  {
    id: "connected-test",
    name: "Run Instrumented Tests",
    command: "./gradlew connectedAndroidTest",
    description: "Execute tests on connected device/emulator",
  },
  {
    id: "bundle-release",
    name: "Build AAB (Release)",
    command: "./gradlew bundleRelease",
    description: "Generate Android App Bundle for Play Store",
  },
  {
    id: "dependencies",
    name: "Show Dependencies",
    command: "./gradlew dependencies",
    description: "Display project dependency tree",
  },
  {
    id: "sync",
    name: "Gradle Sync",
    command: "./gradlew --refresh-dependencies",
    description: "Refresh and sync project dependencies",
  },
];

// ── Task icon mapping ───────────────────────────────────────────────────────
function TaskIcon({ taskId }: { taskId: string }) {
  switch (taskId) {
    case "assemble-debug":
    case "assemble-release":
      return <Hammer className="w-3.5 h-3.5 text-primary" />;
    case "install-debug":
      return <Play className="w-3.5 h-3.5 text-green-400" />;
    case "clean":
      return <Trash2 className="w-3.5 h-3.5 text-orange-400" />;
    case "lint":
      return <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />;
    case "test":
    case "connected-test":
      return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
    case "bundle-release":
      return <Package className="w-3.5 h-3.5 text-purple-400" />;
    case "dependencies":
      return <Box className="w-3.5 h-3.5 text-blue-400" />;
    case "sync":
      return <RotateCcw className="w-3.5 h-3.5 text-green-400" />;
    default:
      return <Wrench className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}

// ── Build output line ───────────────────────────────────────────────────────
function OutputLine({ output }: { output: BuildOutput }) {
  const color = {
    info: "text-foreground/70",
    warning: "text-yellow-400",
    error: "text-red-400",
    success: "text-green-400",
  }[output.type];

  return (
    <div className={`flex gap-2 text-[10px] font-mono ${color}`}>
      <span className="text-muted-foreground/40 shrink-0 select-none">
        {output.timestamp}
      </span>
      <span className="whitespace-pre-wrap break-all">{output.message}</span>
    </div>
  );
}

export function BuildPanel({
  buildStatus,
  buildOutput,
  onRunTask,
  onStopBuild,
  onClearOutput,
  projectType: _projectType,
  hasProject,
}: BuildPanelProps) {
  const [_showTasks, _setShowTasks] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["build", "test", "other"]),
  );

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  const buildTasks = GRADLE_TASKS.filter((t) =>
    [
      "assemble-debug",
      "assemble-release",
      "install-debug",
      "bundle-release",
    ].includes(t.id),
  );
  const testTasks = GRADLE_TASKS.filter((t) =>
    ["lint", "test", "connected-test"].includes(t.id),
  );
  const otherTasks = GRADLE_TASKS.filter((t) =>
    ["clean", "dependencies", "sync"].includes(t.id),
  );

  const statusIcon = {
    idle: null,
    running: <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />,
    success: <Check className="w-3.5 h-3.5 text-green-400" />,
    error: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
  }[buildStatus];

  const statusText = {
    idle: "Ready",
    running: "Building...",
    success: "Build successful",
    error: "Build failed",
  }[buildStatus];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Hammer className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">
            Build
          </span>
          {statusIcon && (
            <div className="flex items-center gap-1.5 ml-2 text-[10px] text-muted-foreground">
              {statusIcon}
              <span>{statusText}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {buildStatus === "running" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onStopBuild}
              className="h-5 px-1.5 text-[10px] text-red-400 hover:text-red-300"
            >
              <Square className="w-3 h-3 mr-1" />
              Stop
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearOutput}
              className="h-5 px-1.5 text-[10px]"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {!hasProject ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Hammer className="w-8 h-8 text-muted-foreground/20 mx-auto" />
            <p className="text-[11px] text-muted-foreground/50">
              No project open
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Task sections */}
          <div className="overflow-y-auto flex-shrink-0 max-h-[50%] border-b border-border/30">
            {/* Build tasks */}
            <TaskSection
              title="Build & Deploy"
              sectionId="build"
              tasks={buildTasks}
              expanded={expandedSections.has("build")}
              onToggle={toggleSection}
              onRunTask={onRunTask}
              disabled={buildStatus === "running"}
            />
            <TaskSection
              title="Testing"
              sectionId="test"
              tasks={testTasks}
              expanded={expandedSections.has("test")}
              onToggle={toggleSection}
              onRunTask={onRunTask}
              disabled={buildStatus === "running"}
            />
            <TaskSection
              title="Project"
              sectionId="other"
              tasks={otherTasks}
              expanded={expandedSections.has("other")}
              onToggle={toggleSection}
              onRunTask={onRunTask}
              disabled={buildStatus === "running"}
            />
          </div>

          {/* Build output */}
          <div className="flex-1 overflow-y-auto bg-background/30 p-2 space-y-0.5">
            {buildOutput.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-[10px] text-muted-foreground/40">
                  Run a task to see output here
                </p>
              </div>
            ) : (
              buildOutput.map((output, i) => (
                <OutputLine key={i} output={output} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Task section ────────────────────────────────────────────────────────────
function TaskSection({
  title,
  sectionId,
  tasks,
  expanded,
  onToggle,
  onRunTask,
  disabled,
}: {
  title: string;
  sectionId: string;
  tasks: BuildTask[];
  expanded: boolean;
  onToggle: (id: string) => void;
  onRunTask: (task: BuildTask) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(sectionId)}
        className="flex items-center gap-1 w-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/20"
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        {title}
      </button>
      {expanded && (
        <div className="pb-1">
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onRunTask(task)}
              disabled={disabled}
              className="flex items-center gap-2 w-full px-4 py-1.5 text-[11px] hover:bg-muted/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <TaskIcon taskId={task.id} />
              <div className="flex-1 text-left min-w-0">
                <div className="text-foreground/80">{task.name}</div>
                <div className="text-[9px] text-muted-foreground/50 truncate">
                  {task.command}
                </div>
              </div>
              <Play className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
