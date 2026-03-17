import { Button } from "@/components/ui/button";
import {
  Check,
  ChevronDown,
  Copy,
  Maximize2,
  Minimize2,
  Redo2,
  Save,
  Undo2,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ── Syntax token types ──────────────────────────────────────────────────────
type TokenType =
  | "keyword"
  | "string"
  | "comment"
  | "number"
  | "annotation"
  | "type"
  | "function"
  | "operator"
  | "plain";

interface Token {
  type: TokenType;
  value: string;
}

// ── Language keyword sets ───────────────────────────────────────────────────
const KOTLIN_KEYWORDS = new Set([
  "fun",
  "val",
  "var",
  "class",
  "object",
  "interface",
  "package",
  "import",
  "return",
  "if",
  "else",
  "when",
  "for",
  "while",
  "do",
  "break",
  "continue",
  "null",
  "true",
  "false",
  "is",
  "as",
  "in",
  "this",
  "super",
  "override",
  "open",
  "abstract",
  "sealed",
  "data",
  "enum",
  "companion",
  "private",
  "public",
  "protected",
  "internal",
  "suspend",
  "inline",
  "crossinline",
  "noinline",
  "reified",
  "typealias",
  "by",
  "lazy",
  "lateinit",
  "const",
  "throw",
  "try",
  "catch",
  "finally",
]);

const JAVA_KEYWORDS = new Set([
  "public",
  "private",
  "protected",
  "static",
  "final",
  "abstract",
  "class",
  "interface",
  "extends",
  "implements",
  "package",
  "import",
  "return",
  "if",
  "else",
  "for",
  "while",
  "do",
  "switch",
  "case",
  "break",
  "continue",
  "new",
  "this",
  "super",
  "void",
  "int",
  "long",
  "double",
  "float",
  "boolean",
  "char",
  "byte",
  "short",
  "null",
  "true",
  "false",
  "try",
  "catch",
  "finally",
  "throw",
  "throws",
  "synchronized",
  "volatile",
  "transient",
  "native",
  "instanceof",
  "enum",
]);

const XML_KEYWORDS = new Set([
  "xmlns",
  "android",
  "app",
  "tools",
  "encoding",
  "version",
]);

const GRADLE_KEYWORDS = new Set([
  "apply",
  "plugin",
  "plugins",
  "id",
  "android",
  "compileSdk",
  "defaultConfig",
  "applicationId",
  "minSdk",
  "targetSdk",
  "versionCode",
  "versionName",
  "buildTypes",
  "release",
  "debug",
  "dependencies",
  "implementation",
  "testImplementation",
  "api",
  "compileOnly",
  "runtimeOnly",
  "kapt",
  "ksp",
  "buildFeatures",
  "composeOptions",
  "kotlinOptions",
  "namespace",
  "signingConfigs",
  "productFlavors",
  "sourceSets",
  "repositories",
  "mavenCentral",
  "google",
  "jcenter",
  "true",
  "false",
]);

function getKeywords(language: string): Set<string> {
  switch (language) {
    case "kotlin":
    case "kt":
      return KOTLIN_KEYWORDS;
    case "java":
      return JAVA_KEYWORDS;
    case "xml":
      return XML_KEYWORDS;
    case "gradle":
    case "groovy":
      return GRADLE_KEYWORDS;
    default:
      return KOTLIN_KEYWORDS;
  }
}

// ── Simple tokenizer ────────────────────────────────────────────────────────
function tokenize(line: string, language: string): Token[] {
  const keywords = getKeywords(language);
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // Comments
    if (line[i] === "/" && line[i + 1] === "/") {
      tokens.push({ type: "comment", value: line.slice(i) });
      break;
    }

    // XML comments
    if (line[i] === "<" && line.slice(i, i + 4) === "<!--") {
      const end = line.indexOf("-->", i + 4);
      const commentEnd = end === -1 ? line.length : end + 3;
      tokens.push({ type: "comment", value: line.slice(i, commentEnd) });
      i = commentEnd;
      continue;
    }

    // Annotations
    if (line[i] === "@") {
      let j = i + 1;
      while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
      tokens.push({ type: "annotation", value: line.slice(i, j) });
      i = j;
      continue;
    }

    // Strings (double quotes)
    if (line[i] === '"') {
      let j = i + 1;
      while (j < line.length && line[j] !== '"') {
        if (line[j] === "\\") j++;
        j++;
      }
      tokens.push({ type: "string", value: line.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Strings (single quotes)
    if (line[i] === "'") {
      let j = i + 1;
      while (j < line.length && line[j] !== "'") {
        if (line[j] === "\\") j++;
        j++;
      }
      tokens.push({ type: "string", value: line.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[0-9._xXa-fA-fLlFfDd]/.test(line[j])) j++;
      tokens.push({ type: "number", value: line.slice(i, j) });
      i = j;
      continue;
    }

    // Words (keywords, types, functions)
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (keywords.has(word)) {
        tokens.push({ type: "keyword", value: word });
      } else if (
        word[0] === word[0].toUpperCase() &&
        /[a-zA-Z]/.test(word[0])
      ) {
        tokens.push({ type: "type", value: word });
      } else if (j < line.length && line[j] === "(") {
        tokens.push({ type: "function", value: word });
      } else {
        tokens.push({ type: "plain", value: word });
      }
      i = j;
      continue;
    }

    // Operators
    if (/[+\-*/%=<>!&|^~?:]/.test(line[i])) {
      tokens.push({ type: "operator", value: line[i] });
      i++;
      continue;
    }

    // Everything else
    tokens.push({ type: "plain", value: line[i] });
    i++;
  }

  return tokens;
}

const TOKEN_COLORS: Record<TokenType, string> = {
  keyword: "text-purple-400",
  string: "text-green-400",
  comment: "text-gray-500 italic",
  number: "text-orange-400",
  annotation: "text-yellow-400",
  type: "text-cyan-400",
  function: "text-blue-400",
  operator: "text-pink-400",
  plain: "text-foreground",
};

// ── Tab type ────────────────────────────────────────────────────────────────
export interface EditorTab {
  id: string;
  filename: string;
  filepath: string;
  content: string;
  language: string;
  isDirty: boolean;
}

interface CodeEditorProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onContentChange: (id: string, content: string) => void;
  onSave: (id: string) => void;
}

function detectLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    kt: "kotlin",
    kts: "kotlin",
    java: "java",
    xml: "xml",
    gradle: "gradle",
    groovy: "gradle",
    json: "json",
    md: "markdown",
    txt: "text",
    pro: "proguard",
    properties: "properties",
    yaml: "yaml",
    yml: "yaml",
  };
  return map[ext] ?? "text";
}

