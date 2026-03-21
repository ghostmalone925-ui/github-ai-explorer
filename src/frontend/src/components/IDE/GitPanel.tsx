import { Button } from "@/components/ui/button";
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock,
  Copy,
  Diff,
  FileText,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Minus,
  Plus,
  RefreshCw,
  Undo2,
  Upload,
  User,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

// ── Git types ───────────────────────────────────────────────────────────────

export type FileChangeStatus = "added" | "modified" | "deleted" | "renamed";

export interface GitFileChange {
  path: string;
  status: FileChangeStatus;
  staged: boolean;
  additions: number;
  deletions: number;
}

export interface GitCommitEntry {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  branch: string;
}

export interface GitBranchInfo {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  lastCommit: string;
}

export interface GitState {
  currentBranch: string;
  branches: GitBranchInfo[];
  changes: GitFileChange[];
  commits: GitCommitEntry[];
  isClean: boolean;
}

interface GitPanelProps {
  gitState: GitState;
  onStageFile: (path: string) => void;
  onUnstageFile: (path: string) => void;
  onStageAll: () => void;
  onUnstageAll: () => void;
  onCommit: (message: string) => void;
  onPush: () => void;
  onPull: () => void;
  onCheckoutBranch: (name: string) => void;
  onCreateBranch: (name: string) => void;
  onDiscardChanges: (path: string) => void;
  hasProject: boolean;
}

// ── Status colors / icons ───────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  FileChangeStatus,
  { color: string; label: string; icon: typeof Plus }
> = {
  added: { color: "text-green-400", label: "A", icon: Plus },
  modified: { color: "text-yellow-400", label: "M", icon: Diff },
  deleted: { color: "text-red-400", label: "D", icon: Minus },
  renamed: { color: "text-blue-400", label: "R", icon: FileText },
};

// ── File change row ─────────────────────────────────────────────────────────

