import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowUpCircle,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Library,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

// ── Dependency types ────────────────────────────────────────────────────────

export type DependencyScope =
  | "implementation"
  | "testImplementation"
  | "androidTestImplementation"
  | "kapt"
  | "ksp"
  | "api"
  | "compileOnly";

export interface GradleDependency {
  id: string;
  group: string;
  artifact: string;
  version: string;
  scope: DependencyScope;
  latestVersion?: string;
  hasUpdate: boolean;
  description?: string;
}

export interface DependencyGroup {
  name: string;
  dependencies: GradleDependency[];
}

interface DependencyManagerProps {
  dependencies: GradleDependency[];
  onAddDependency: (dep: Omit<GradleDependency, "id" | "hasUpdate">) => void;
  onRemoveDependency: (id: string) => void;
  onUpdateDependency: (id: string, newVersion: string) => void;
  onUpdateAll: () => void;
  onRefresh: () => void;
  hasProject: boolean;
}

// ── Scope colors ────────────────────────────────────────────────────────────

const SCOPE_COLORS: Record<DependencyScope, string> = {
  implementation: "text-blue-400 bg-blue-400/10",
  testImplementation: "text-green-400 bg-green-400/10",
  androidTestImplementation: "text-teal-400 bg-teal-400/10",
  kapt: "text-purple-400 bg-purple-400/10",
  ksp: "text-pink-400 bg-pink-400/10",
  api: "text-orange-400 bg-orange-400/10",
  compileOnly: "text-yellow-400 bg-yellow-400/10",
};

// ── Popular dependency catalog for search ───────────────────────────────────

interface CatalogEntry {
  group: string;
  artifact: string;
  version: string;
  description: string;
  scope: DependencyScope;
}

const DEPENDENCY_CATALOG: CatalogEntry[] = [
  {
    group: "androidx.compose.ui",
    artifact: "ui",
    version: "1.6.8",
    description: "Compose UI fundamentals",
    scope: "implementation",
  },
  {
    group: "androidx.compose.material3",
    artifact: "material3",
    version: "1.2.1",
    description: "Material Design 3 for Compose",
    scope: "implementation",
  },
  {
    group: "androidx.navigation",
    artifact: "navigation-compose",
    version: "2.7.7",
    description: "Navigation for Jetpack Compose",
    scope: "implementation",
  },
  {
    group: "androidx.lifecycle",
    artifact: "lifecycle-viewmodel-compose",
    version: "2.8.4",
    description: "ViewModel integration for Compose",
    scope: "implementation",
  },
  {
    group: "androidx.room",
    artifact: "room-runtime",
    version: "2.6.1",
    description: "Room persistence library",
    scope: "implementation",
  },
  {
    group: "androidx.room",
    artifact: "room-compiler",
    version: "2.6.1",
    description: "Room annotation processor",
    scope: "ksp",
  },
  {
    group: "com.squareup.retrofit2",
    artifact: "retrofit",
    version: "2.11.0",
    description: "Type-safe HTTP client",
    scope: "implementation",
  },
  {
    group: "com.squareup.retrofit2",
    artifact: "converter-gson",
    version: "2.11.0",
    description: "Gson converter for Retrofit",
    scope: "implementation",
  },
  {
    group: "com.squareup.okhttp3",
    artifact: "okhttp",
    version: "4.12.0",
    description: "HTTP & HTTP/2 client",
    scope: "implementation",
  },
  {
    group: "com.squareup.okhttp3",
    artifact: "logging-interceptor",
    version: "4.12.0",
    description: "OkHttp logging interceptor",
    scope: "implementation",
  },
  {
    group: "io.coil-kt",
    artifact: "coil-compose",
    version: "2.7.0",
    description: "Image loading for Compose",
    scope: "implementation",
  },
  {
    group: "com.google.dagger",
    artifact: "hilt-android",
    version: "2.51.1",
    description: "Dependency injection with Hilt",
    scope: "implementation",
  },
  {
    group: "com.google.dagger",
    artifact: "hilt-compiler",
    version: "2.51.1",
    description: "Hilt annotation processor",
    scope: "kapt",
  },
  {
    group: "org.jetbrains.kotlinx",
    artifact: "kotlinx-coroutines-android",
    version: "1.8.1",
    description: "Kotlin coroutines for Android",
    scope: "implementation",
  },
  {
    group: "org.jetbrains.kotlinx",
    artifact: "kotlinx-serialization-json",
    version: "1.7.1",
    description: "Kotlin JSON serialization",
    scope: "implementation",
  },
  {
    group: "com.google.accompanist",
    artifact: "accompanist-permissions",
    version: "0.35.1",
    description: "Permissions for Compose",
    scope: "implementation",
  },
  {
    group: "io.mockk",
    artifact: "mockk",
    version: "1.13.12",
    description: "Mocking library for Kotlin",
    scope: "testImplementation",
  },
  {
    group: "app.cash.turbine",
    artifact: "turbine",
    version: "1.1.0",
    description: "Flow testing library",
    scope: "testImplementation",
  },
  {
    group: "com.google.truth",
    artifact: "truth",
    version: "1.4.4",
    description: "Fluent assertions",
    scope: "testImplementation",
  },
  {
    group: "androidx.compose.ui",
    artifact: "ui-test-junit4",
    version: "1.6.8",
    description: "Compose UI testing",
    scope: "androidTestImplementation",
  },
];

