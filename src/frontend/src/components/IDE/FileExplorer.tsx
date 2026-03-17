import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  File,
  FileCode,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
  Image,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
  Trash2,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

// ── File tree types ─────────────────────────────────────────────────────────
export interface ProjectFile {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: ProjectFile[];
  size?: number;
}

interface FileExplorerProps {
  files: ProjectFile[];
  onFileSelect: (file: ProjectFile) => void;
  onCreateFile: (parentPath: string, name: string) => void;
  onCreateFolder: (parentPath: string, name: string) => void;
  onDeleteFile: (path: string) => void;
  onRefresh: () => void;
  selectedFilePath: string | null;
  projectName: string;
}

// ── File icon by extension ──────────────────────────────────────────────────
function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "kt":
    case "kts":
    case "java":
      return <FileCode className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    case "xml":
      return <FileCode className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
    case "json":
      return <FileJson className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
    case "gradle":
    case "groovy":
      return <FileCode className="w-3.5 h-3.5 text-green-400 shrink-0" />;
    case "png":
    case "jpg":
    case "jpeg":
    case "svg":
    case "webp":
      return <Image className="w-3.5 h-3.5 text-pink-400 shrink-0" />;
    case "md":
    case "txt":
      return <FileText className="w-3.5 h-3.5 text-blue-300 shrink-0" />;
    case "pro":
      return <File className="w-3.5 h-3.5 text-red-400 shrink-0" />;
    default:
      return <File className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
  }
}