// ── Highlighted line renderer ───────────────────────────────────────────────
function HighlightedLine({
  line,
  language,
}: { line: string; language: string }) {
  const tokens = useMemo(() => tokenize(line, language), [line, language]);
  return (
    <span>
      {tokens.map((token, i) => (
        <span key={i} className={TOKEN_COLORS[token.type]}>
          {token.value}
        </span>
      ))}
    </span>
  );
}

export { detectLanguage };

export function CodeEditor({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onContentChange,
  onSave,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  const lines = useMemo(
    () => (activeTab?.content ?? "").split("\n"),
    [activeTab?.content],
  );

  // Sync scroll between textarea, line numbers, and highlight overlay
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current && highlightRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Update cursor position
  const handleSelect = useCallback(() => {
    if (!textareaRef.current || !activeTab) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = activeTab.content.slice(0, pos);
    const line = (textBefore.match(/\n/g) || []).length + 1;
    const lastNewline = textBefore.lastIndexOf("\n");
    const col = pos - lastNewline;
    setCursorPos({ line, col });
  }, [activeTab]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (activeTabId) onSave(activeTabId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTabId, onSave]);

  const handleCopyAll = useCallback(async () => {
    if (!activeTab) return;
    await navigator.clipboard.writeText(activeTab.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [activeTab]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Tab key inserts spaces
      if (e.key === "Tab") {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (!textarea || !activeTab) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const spaces = "    ";
        const newContent =
          activeTab.content.slice(0, start) +
          spaces +
          activeTab.content.slice(end);
        onContentChange(activeTab.id, newContent);
        // Restore cursor
        requestAnimationFrame(() => {
          textarea.selectionStart = start + 4;
          textarea.selectionEnd = start + 4;
        });
      }
      // Auto-close brackets
      const pairs: Record<string, string> = {
        "(": ")",
        "[": "]",
        "{": "}",
        '"': '"',
        "'": "'",
      };
      if (pairs[e.key]) {
        const textarea = textareaRef.current;
        if (!textarea || !activeTab) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        if (start !== end) {
          e.preventDefault();
          const selected = activeTab.content.slice(start, end);
          const newContent =
            activeTab.content.slice(0, start) +
            e.key +
            selected +
            pairs[e.key] +
            activeTab.content.slice(end);
          onContentChange(activeTab.id, newContent);
          requestAnimationFrame(() => {
            textarea.selectionStart = start + 1;
            textarea.selectionEnd = end + 1;
          });
        }
      }
    },
    [activeTab, onContentChange],
  );

  if (!activeTab) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background/50">
        <div className="text-center space-y-3">
          <div className="text-4xl opacity-20">{"{ }"}</div>
          <p className="text-sm text-muted-foreground">
            Open a file from the explorer to start editing
          </p>
          <p className="text-xs text-muted-foreground/60">
            Ctrl+S to save | Tab for indentation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex flex-col min-w-0 ${isFullscreen ? "fixed inset-0 z-50 bg-background" : ""}`}
    >
      {/* Tab bar */}
      <div className="flex items-center border-b border-border/50 bg-muted/20 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabSelect(tab.id)}
            className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border-r border-border/30 whitespace-nowrap transition-colors ${
              tab.id === activeTabId
                ? "bg-background text-foreground border-b-2 border-b-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${tab.isDirty ? "bg-yellow-400" : "bg-transparent"}`}
            />
            <span>{tab.filename}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-1 px-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyAll}
            className="h-6 px-1.5 text-[10px]"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSave(activeTab.id)}
            className="h-6 px-1.5 text-[10px]"
            disabled={!activeTab.isDirty}
          >
            <Save className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-6 px-1.5 text-[10px]"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 flex">
          {/* Line numbers */}
          <div
            ref={lineNumbersRef}
            className="w-12 shrink-0 bg-muted/20 border-r border-border/30 overflow-hidden select-none"
          >
            <div className="py-2">
              {lines.map((_, i) => (
                <div
                  key={i}
                  className={`px-2 text-right text-[11px] font-mono leading-5 ${
                    cursorPos.line === i + 1
                      ? "text-foreground bg-muted/30"
                      : "text-muted-foreground/40"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Code area with highlight overlay */}
          <div className="flex-1 relative">
            {/* Syntax highlight overlay */}
            <pre
              ref={highlightRef}
              className="absolute inset-0 py-2 px-3 text-[11px] font-mono leading-5 overflow-hidden pointer-events-none whitespace-pre"
              aria-hidden="true"
            >
              {lines.map((line, i) => (
                <div key={i} className="min-h-[20px]">
                  <HighlightedLine line={line} language={activeTab.language} />
                </div>
              ))}
            </pre>

            {/* Textarea (invisible text, handles input) */}
            <textarea
              ref={textareaRef}
              value={activeTab.content}
              onChange={(e) => onContentChange(activeTab.id, e.target.value)}
              onScroll={handleScroll}
              onSelect={handleSelect}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="absolute inset-0 w-full h-full py-2 px-3 text-[11px] font-mono leading-5 bg-transparent text-transparent caret-foreground resize-none outline-none selection:bg-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-border/30 bg-muted/20 text-[10px] font-mono text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>{activeTab.language.toUpperCase()}</span>
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span>{lines.length} lines</span>
        </div>
        <div className="flex items-center gap-3">
          <span>UTF-8</span>
          <span>Spaces: 4</span>
          {activeTab.isDirty && (
            <span className="text-yellow-400">Modified</span>
          )}
        </div>
      </div>
    </div>
  );
}