// ── Add dependency dialog ───────────────────────────────────────────────────

function AddDependencyDialog({
  existingIds,
  onAdd,
  onClose,
}: {
  existingIds: Set<string>;
  onAdd: (dep: Omit<GradleDependency, "id" | "hasUpdate">) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manualGroup, setManualGroup] = useState("");
  const [manualArtifact, setManualArtifact] = useState("");
  const [manualVersion, setManualVersion] = useState("");
  const [manualScope, setManualScope] = useState<DependencyScope>("implementation");

  const filtered = useMemo(() => {
    if (!search.trim()) return DEPENDENCY_CATALOG;
    const q = search.toLowerCase();
    return DEPENDENCY_CATALOG.filter(
      (d) =>
        d.group.toLowerCase().includes(q) ||
        d.artifact.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q),
    );
  }, [search]);

  const handleAddCatalogEntry = useCallback(
    (entry: CatalogEntry) => {
      onAdd({
        group: entry.group,
        artifact: entry.artifact,
        version: entry.version,
        scope: entry.scope,
        description: entry.description,
      });
    },
    [onAdd],
  );

  const handleAddManual = useCallback(() => {
    if (!manualGroup.trim() || !manualArtifact.trim() || !manualVersion.trim())
      return;
    onAdd({
      group: manualGroup.trim(),
      artifact: manualArtifact.trim(),
      version: manualVersion.trim(),
      scope: manualScope,
    });
    setManualGroup("");
    setManualArtifact("");
    setManualVersion("");
  }, [manualGroup, manualArtifact, manualVersion, manualScope, onAdd]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-background border border-border/50 rounded-lg shadow-2xl w-[520px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Add Dependency</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
          <Button
            variant={manualMode ? "ghost" : "secondary"}
            size="sm"
            onClick={() => setManualMode(false)}
            className="h-7 text-[11px]"
          >
            <Search className="w-3 h-3 mr-1" />
            Browse Catalog
          </Button>
          <Button
            variant={manualMode ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setManualMode(true)}
            className="h-7 text-[11px]"
          >
            <Package className="w-3 h-3 mr-1" />
            Manual Entry
          </Button>
        </div>

        {manualMode ? (
          <div className="p-4 space-y-3">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">
                Group
              </label>
              <input
                type="text"
                value={manualGroup}
                onChange={(e) => setManualGroup(e.target.value)}
                placeholder="com.example.library"
                className="w-full h-8 px-2 text-[12px] bg-muted/30 border border-border/30 rounded outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">
                Artifact
              </label>
              <input
                type="text"
                value={manualArtifact}
                onChange={(e) => setManualArtifact(e.target.value)}
                placeholder="library-core"
                className="w-full h-8 px-2 text-[12px] bg-muted/30 border border-border/30 rounded outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[11px] text-muted-foreground mb-1 block">
                  Version
                </label>
                <input
                  type="text"
                  value={manualVersion}
                  onChange={(e) => setManualVersion(e.target.value)}
                  placeholder="1.0.0"
                  className="w-full h-8 px-2 text-[12px] bg-muted/30 border border-border/30 rounded outline-none focus:border-primary/50"
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] text-muted-foreground mb-1 block">
                  Scope
                </label>
                <select
                  value={manualScope}
                  onChange={(e) =>
                    setManualScope(e.target.value as DependencyScope)
                  }
                  className="w-full h-8 px-2 text-[12px] bg-muted/30 border border-border/30 rounded outline-none focus:border-primary/50"
                >
                  <option value="implementation">implementation</option>
                  <option value="testImplementation">testImplementation</option>
                  <option value="androidTestImplementation">
                    androidTestImplementation
                  </option>
                  <option value="kapt">kapt</option>
                  <option value="ksp">ksp</option>
                  <option value="api">api</option>
                  <option value="compileOnly">compileOnly</option>
                </select>
              </div>
            </div>
            <Button
              onClick={handleAddManual}
              disabled={
                !manualGroup.trim() ||
                !manualArtifact.trim() ||
                !manualVersion.trim()
              }
              className="w-full h-8 text-[12px]"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Dependency
            </Button>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="px-4 py-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search libraries (e.g. retrofit, room, compose)..."
                  className="w-full h-8 pl-7 pr-2 text-[12px] bg-muted/30 border border-border/30 rounded outline-none focus:border-primary/50"
                  autoFocus
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-auto px-2 pb-2">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-[11px] text-muted-foreground/50">
                  No libraries found matching "{search}"
                </div>
              ) : (
                <div className="space-y-1">
                  {filtered.map((entry) => {
                    const depKey = `${entry.group}:${entry.artifact}`;
                    const alreadyAdded = existingIds.has(depKey);
                    return (
                      <div
                        key={depKey}
                        className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/30 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <Library className="w-3 h-3 text-primary/60 shrink-0" />
                            <span className="text-[11px] font-mono truncate">
                              {entry.group}:{entry.artifact}
                            </span>
                            <span className="text-[10px] text-muted-foreground/50">
                              {entry.version}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground/40 ml-4.5 mt-0.5">
                            {entry.description}
                          </p>
                        </div>
                        {alreadyAdded ? (
                          <span className="text-[10px] text-green-400 flex items-center gap-0.5 shrink-0">
                            <Check className="w-3 h-3" />
                            Added
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddCatalogEntry(entry)}
                            className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100 shrink-0"
                          >
                            <Plus className="w-3 h-3 mr-0.5" />
                            Add
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function DependencyManager({
  dependencies,
  onAddDependency,
  onRemoveDependency,
  onUpdateDependency,
  onUpdateAll,
  onRefresh,
  hasProject,
}: DependencyManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filter, setFilter] = useState("");
  const [expandedScopes, setExpandedScopes] = useState<Set<string>>(
    new Set(["implementation"]),
  );

  const existingIds = useMemo(
    () => new Set(dependencies.map((d) => `${d.group}:${d.artifact}`)),
    [dependencies],
  );

  const updatableCount = useMemo(
    () => dependencies.filter((d) => d.hasUpdate).length,
    [dependencies],
  );

  const grouped = useMemo(() => {
    const groups: Record<DependencyScope, GradleDependency[]> = {
      implementation: [],
      testImplementation: [],
      androidTestImplementation: [],
      kapt: [],
      ksp: [],
      api: [],
      compileOnly: [],
    };
    const q = filter.toLowerCase();
    for (const dep of dependencies) {
      if (
        q &&
        !dep.group.toLowerCase().includes(q) &&
        !dep.artifact.toLowerCase().includes(q)
      ) {
        continue;
      }
      groups[dep.scope].push(dep);
    }
    return groups;
  }, [dependencies, filter]);

  const toggleScope = useCallback((scope: string) => {
    setExpandedScopes((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) {
        next.delete(scope);
      } else {
        next.add(scope);
      }
      return next;
    });
  }, []);

  const handleAdd = useCallback(
    (dep: Omit<GradleDependency, "id" | "hasUpdate">) => {
      onAddDependency(dep);
    },
    [onAddDependency],
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/30 shrink-0">
        <div className="flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-medium">Dependencies</span>
          <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
            {dependencies.length}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {updatableCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onUpdateAll}
              className="h-6 px-1.5 text-[10px] gap-1 text-blue-400 hover:text-blue-300"
              title="Update all dependencies"
            >
              <ArrowUpCircle className="w-3 h-3" />
              <span>{updatableCount}</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-6 w-6 p-0"
            title="Check for updates"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddDialog(true)}
            disabled={!hasProject}
            className="h-6 w-6 p-0 text-primary"
            title="Add dependency"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      {hasProject && dependencies.length > 0 && (
        <div className="px-3 py-1.5 border-b border-border/20">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter dependencies..."
              className="w-full h-6 pl-6 pr-2 text-[11px] bg-muted/20 border border-border/20 rounded outline-none focus:border-primary/40"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!hasProject ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Package className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-[11px] text-muted-foreground/50">
              Create a project to manage dependencies
            </p>
          </div>
        ) : dependencies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Library className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-[11px] text-muted-foreground/50">
              No dependencies yet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="mt-2 h-7 text-[11px]"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Dependency
            </Button>
          </div>
        ) : (
          <div>
            {(
              Object.entries(grouped) as [DependencyScope, GradleDependency[]][]
            ).map(([scope, deps]) => {
              if (deps.length === 0) return null;
              const isExpanded = expandedScopes.has(scope);
              return (
                <div key={scope} className="border-b border-border/20">
                  <button
                    type="button"
                    onClick={() => toggleScope(scope)}
                    className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-muted/20 text-[11px]"
                  >
                    <div className="flex items-center gap-1.5">
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${SCOPE_COLORS[scope]}`}
                      >
                        {scope}
                      </span>
                    </div>
                    <span className="text-[9px] text-muted-foreground/40">
                      {deps.length}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="pb-1">
                      {deps.map((dep) => (
                        <div
                          key={dep.id}
                          className="flex items-center justify-between px-3 py-1 mx-2 rounded hover:bg-muted/20 group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-mono truncate">
                                {dep.group}:{dep.artifact}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-muted-foreground/60">
                                v{dep.version}
                              </span>
                              {dep.hasUpdate && dep.latestVersion && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateDependency(
                                      dep.id,
                                      dep.latestVersion!,
                                    )
                                  }
                                  className="flex items-center gap-0.5 text-[9px] text-blue-400 hover:text-blue-300"
                                >
                                  <ArrowUpCircle className="w-2.5 h-2.5" />
                                  {dep.latestVersion}
                                </button>
                              )}
                              {dep.description && (
                                <span className="text-[9px] text-muted-foreground/30 truncate">
                                  {dep.description}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveDependency(dep.id)}
                            className="opacity-0 group-hover:opacity-100 ml-2"
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add dependency dialog */}
      {showAddDialog && (
        <AddDependencyDialog
          existingIds={existingIds}
          onAdd={(dep) => {
            handleAdd(dep);
          }}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </div>
  );
}