// ── File tree node ──────────────────────────────────────────────────────────
function TreeNode({
  file,
  depth,
  expandedPaths,
  toggleExpand,
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  selectedFilePath,
}: {
  file: ProjectFile;
  depth: number;
  expandedPaths: Set<string>;
  toggleExpand: (path: string) => void;
  onFileSelect: (file: ProjectFile) => void;
  onCreateFile: (parentPath: string, name: string) => void;
  onCreateFolder: (parentPath: string, name: string) => void;
  onDeleteFile: (path: string) => void;
  selectedFilePath: string | null;
}) {
  const isDir = file.type === "directory";
  const isExpanded = expandedPaths.has(file.path);
  const isSelected = file.path === selectedFilePath;
  const [showMenu, setShowMenu] = useState(false);
  const [showNewInput, setShowNewInput] = useState<"file" | "folder" | null>(
    null,
  );
  const [newName, setNewName] = useState("");

  const handleClick = useCallback(() => {
    if (isDir) {
      toggleExpand(file.path);
    } else {
      onFileSelect(file);
    }
  }, [isDir, file, toggleExpand, onFileSelect]);

  const handleCreate = useCallback(() => {
    if (!newName.trim()) return;
    if (showNewInput === "file") {
      onCreateFile(file.path, newName.trim());
    } else {
      onCreateFolder(file.path, newName.trim());
    }
    setNewName("");
    setShowNewInput(null);
  }, [newName, showNewInput, file.path, onCreateFile, onCreateFolder]);

  return (
    <div>
      <div
        className={`group flex items-center gap-1 pr-1 py-[2px] hover:bg-muted/30 cursor-pointer text-[11px] font-mono transition-colors ${
          isSelected ? "bg-primary/10 text-primary" : "text-foreground/70"
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center gap-1 flex-1 min-w-0 text-left"
        >
          {isDir ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground/50 shrink-0" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              )}
            </>
          ) : (
            <>
              <span className="w-3 shrink-0" />
              <FileIcon name={file.name} />
            </>
          )}
          <span className="truncate ml-1">{file.name}</span>
        </button>

        {/* Context actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {isDir && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-0.5 rounded hover:bg-muted/50"
            >
              <MoreVertical className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile(file.path);
            }}
            className="p-0.5 rounded hover:bg-destructive/20"
          >
            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>

      {/* Context menu for directories */}
      {showMenu && isDir && (
        <div
          className="ml-8 my-1 p-1 bg-popover border border-border/50 rounded-md shadow-lg text-[10px]"
          style={{ marginLeft: `${depth * 12 + 16}px` }}
        >
          <button
            type="button"
            onClick={() => {
              setShowNewInput("file");
              setShowMenu(false);
            }}
            className="flex items-center gap-1.5 w-full px-2 py-1 rounded hover:bg-muted/50 text-foreground/70"
          >
            <Plus className="w-3 h-3" /> New File
          </button>
          <button
            type="button"
            onClick={() => {
              setShowNewInput("folder");
              setShowMenu(false);
            }}
            className="flex items-center gap-1.5 w-full px-2 py-1 rounded hover:bg-muted/50 text-foreground/70"
          >
            <Plus className="w-3 h-3" /> New Folder
          </button>
        </div>
      )}

      {/* New file/folder input */}
      {showNewInput && (
        <div
          className="flex items-center gap-1 py-1"
          style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
        >
          {showNewInput === "folder" ? (
            <Folder className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          ) : (
            <File className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          )}
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setShowNewInput(null);
            }}
            placeholder={
              showNewInput === "file" ? "filename.kt" : "folder-name"
            }
            className="flex-1 min-w-0 bg-transparent border border-border/50 rounded px-1 py-0.5 text-[10px] font-mono outline-none focus:border-primary/50"
          />
        </div>
      )}

      {/* Children */}
      {isDir && isExpanded && file.children && (
        <div>
          {file.children.map((child) => (
            <TreeNode
              key={child.path}
              file={child}
              depth={depth + 1}
              expandedPaths={expandedPaths}
              toggleExpand={toggleExpand}
              onFileSelect={onFileSelect}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onDeleteFile={onDeleteFile}
              selectedFilePath={selectedFilePath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({
  files,
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onRefresh,
  selectedFilePath,
  projectName,
}: FileExplorerProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set(["/"]),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  // Flatten files for search
  const flatFiles = useMemo(() => {
    const result: ProjectFile[] = [];
    const walk = (nodes: ProjectFile[]) => {
      for (const node of nodes) {
        result.push(node);
        if (node.children) walk(node.children);
      }
    };
    walk(files);
    return result;
  }, [files]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return flatFiles.filter(
      (f) => f.type === "file" && f.name.toLowerCase().includes(q),
    );
  }, [flatFiles, searchQuery]);

  return (
    <div className="flex flex-col h-full border-r border-border/50 bg-muted/10">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">
            {projectName || "Explorer"}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="h-5 w-5 p-0"
          >
            <Search className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-5 w-5 p-0"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-2 py-1.5 border-b border-border/30">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full bg-background/50 border border-border/50 rounded px-2 py-1 text-[11px] font-mono outline-none focus:border-primary/50"
          />
          {searchResults.length > 0 && (
            <div className="mt-1 max-h-40 overflow-y-auto">
              {searchResults.slice(0, 20).map((file) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => {
                    onFileSelect(file);
                    setSearchQuery("");
                    setShowSearch(false);
                  }}
                  className="flex items-center gap-1.5 w-full px-2 py-1 text-[10px] font-mono text-foreground/70 hover:bg-muted/30 rounded"
                >
                  <FileIcon name={file.name} />
                  <span className="truncate">{file.path}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Folder className="w-8 h-8 text-muted-foreground/20 mb-2" />
            <p className="text-[11px] text-muted-foreground/50">
              No project open
            </p>
            <p className="text-[10px] text-muted-foreground/30 mt-1">
              Create a new Android project to get started
            </p>
          </div>
        ) : (
          files.map((file) => (
            <TreeNode
              key={file.path}
              file={file}
              depth={0}
              expandedPaths={expandedPaths}
              toggleExpand={toggleExpand}
              onFileSelect={onFileSelect}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onDeleteFile={onDeleteFile}
              selectedFilePath={selectedFilePath}
            />
          ))
        )}
      </div>
    </div>
  );
}
