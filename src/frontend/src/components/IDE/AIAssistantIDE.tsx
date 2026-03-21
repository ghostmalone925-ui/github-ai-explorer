import { Button } from "@/components/ui/button";
import {
  ArrowUp,
  Bot,
  Bug,
  Code2,
  Copy,
  FileText,
  Lightbulb,
  Loader2,
  MessageSquare,
  Sparkles,
  Trash2,
  Wand2,
  Zap,
} from "lucide-react";
import React, { useCallback, useRef, useState } from "react";

// ── AI types ────────────────────────────────────────────────────────────────

export type AIMessageRole = "user" | "assistant" | "system";

export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  timestamp: string;
  codeBlock?: {
    language: string;
    code: string;
  };
}

export type AIAction = "generate" | "explain" | "fix" | "optimize" | "test";

interface AIAssistantIDEProps {
  messages: AIMessage[];
  isProcessing: boolean;
  onSendMessage: (message: string, action?: AIAction) => void;
  onClearChat: () => void;
  onInsertCode: (code: string) => void;
  currentFileName: string | null;
  hasProject: boolean;
}

// ── Quick action buttons ────────────────────────────────────────────────────

const QUICK_ACTIONS: {
  action: AIAction;
  label: string;
  icon: typeof Code2;
  prompt: string;
}[] = [
  {
    action: "generate",
    label: "Generate",
    icon: Wand2,
    prompt: "Generate code for...",
  },
  {
    action: "explain",
    label: "Explain",
    icon: Lightbulb,
    prompt: "Explain this code",
  },
  {
    action: "fix",
    label: "Fix Bug",
    icon: Bug,
    prompt: "Find and fix the bug in this code",
  },
  {
    action: "optimize",
    label: "Optimize",
    icon: Zap,
    prompt: "Optimize this code for performance",
  },
  {
    action: "test",
    label: "Write Tests",
    icon: FileText,
    prompt: "Write unit tests for this code",
  },
];

// ── Code block renderer ─────────────────────────────────────────────────────

function CodeBlock({
  language,
  code,
  onInsert,
}: {
  language: string;
  code: string;
  onInsert: (code: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [code]);

  return (
    <div className="my-1.5 rounded border border-border/30 overflow-hidden">
      <div className="flex items-center justify-between px-2 py-0.5 bg-muted/30 border-b border-border/20">
        <span className="text-[9px] text-muted-foreground font-mono">
          {language}
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-5 px-1 text-[9px]"
          >
            {copied ? "Copied!" : <Copy className="w-2.5 h-2.5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onInsert(code)}
            className="h-5 px-1 text-[9px] text-primary"
          >
            <Code2 className="w-2.5 h-2.5 mr-0.5" />
            Insert
          </Button>
        </div>
      </div>
      <pre className="p-2 overflow-x-auto text-[10px] font-mono leading-relaxed text-foreground/80 bg-muted/10 max-h-60">
        {code}
      </pre>
    </div>
  );
}

// ── Message bubble ──────────────────────────────────────────────────────────

function MessageBubble({
  message,
  onInsertCode,
}: {
  message: AIMessage;
  onInsertCode: (code: string) => void;
}) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex items-center justify-center py-1">
        <span className="text-[9px] text-muted-foreground/40 bg-muted/20 px-2 py-0.5 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-2 px-3 py-2 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-primary/20" : "bg-purple-500/20"
        }`}
      >
        {isUser ? (
          <MessageSquare className="w-2.5 h-2.5 text-primary" />
        ) : (
          <Sparkles className="w-2.5 h-2.5 text-purple-400" />
        )}
      </div>
      <div
        className={`flex-1 min-w-0 ${isUser ? "text-right" : ""}`}
      >
        <div
          className={`inline-block text-left rounded-lg px-2.5 py-1.5 max-w-full ${
            isUser
              ? "bg-primary/10 text-foreground"
              : "bg-muted/30 text-foreground"
          }`}
        >
          {/* Render text content */}
          {message.content.split("\n").map((line, i) => (
            <p
              key={`${message.id}-line-${i}`}
              className="text-[11px] leading-relaxed"
            >
              {line || "\u00A0"}
            </p>
          ))}

          {/* Render code block if present */}
          {message.codeBlock && (
            <CodeBlock
              language={message.codeBlock.language}
              code={message.codeBlock.code}
              onInsert={onInsertCode}
            />
          )}
        </div>
        <div
          className={`text-[8px] text-muted-foreground/30 mt-0.5 ${
            isUser ? "text-right" : "text-left"
          }`}
        >
          {message.timestamp}
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function AIAssistantIDE({
  messages,
  isProcessing,
  onSendMessage,
  onClearChat,
  onInsertCode,
  currentFileName,
  hasProject,
}: AIAssistantIDEProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    }
  }, [input, isProcessing, onSendMessage]);

  const handleQuickAction = useCallback(
    (action: AIAction, prompt: string) => {
      onSendMessage(prompt, action);
    },
    [onSendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      // Auto-resize
      e.target.style.height = "auto";
      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    },
    [],
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/30 shrink-0">
        <div className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[11px] font-medium">AI Assistant</span>
          {isProcessing && (
            <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearChat}
          className="h-6 w-6 p-0"
          title="Clear chat"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {!hasProject ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <Bot className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-[11px] text-muted-foreground/50">
            Create a project to use AI assistance
          </p>
        </div>
      ) : (
        <>
          {/* Quick actions */}
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/20 overflow-x-auto">
            {QUICK_ACTIONS.map(({ action, label, icon: Icon, prompt }) => (
              <Button
                key={action}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action, prompt)}
                disabled={isProcessing}
                className="h-6 px-2 text-[9px] gap-1 shrink-0"
              >
                <Icon className="w-3 h-3" />
                {label}
              </Button>
            ))}
          </div>

          {/* Context indicator */}
          {currentFileName && (
            <div className="flex items-center gap-1 px-3 py-1 bg-purple-500/5 border-b border-border/10">
              <FileText className="w-2.5 h-2.5 text-purple-400/50" />
              <span className="text-[9px] text-muted-foreground/50">
                Context: {currentFileName}
              </span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <Sparkles className="w-8 h-8 text-purple-400/20 mb-2" />
                <p className="text-[11px] text-muted-foreground/50 mb-1">
                  AI-powered coding assistant
                </p>
                <p className="text-[9px] text-muted-foreground/30 max-w-xs">
                  Ask questions about your code, generate new features, fix
                  bugs, or get explanations. Use the quick actions above or type
                  your own prompt.
                </p>
              </div>
            ) : (
              <div className="py-1">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onInsertCode={onInsertCode}
                  />
                ))}
                {isProcessing && (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-bounce" />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-bounce"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-bounce"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border/30 p-2 shrink-0">
            <div className="flex items-end gap-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI anything about your code..."
                rows={1}
                className="flex-1 px-2 py-1.5 text-[11px] bg-muted/20 border border-border/30 rounded-lg outline-none focus:border-primary/50 resize-none min-h-[32px] max-h-[120px]"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                className="h-8 w-8 p-0 rounded-lg shrink-0"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p className="text-[8px] text-muted-foreground/30 mt-1 text-center">
              Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
}
