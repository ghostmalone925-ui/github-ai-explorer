import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  ArrowLeftRight,
  Eye,
  GitFork,
  Scale,
  Search,
  Star,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { RepoHealthScore } from "../components/RepoHealthScore";
import { useGetMyGithubToken } from "../hooks/useQueries";
import { getRepositoryByFullName } from "../services/githubApi";
import type { Repository } from "../types/github";

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface ComparisonBarProps {
  labelA: string;
  valueA: number;
  labelB: string;
  valueB: number;
  formatFn?: (n: number) => string;
}

function ComparisonBar({
  labelA,
  valueA,
  labelB,
  valueB,
  formatFn = formatCount,
}: ComparisonBarProps) {
  const total = valueA + valueB || 1;
  const pctA = Math.round((valueA / total) * 100);
  const pctB = 100 - pctA;
  const winner = valueA > valueB ? "a" : valueB > valueA ? "b" : "tie";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-mono">
        <span
          className={
            winner === "a"
              ? "text-primary font-semibold"
              : "text-muted-foreground"
          }
        >
          {formatFn(valueA)}
        </span>
        <span
          className={
            winner === "b"
              ? "text-primary font-semibold"
              : "text-muted-foreground"
          }
        >
          {formatFn(valueB)}
        </span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
        <div
          className={`transition-all duration-500 ${
            winner === "a" ? "bg-primary" : "bg-primary/40"
          }`}
          style={{ width: `${pctA}%` }}
        />
        <div
          className={`transition-all duration-500 ${
            winner === "b" ? "bg-primary" : "bg-primary/40"
          }`}
          style={{ width: `${pctB}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="truncate max-w-[45%]">{labelA}</span>
        <span className="truncate max-w-[45%] text-right">{labelB}</span>
      </div>
    </div>
  );
}

interface RepoInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  isLoading: boolean;
}

function RepoInput({
  label,
  value,
  onChange,
  onClear,
  isLoading,
}: RepoInputProps) {
  return (
    <div className="flex-1 min-w-0">
      {/* biome-ignore lint/a11y/noLabelWithoutControl: input is nested inside label wrapper */}
      <label className="text-xs font-mono text-muted-foreground mb-1.5 block">
        <span className="mb-1.5 block">{label}</span>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="owner/repo"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-9 pr-8 font-mono text-sm bg-secondary/50 border-border focus:border-primary h-10"
            disabled={isLoading}
          />
          {value && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </label>
    </div>
  );
}

interface StatRowProps {
  label: string;
  icon: React.ElementType;
  valueA: string;
  valueB: string;
}

function StatRow({ label, icon: Icon, valueA, valueB }: StatRowProps) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
      <div className="w-28 flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="flex-1 text-xs font-mono text-foreground text-center">
        {valueA}
      </div>
      <div className="flex-1 text-xs font-mono text-foreground text-center">
        {valueB}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { data: token } = useGetMyGithubToken();
  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");
  const [repoA, setRepoA] = useState<Repository | null>(null);
  const [repoB, setRepoB] = useState<Repository | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!inputA.trim() || !inputB.trim()) {
      setError("Please enter both repository names (e.g. facebook/react)");
      return;
    }
    setIsLoading(true);
    setError(null);
    setRepoA(null);
    setRepoB(null);
    try {
      const [a, b] = await Promise.all([
        getRepositoryByFullName(inputA.trim(), token),
        getRepositoryByFullName(inputB.trim(), token),
      ]);
      setRepoA(a);
      setRepoB(b);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch one or both repositories.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCompare();
  };

  return (
    <TooltipProvider>
      <div className="max-w-5xl mx-auto px-4 py-8" onKeyDown={handleKeyDown}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            <h1 className="font-mono font-bold text-xl text-foreground">
              Compare <span className="text-primary">Repositories</span>
            </h1>
          </div>
          <p className="text-sm text-muted-foreground font-mono">
            Compare two GitHub repositories side by side -- stars, forks,
            activity, health score, and more.
          </p>
        </div>

        {/* Input row */}
        <div className="flex gap-3 items-end mb-6 flex-wrap">
          <RepoInput
            label="Repository A"
            value={inputA}
            onChange={setInputA}
            onClear={() => {
              setInputA("");
              setRepoA(null);
            }}
            isLoading={isLoading}
          />
          <div className="pb-2">
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <RepoInput
            label="Repository B"
            value={inputB}
            onChange={setInputB}
            onClear={() => {
              setInputB("");
              setRepoB(null);
            }}
            isLoading={isLoading}
          />
          <Button
            onClick={handleCompare}
            disabled={isLoading}
            size="sm"
            className="font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-neon h-10 px-5"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Comparing...
              </span>
            ) : (
              <>
                <Scale className="w-3.5 h-3.5 mr-1.5" />
                Compare
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs font-mono">
            {error}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-6">
            {[0, 1].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {repoA && repoB && (
          <div className="space-y-6">
            {/* Repo headers */}
            <div className="grid grid-cols-2 gap-6">
              {[repoA, repoB].map((repo) => (
                <div
                  key={repo.id}
                  className="rounded-xl border border-border/50 bg-card/30 p-4"
                >
                  <h2 className="font-mono font-bold text-sm text-primary truncate">
                    {repo.full_name}
                  </h2>
                  {repo.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    {repo.language && (
                      <span className="font-mono">{repo.language}</span>
                    )}
                    {repo.license && (
                      <span className="font-mono">{repo.license.name}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Comparison bars */}
            <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-4">
              <h3 className="font-mono font-semibold text-sm text-foreground mb-2">
                Head to Head
              </h3>
              <ComparisonBar
                labelA={repoA.full_name}
                valueA={repoA.stargazers_count}
                labelB={repoB.full_name}
                valueB={repoB.stargazers_count}
              />
              <ComparisonBar
                labelA={repoA.full_name}
                valueA={repoA.forks_count}
                labelB={repoB.full_name}
                valueB={repoB.forks_count}
              />
              <ComparisonBar
                labelA={repoA.full_name}
                valueA={repoA.watchers_count}
                labelB={repoB.full_name}
                valueB={repoB.watchers_count}
              />
              <ComparisonBar
                labelA={repoA.full_name}
                valueA={repoA.open_issues_count}
                labelB={repoB.full_name}
                valueB={repoB.open_issues_count}
              />
              <ComparisonBar
                labelA={repoA.full_name}
                valueA={repoA.size}
                labelB={repoB.full_name}
                valueB={repoB.size}
                formatFn={(n) =>
                  n >= 1024 ? `${(n / 1024).toFixed(1)} MB` : `${n} KB`
                }
              />
            </div>

            {/* Stat table */}
            <div className="rounded-xl border border-border/50 bg-card/30 p-4">
              <h3 className="font-mono font-semibold text-sm text-foreground mb-3">
                Details
              </h3>
              <div className="flex items-center gap-3 py-2 border-b border-border/30">
                <div className="w-28 text-xs text-muted-foreground shrink-0" />
                <div className="flex-1 text-xs font-mono text-primary text-center font-semibold truncate">
                  {repoA.full_name}
                </div>
                <div className="flex-1 text-xs font-mono text-primary text-center font-semibold truncate">
                  {repoB.full_name}
                </div>
              </div>
              <StatRow
                label="Stars"
                icon={Star}
                valueA={formatCount(repoA.stargazers_count)}
                valueB={formatCount(repoB.stargazers_count)}
              />
              <StatRow
                label="Forks"
                icon={GitFork}
                valueA={formatCount(repoA.forks_count)}
                valueB={formatCount(repoB.forks_count)}
              />
              <StatRow
                label="Watchers"
                icon={Eye}
                valueA={formatCount(repoA.watchers_count)}
                valueB={formatCount(repoB.watchers_count)}
              />
              <StatRow
                label="Language"
                icon={Scale}
                valueA={repoA.language || "N/A"}
                valueB={repoB.language || "N/A"}
              />
              <StatRow
                label="License"
                icon={Scale}
                valueA={repoA.license?.name || "None"}
                valueB={repoB.license?.name || "None"}
              />
              <StatRow
                label="Created"
                icon={Scale}
                valueA={formatDate(repoA.created_at)}
                valueB={formatDate(repoB.created_at)}
              />
              <StatRow
                label="Last Push"
                icon={Scale}
                valueA={formatDate(repoA.pushed_at)}
                valueB={formatDate(repoB.pushed_at)}
              />
            </div>

            {/* Health scores */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-mono font-semibold text-xs text-muted-foreground mb-2">
                  {repoA.full_name}
                </h3>
                <RepoHealthScore repo={repoA} />
              </div>
              <div>
                <h3 className="font-mono font-semibold text-xs text-muted-foreground mb-2">
                  {repoB.full_name}
                </h3>
                <RepoHealthScore repo={repoB} />
              </div>
            </div>
          </div>
        )}

        {/* Suggestion when empty */}
        {!repoA && !repoB && !isLoading && !error && (
          <div className="text-center py-16 text-muted-foreground">
            <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-mono text-sm mb-2">
              Enter two repositories to compare
            </p>
            <p className="text-xs">
              Try comparing{" "}
              <button
                type="button"
                onClick={() => {
                  setInputA("facebook/react");
                  setInputB("vuejs/vue");
                }}
                className="text-primary hover:underline"
              >
                facebook/react vs vuejs/vue
              </button>
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
