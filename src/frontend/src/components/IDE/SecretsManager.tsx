import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  Key,
  Lock,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useState } from "react";

// ── Secret types ────────────────────────────────────────────────────────────

export interface Secret {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

interface SecretsManagerProps {
  secrets: Secret[];
  onAddSecret: (key: string, value: string) => void;
  onUpdateSecret: (id: string, key: string, value: string) => void;
  onDeleteSecret: (id: string) => void;
  hasProject: boolean;
}

// ── Secret row component ────────────────────────────────────────────────────

function SecretRow({
  secret,
  onUpdate,
  onDelete,
}: {
  secret: Secret;
  onUpdate: (id: string, key: string, value: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showValue, setShowValue] = useState(false);
  const [editKey, setEditKey] = useState(secret.key);
  const [editValue, setEditValue] = useState(secret.value);
  const [copied, setCopied] = useState(false);

  const handleSave = useCallback(() => {
    if (editKey.trim()) {
      onUpdate(secret.id, editKey.trim(), editValue);
      setIsEditing(false);
    }
  }, [secret.id, editKey, editValue, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditKey(secret.key);
    setEditValue(secret.value);
    setIsEditing(false);
  }, [secret.key, secret.value]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(secret.value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [secret.value]);

  if (isEditing) {
    return (
      <div className="border border-primary/30 rounded-lg p-2.5 bg-primary/5 space-y-2">
        <div>
          <label className="text-[9px] text-muted-foreground/60 block mb-0.5">
            KEY
          </label>
          <input
            type="text"
            value={editKey}
            onChange={(e) => setEditKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
            className="w-full h-7 px-2 text-[11px] font-mono bg-muted/30 border border-border/30 rounded outline-none focus:border-primary/50"
            autoFocus
          />
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground/60 block mb-0.5">
            VALUE
          </label>
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={2}
            className="w-full px-2 py-1.5 text-[11px] font-mono bg-muted/30 border border-border/30 rounded outline-none focus:border-primary/50 resize-none"
          />
        </div>
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-6 px-2 text-[10px]"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!editKey.trim()}
            className="h-6 px-2 text-[10px]"
          >
            <Save className="w-3 h-3 mr-0.5" />
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border/20 rounded-lg p-2.5 hover:border-border/40 transition-colors group">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Key className="w-3 h-3 text-yellow-400/70" />
          <span className="text-[11px] font-mono font-medium text-foreground">
            {secret.key}
          </span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-5 w-5 p-0"
            title="Copy value"
          >
            {copied ? (
              <span className="text-[8px] text-green-400">ok</span>
            ) : (
              <Copy className="w-2.5 h-2.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-5 w-5 p-0"
            title="Edit"
          >
            <Edit3 className="w-2.5 h-2.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(secret.id)}
            className="h-5 w-5 p-0 hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setShowValue(!showValue)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
        >
          {showValue ? (
            <EyeOff className="w-2.5 h-2.5" />
          ) : (
            <Eye className="w-2.5 h-2.5" />
          )}
        </button>
        <span className="text-[10px] font-mono text-muted-foreground truncate">
          {showValue ? secret.value : "\u2022".repeat(Math.min(secret.value.length, 24))}
        </span>
      </div>
      <div className="text-[8px] text-muted-foreground/30 mt-1">
        Updated {secret.updatedAt}
      </div>
    </div>
  );
}

// ── Add secret dialog ───────────────────────────────────────────────────────

function AddSecretForm({
  onAdd,
  onClose,
  existingKeys,
}: {
  onAdd: (key: string, value: string) => void;
  onClose: () => void;
  existingKeys: Set<string>;
}) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const isDuplicate = existingKeys.has(key);

  const handleSubmit = useCallback(() => {
    if (key.trim() && value.trim() && !isDuplicate) {
      onAdd(key.trim(), value.trim());
      setKey("");
      setValue("");
      onClose();
    }
  }, [key, value, isDuplicate, onAdd, onClose]);

  return (
    <div className="border border-primary/30 rounded-lg p-3 bg-primary/5 space-y-2 mx-3 mb-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium flex items-center gap-1">
          <Plus className="w-3 h-3 text-primary" />
          New Secret
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-5 w-5 p-0"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      <div>
        <label className="text-[9px] text-muted-foreground/60 block mb-0.5">
          KEY
        </label>
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
          placeholder="API_KEY"
          className="w-full h-7 px-2 text-[11px] font-mono bg-muted/30 border border-border/30 rounded outline-none focus:border-primary/50"
          autoFocus
        />
        {isDuplicate && (
          <span className="text-[9px] text-destructive mt-0.5 block">
            Key already exists
          </span>
        )}
      </div>
      <div>
        <label className="text-[9px] text-muted-foreground/60 block mb-0.5">
          VALUE
        </label>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="your-secret-value"
          rows={2}
          className="w-full px-2 py-1.5 text-[11px] font-mono bg-muted/30 border border-border/30 rounded outline-none focus:border-primary/50 resize-none"
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={!key.trim() || !value.trim() || isDuplicate}
        className="w-full h-7 text-[11px]"
      >
        <Plus className="w-3 h-3 mr-1" />
        Add Secret
      </Button>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function SecretsManager({
  secrets,
  onAddSecret,
  onUpdateSecret,
  onDeleteSecret,
  hasProject,
}: SecretsManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState("");

  const existingKeys = new Set(secrets.map((s) => s.key));

  const filtered = filter
    ? secrets.filter((s) =>
        s.key.toLowerCase().includes(filter.toLowerCase()),
      )
    : secrets;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/30 shrink-0">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-medium">Secrets</span>
          <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
            {secrets.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddForm(true)}
          disabled={!hasProject}
          className="h-6 w-6 p-0 text-primary"
          title="Add secret"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Info banner */}
      {hasProject && (
        <div className="flex items-start gap-1.5 px-3 py-2 bg-yellow-500/5 border-b border-border/20">
          <AlertTriangle className="w-3 h-3 text-yellow-400/70 shrink-0 mt-0.5" />
          <p className="text-[9px] text-muted-foreground/60 leading-relaxed">
            Secrets are encrypted and available as environment variables in your
            build and runtime. Never expose them in client-side code.
          </p>
        </div>
      )}

      {/* Search */}
      {secrets.length > 3 && (
        <div className="px-3 py-1.5 border-b border-border/20">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter secrets..."
              className="w-full h-6 pl-6 pr-2 text-[11px] bg-muted/20 border border-border/20 rounded outline-none focus:border-primary/40"
            />
          </div>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="pt-2">
          <AddSecretForm
            onAdd={onAddSecret}
            onClose={() => setShowAddForm(false)}
            existingKeys={existingKeys}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!hasProject ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Lock className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-[11px] text-muted-foreground/50">
              Create a project to manage secrets
            </p>
          </div>
        ) : filtered.length === 0 && !showAddForm ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Key className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-[11px] text-muted-foreground/50">
              {filter ? "No secrets match your filter" : "No secrets configured"}
            </p>
            {!filter && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="mt-2 h-7 text-[11px]"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Your First Secret
              </Button>
            )}
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {filtered.map((secret) => (
              <SecretRow
                key={secret.id}
                secret={secret}
                onUpdate={onUpdateSecret}
                onDelete={onDeleteSecret}
              />
            ))}

            {/* Usage hint */}
            {secrets.length > 0 && (
              <div className="mt-3 p-2 bg-muted/20 rounded border border-border/20">
                <p className="text-[9px] text-muted-foreground/50 font-medium mb-1">
                  Usage in code:
                </p>
                <div className="bg-background rounded p-1.5 font-mono text-[10px] text-muted-foreground">
                  <div className="text-blue-400">
                    val apiKey = System.getenv(
                    <span className="text-green-400">
                      "{secrets[0]?.key ?? "API_KEY"}"
                    </span>
                    )
                  </div>
                </div>
                <div className="bg-background rounded p-1.5 font-mono text-[10px] text-muted-foreground mt-1">
                  <div className="text-blue-400">
                    // In build.gradle.kts
                  </div>
                  <div>
                    buildConfigField(
                    <span className="text-green-400">"String"</span>,{" "}
                    <span className="text-green-400">
                      "{secrets[0]?.key ?? "API_KEY"}"
                    </span>
                    , ...)
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
