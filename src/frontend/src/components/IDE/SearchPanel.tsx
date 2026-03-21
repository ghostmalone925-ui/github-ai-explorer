import { Button } from "@/components/ui/button";
import {
  CaseSensitive,
  ChevronDown,
  ChevronRight,
  FileText,
  Regex,
  Replace,
  ReplaceAll,
  Search,
  WholeWord,
  X,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

// ── Search types ────────────────────────────────────────────────────────────

export interface SearchMatch {
  line: number;
  column: number;
  length: number;
  lineContent: string;
  preContext: string;
  postContext: string;
}

export interface SearchFileResult {
  filePath: string;
  fileName: string;
  matches: SearchMatch[];
}

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
}

interface SearchPanelProps {
  results: SearchFileResult[];
  isSearching: boolean;
  onSearch: (query: string, options: SearchOptions) => void;
  onReplace: (query: string, replacement: string, options: SearchOptions) => void;
  onReplaceAll: (query: string, replacement: string, options: SearchOptions) => void;
  onOpenResult: (filePath: string, line: number) => void;
  totalMatches: number;
  hasProject: boolean;
}

// ── Highlighted match text ──────────────────────────────────────────────────

function HighlightedLine({
  content,
  matchColumn,
  matchLength,
}: {
  content: string;
  matchColumn: number;
  matchLength: number;
}) {
  const before = content.substring(0, matchColumn);
  const match = content.substring(matchColumn, matchColumn + matchLength);
  const after = content.substring(matchColumn + matchLength);

  return (
    <span className="font-mono text-[10px] leading-relaxed">
      <span className="text-muted-foreground/60">{before}</span>
      <span className="bg-yellow-400/30 text-yellow-200 rounded-sm px-0.5">
        {match}
      </span>
      <span className="text-muted-foreground/60">{after}</span>
    </span>
  );
}

// ── File result group ───────────────────────────────────────────────────────

function FileResultGroup({
  result,
  onOpenResult,
}: {
  result: SearchFileResult;
  onOpenResult: (filePath: string, line: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border-b border-border/10 last:border-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 w-full px-2 py-1 hover:bg-muted/20 text-[11px]"
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
        )}
        <FileText className="w-3 h-3 text-primary/60 shrink-0" />
        <span className="truncate">{result.fileName}</span>
        <span className="text-[9px] text-muted-foreground/40 ml-auto shrink-0">
          {result.matches.length}
        </span>
      </button>
      {expanded && (
        <div>
          {result.matches.map((match, idx) => (
            <button
              key={`${match.line}-${match.column}-${idx}`}
              type="button"
              onClick={() => onOpenResult(result.filePath, match.line)}
              className="flex items-start gap-1.5 w-full px-2 pl-7 py-0.5 hover:bg-muted/20 text-left"
            >
              <span className="text-[9px] text-muted-foreground/40 font-mono w-6 text-right shrink-0 pt-0.5">
                {match.line}
              </span>
              <div className="min-w-0 overflow-hidden">
                <HighlightedLine
                  content={match.lineContent}
                  matchColumn={match.column}
                  matchLength={match.length}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function SearchPanel({
  results,
  isSearching,
  onSearch,
  onReplace,
  onReplaceAll,
  onOpenResult,
  totalMatches,
  hasProject,
}: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [showReplace, setShowReplace] = useState(false);
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
  });

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch(query, options);
    }
  }, [query, options, onSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch],
  );

  const toggleOption = useCallback(
    (key: keyof SearchOptions) => {
      const newOptions = { ...options, [key]: !options[key] };
      setOptions(newOptions);
      if (query.trim()) {
        onSearch(query, newOptions);
      }
    },
    [options, query, onSearch],
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/30 shrink-0">
        <div className="flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-medium">Search</span>
          {totalMatches > 0 && (
            <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
              {totalMatches} match{totalMatches !== 1 ? "es" : ""}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowReplace(!showReplace)}
          className={`h-6 w-6 p-0 ${showReplace ? "text-primary" : ""}`}
          title="Toggle replace"
        >
          <Replace className="w-3 h-3" />
        </Button>
      </div>

      {!hasProject ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <Search className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-[11px] text-muted-foreground/50">
            Create a project to search files
          </p>
        </div>
      ) : (
        <>
          {/* Search input */}
          <div className="px-2 py-2 border-b border-border/20 space-y-1.5">
            <div className="flex items-center gap-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search in files..."
                  className="w-full h-7 px-2 pr-20 text-[11px] bg-muted/20 border border-border/30 rounded outline-none focus:border-primary/50"
                  autoFocus
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleOption("caseSensitive")}
                    className={`h-5 w-5 p-0 ${options.caseSensitive ? "text-primary bg-primary/10" : "text-muted-foreground/40"}`}
                    title="Case sensitive"
                  >
                    <CaseSensitive className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleOption("wholeWord")}
                    className={`h-5 w-5 p-0 ${options.wholeWord ? "text-primary bg-primary/10" : "text-muted-foreground/40"}`}
                    title="Whole word"
                  >
                    <WholeWord className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleOption("useRegex")}
                    className={`h-5 w-5 p-0 ${options.useRegex ? "text-primary bg-primary/10" : "text-muted-foreground/40"}`}
                    title="Regex"
                  >
                    <Regex className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Replace input */}
            {showReplace && (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                  placeholder="Replace with..."
                  className="flex-1 h-7 px-2 text-[11px] bg-muted/20 border border-border/30 rounded outline-none focus:border-primary/50"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReplace(query, replacement, options)}
                  disabled={!query.trim() || totalMatches === 0}
                  className="h-7 w-7 p-0"
                  title="Replace next"
                >
                  <Replace className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReplaceAll(query, replacement, options)}
                  disabled={!query.trim() || totalMatches === 0}
                  className="h-7 w-7 p-0"
                  title="Replace all"
                >
                  <ReplaceAll className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-[11px] text-muted-foreground/50">
                  Searching...
                </span>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                {query.trim() ? (
                  <>
                    <Search className="w-6 h-6 text-muted-foreground/20 mb-1" />
                    <p className="text-[11px] text-muted-foreground/40">
                      No results for "{query}"
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-muted-foreground/40">
                    Type to search across all project files
                  </p>
                )}
              </div>
            ) : (
              <div>
                {/* Summary */}
                <div className="px-2 py-1 text-[9px] text-muted-foreground/40 border-b border-border/10">
                  {totalMatches} result{totalMatches !== 1 ? "s" : ""} in{" "}
                  {results.length} file{results.length !== 1 ? "s" : ""}
                </div>
                {results.map((result) => (
                  <FileResultGroup
                    key={result.filePath}
                    result={result}
                    onOpenResult={onOpenResult}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