function FileChangeRow({
  change,
  onStage,
  onUnstage,
  onDiscard,
}: {
  change: GitFileChange;
  onStage: () => void;
  onUnstage: () => void;
  onDiscard: () => void;
}) {
  const config = STATUS_CONFIG[change.status];
  const fileName = change.path.split("/").pop() || change.path;
  const dirPath = change.path.split("/").slice(0, -1).join("/");

  return (
    <div className="flex items-center gap-1 py-0.5 px-1 rounded hover:bg-muted/20 group text-[11px]">
      <span
        className={`w-4 text-center text-[10px] font-mono font-bold ${config.color}`}
      >
        {config.label}
      </span>
      <div className="flex-1 min-w-0 flex items-center gap-1">
        <span className="truncate">{fileName}</span>
        {dirPath && (
          <span className="text-[9px] text-muted-foreground/40 truncate">
            {dirPath}
          </span>
        )}
      </div>
      <span className="text-[9px] text-muted-foreground/30 shrink-0">
        <span className="text-green-400/60">+{change.additions}</span>{" "}
        <span className="text-red-400/60">-{change.deletions}</span>
      </span>
      <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 shrink-0">
        {change.staged ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUnstage}
            className="h-5 w-5 p-0"
            title="Unstage"
          >
            <Minus className="w-2.5 h-2.5" />
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onStage}
              className="h-5 w-5 p-0"
              title="Stage"
            >
              <Plus className="w-2.5 h-2.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDiscard}
              className="h-5 w-5 p-0 hover:text-destructive"
              title="Discard changes"
            >
              <Undo2 className="w-2.5 h-2.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Commit entry ────────────────────────────────────────────────────────────

function CommitRow({ commit }: { commit: GitCommitEntry }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(commit.hash).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [commit.hash]);

  return (
    <div className="flex items-start gap-2 py-1.5 px-2 hover:bg-muted/20 rounded group">
      <GitCommit className="w-3 h-3 text-primary/50 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] leading-tight truncate">{commit.message}</p>
        <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted-foreground/40">
          <span className="flex items-center gap-0.5">
            <User className="w-2 h-2" />
            {commit.author}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="w-2 h-2" />
            {commit.date}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-0.5 font-mono hover:text-foreground opacity-0 group-hover:opacity-100"
          >
            {copied ? (
              <Check className="w-2 h-2 text-green-400" />
            ) : (
              <Copy className="w-2 h-2" />
            )}
            {commit.shortHash}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Branch selector ─────────────────────────────────────────────────────────

function BranchSelector({
  branches,
  currentBranch,
  onCheckout,
  onCreate,
  onClose,
}: {
  branches: GitBranchInfo[];
  currentBranch: string;
  onCheckout: (name: string) => void;
  onCreate: (name: string) => void;
  onClose: () => void;
}) {
  const [newBranchName, setNewBranchName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="absolute top-full left-0 right-0 z-10 mt-1 mx-2 bg-background border border-border/50 rounded-lg shadow-xl overflow-hidden">
      <div className="max-h-48 overflow-auto">
        {branches
          .filter((b) => !b.isRemote)
          .map((branch) => (
            <button
              key={branch.name}
              type="button"
              onClick={() => {
                onCheckout(branch.name);
                onClose();
              }}
              className={`flex items-center gap-1.5 w-full px-3 py-1.5 text-[11px] hover:bg-muted/30 ${
                branch.isCurrent ? "text-primary" : ""
              }`}
            >
              {branch.isCurrent ? (
                <CircleDot className="w-3 h-3" />
              ) : (
                <GitBranch className="w-3 h-3 text-muted-foreground/50" />
              )}
              <span className="truncate">{branch.name}</span>
            </button>
          ))}
      </div>
      <div className="border-t border-border/30 p-2">
        {showCreate ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newBranchName}
              onChange={(e) =>
                setNewBranchName(
                  e.target.value.replace(/[^a-zA-Z0-9/_-]/g, ""),
                )
              }
              placeholder="new-branch-name"
              className="flex-1 h-6 px-2 text-[11px] font-mono bg-muted/30 border border-border/30 rounded outline-none focus:border-primary/50"
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => {
                if (newBranchName.trim()) {
                  onCreate(newBranchName.trim());
                  setNewBranchName("");
                  setShowCreate(false);
                  onClose();
                }
              }}
              disabled={!newBranchName.trim()}
              className="h-6 px-2 text-[10px]"
            >
              Create
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 w-full px-1 py-0.5 text-[10px] text-primary hover:underline"
          >
            <Plus className="w-3 h-3" />
            Create new branch
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function GitPanel({
  gitState,
  onStageFile,
  onUnstageFile,
  onStageAll,
  onUnstageAll,
  onCommit,
  onPush,
  onPull,
  onCheckoutBranch,
  onCreateBranch,
  onDiscardChanges,
  hasProject,
}: GitPanelProps) {
  const [commitMessage, setCommitMessage] = useState("");
  const [showBranches, setShowBranches] = useState(false);
  const [activeTab, setActiveTab] = useState<"changes" | "history">("changes");

  const stagedChanges = useMemo(
    () => gitState.changes.filter((c) => c.staged),
    [gitState.changes],
  );
  const unstagedChanges = useMemo(
    () => gitState.changes.filter((c) => !c.staged),
    [gitState.changes],
  );

  const handleCommit = useCallback(() => {
    if (commitMessage.trim() && stagedChanges.length > 0) {
      onCommit(commitMessage.trim());
      setCommitMessage("");
    }
  }, [commitMessage, stagedChanges.length, onCommit]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/30 shrink-0">
        <div className="flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-medium">Git</span>
          {!gitState.isClean && (
            <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">
              {gitState.changes.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPull}
            disabled={!hasProject}
            className="h-6 w-6 p-0"
            title="Pull"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onPush}
            disabled={!hasProject}
            className="h-6 w-6 p-0"
            title="Push"
          >
            <Upload className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {!hasProject ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <GitBranch className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-[11px] text-muted-foreground/50">
            Create a project to use Git
          </p>
        </div>
      ) : (
        <>
          {/* Branch selector */}
          <div className="relative px-2 py-1.5 border-b border-border/20">
            <button
              type="button"
              onClick={() => setShowBranches(!showBranches)}
              className="flex items-center gap-1.5 w-full px-2 py-1 rounded hover:bg-muted/30 text-[11px]"
            >
              <GitBranch className="w-3 h-3 text-primary" />
              <span className="font-mono font-medium">
                {gitState.currentBranch}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto" />
            </button>
            {showBranches && (
              <BranchSelector
                branches={gitState.branches}
                currentBranch={gitState.currentBranch}
                onCheckout={onCheckoutBranch}
                onCreate={onCreateBranch}
                onClose={() => setShowBranches(false)}
              />
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border/20 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("changes")}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] border-b-2 ${
                activeTab === "changes"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Diff className="w-3 h-3" />
              Changes
              {gitState.changes.length > 0 && (
                <span className="text-[8px] bg-muted px-1 rounded">
                  {gitState.changes.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] border-b-2 ${
                activeTab === "history"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="w-3 h-3" />
              History
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {activeTab === "changes" ? (
              <>
                {/* Commit input */}
                <div className="px-2 py-2 border-b border-border/20">
                  <textarea
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Commit message..."
                    rows={2}
                    className="w-full px-2 py-1.5 text-[11px] bg-muted/20 border border-border/30 rounded outline-none focus:border-primary/50 resize-none"
                  />
                  <Button
                    onClick={handleCommit}
                    disabled={
                      !commitMessage.trim() || stagedChanges.length === 0
                    }
                    className="w-full h-7 text-[11px] mt-1"
                  >
                    <GitCommit className="w-3 h-3 mr-1" />
                    Commit ({stagedChanges.length} staged)
                  </Button>
                </div>

                {/* Staged changes */}
                {stagedChanges.length > 0 && (
                  <div className="border-b border-border/20">
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-[10px] font-medium text-green-400">
                        Staged ({stagedChanges.length})
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onUnstageAll}
                        className="h-5 px-1 text-[9px]"
                      >
                        Unstage All
                      </Button>
                    </div>
                    {stagedChanges.map((change) => (
                      <FileChangeRow
                        key={change.path}
                        change={change}
                        onStage={() => onStageFile(change.path)}
                        onUnstage={() => onUnstageFile(change.path)}
                        onDiscard={() => onDiscardChanges(change.path)}
                      />
                    ))}
                  </div>
                )}

                {/* Unstaged changes */}
                {unstagedChanges.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        Changes ({unstagedChanges.length})
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onStageAll}
                        className="h-5 px-1 text-[9px]"
                      >
                        Stage All
                      </Button>
                    </div>
                    {unstagedChanges.map((change) => (
                      <FileChangeRow
                        key={change.path}
                        change={change}
                        onStage={() => onStageFile(change.path)}
                        onUnstage={() => onUnstageFile(change.path)}
                        onDiscard={() => onDiscardChanges(change.path)}
                      />
                    ))}
                  </div>
                )}

                {gitState.isClean && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Check className="w-6 h-6 text-green-400/50 mb-1" />
                    <p className="text-[11px] text-muted-foreground/50">
                      Working tree clean
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="py-1">
                {gitState.commits.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/50 text-center py-8">
                    No commits yet
                  </p>
                ) : (
                  gitState.commits.map((commit) => (
                    <CommitRow key={commit.hash} commit={commit} />
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
