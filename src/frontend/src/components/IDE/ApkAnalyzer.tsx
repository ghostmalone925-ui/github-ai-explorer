import { Button } from "@/components/ui/button";
import {
  Archive,
  ChevronDown,
  ChevronRight,
  Code2,
  FileText,
  HardDrive,
  Image,
  Info,
  Layers,
  Package,
  PieChart,
  RefreshCw,
  Shield,
} from "lucide-react";
import React, { useMemo, useState } from "react";

// ── APK analysis types ──────────────────────────────────────────────────────

export interface ApkSizeEntry {
  name: string;
  size: number;
  percentage: number;
  icon: "code" | "resource" | "native" | "asset" | "other";
  children?: ApkSizeEntry[];
}

export interface DexInfo {
  name: string;
  classCount: number;
  methodCount: number;
  fieldCount: number;
  size: number;
}

export interface ApkSigningInfo {
  version: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  algorithm: string;
}

export interface ApkAnalysis {
  totalSize: number;
  downloadSize: number;
  minSdk: number;
  targetSdk: number;
  versionCode: number;
  versionName: string;
  packageName: string;
  permissions: string[];
  sizeBreakdown: ApkSizeEntry[];
  dexFiles: DexInfo[];
  signingInfo: ApkSigningInfo | null;
  totalMethodCount: number;
  methodLimit: number;
}

interface ApkAnalyzerProps {
  analysis: ApkAnalysis | null;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  hasProject: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const ICON_MAP = {
  code: <Code2 className="w-3 h-3 text-blue-400" />,
  resource: <Image className="w-3 h-3 text-green-400" />,
  native: <HardDrive className="w-3 h-3 text-purple-400" />,
  asset: <FileText className="w-3 h-3 text-yellow-400" />,
  other: <Archive className="w-3 h-3 text-muted-foreground" />,
};

// ── Size bar component ──────────────────────────────────────────────────────

function SizeBar({
  percentage,
  color,
}: {
  percentage: number;
  color: string;
}) {
  return (
    <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.max(percentage, 1)}%`, background: color }}
      />
    </div>
  );
}

// ── Size breakdown tree ─────────────────────────────────────────────────────

function SizeEntryRow({
  entry,
  depth,
  totalSize,
}: {
  entry: ApkSizeEntry;
  depth: number;
  totalSize: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = entry.children && entry.children.length > 0;

  const barColors: Record<string, string> = {
    code: "#60a5fa",
    resource: "#4ade80",
    native: "#a78bfa",
    asset: "#facc15",
    other: "#94a3b8",
  };

  return (
    <>
      <div
        className="flex items-center gap-1.5 py-1 px-1 hover:bg-muted/20 rounded cursor-default group"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-3 h-3 flex items-center justify-center shrink-0"
          >
            {expanded ? (
              <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-2.5 h-2.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {ICON_MAP[entry.icon]}
        <span className="text-[11px] truncate flex-1">{entry.name}</span>
        <div className="w-16 shrink-0">
          <SizeBar
            percentage={entry.percentage}
            color={barColors[entry.icon] || "#94a3b8"}
          />
        </div>
        <span className="text-[10px] text-muted-foreground w-14 text-right shrink-0">
          {formatSize(entry.size)}
        </span>
        <span className="text-[9px] text-muted-foreground/50 w-10 text-right shrink-0">
          {entry.percentage.toFixed(1)}%
        </span>
      </div>
      {expanded &&
        hasChildren &&
        entry.children!.map((child) => (
          <SizeEntryRow
            key={child.name}
            entry={child}
            depth={depth + 1}
            totalSize={totalSize}
          />
        ))}
    </>
  );
}

// ── Method count gauge ──────────────────────────────────────────────────────

function MethodCountGauge({
  count,
  limit,
}: {
  count: number;
  limit: number;
}) {
  const percentage = Math.min((count / limit) * 100, 100);
  const isWarning = percentage > 80;
  const isDanger = percentage > 95;

  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground">Method Count</span>
        <span
          className={`text-[10px] font-mono ${
            isDanger
              ? "text-red-400"
              : isWarning
                ? "text-yellow-400"
                : "text-green-400"
          }`}
        >
          {count.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isDanger
              ? "bg-red-500"
              : isWarning
                ? "bg-yellow-500"
                : "bg-green-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isWarning && !isDanger && (
        <p className="text-[9px] text-yellow-400/70 mt-1">
          Approaching 64K method limit. Consider enabling multidex.
        </p>
      )}
      {isDanger && (
        <p className="text-[9px] text-red-400/70 mt-1">
          Near or exceeding 64K limit! Enable multidex in build.gradle.
        </p>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function ApkAnalyzer({
  analysis,
  onAnalyze,
  isAnalyzing,
  hasProject,
}: ApkAnalyzerProps) {
  const [activeTab, setActiveTab] = useState<
    "size" | "dex" | "permissions" | "signing"
  >("size");

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/30 shrink-0">
        <div className="flex items-center gap-1.5">
          <PieChart className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-medium">APK Analyzer</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAnalyze}
          disabled={!hasProject || isAnalyzing}
          className="h-6 px-2 text-[10px] gap-1"
        >
          <RefreshCw
            className={`w-3 h-3 ${isAnalyzing ? "animate-spin" : ""}`}
          />
          {isAnalyzing ? "Analyzing..." : "Analyze"}
        </Button>
      </div>

      {!hasProject ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <PieChart className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-[11px] text-muted-foreground/50">
            Build a project to analyze the APK
          </p>
        </div>
      ) : !analysis ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <Archive className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-[11px] text-muted-foreground/50">
            Click Analyze after building to inspect the APK
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="mt-3 h-7 text-[11px]"
          >
            <PieChart className="w-3 h-3 mr-1" />
            Analyze APK
          </Button>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-2 gap-2 px-3 py-2 border-b border-border/30 bg-muted/10">
            <div>
              <span className="text-[9px] text-muted-foreground/50 block">
                APK Size
              </span>
              <span className="text-[12px] font-mono font-medium">
                {formatSize(analysis.totalSize)}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-muted-foreground/50 block">
                Download Size
              </span>
              <span className="text-[12px] font-mono font-medium">
                {formatSize(analysis.downloadSize)}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-muted-foreground/50 block">
                Package
              </span>
              <span className="text-[10px] font-mono truncate block">
                {analysis.packageName}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-muted-foreground/50 block">
                Version
              </span>
              <span className="text-[10px] font-mono">
                {analysis.versionName} ({analysis.versionCode})
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-border/30 shrink-0">
            {(
              [
                { key: "size", label: "Size", icon: PieChart },
                { key: "dex", label: "DEX", icon: Code2 },
                { key: "permissions", label: "Permissions", icon: Shield },
                { key: "signing", label: "Signing", icon: Info },
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1 px-3 py-1.5 text-[10px] border-b-2 transition-colors ${
                  activeTab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto">
            {/* Size breakdown */}
            {activeTab === "size" && (
              <div>
                <MethodCountGauge
                  count={analysis.totalMethodCount}
                  limit={analysis.methodLimit}
                />
                <div className="border-t border-border/20">
                  {analysis.sizeBreakdown.map((entry) => (
                    <SizeEntryRow
                      key={entry.name}
                      entry={entry}
                      depth={0}
                      totalSize={analysis.totalSize}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* DEX files */}
            {activeTab === "dex" && (
              <div className="p-2 space-y-1">
                {analysis.dexFiles.map((dex) => (
                  <div
                    key={dex.name}
                    className="border border-border/20 rounded p-2 bg-muted/10"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-mono font-medium flex items-center gap-1">
                        <Layers className="w-3 h-3 text-blue-400" />
                        {dex.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatSize(dex.size)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <span className="text-muted-foreground/50 block">
                          Classes
                        </span>
                        <span className="font-mono">
                          {dex.classCount.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground/50 block">
                          Methods
                        </span>
                        <span className="font-mono">
                          {dex.methodCount.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground/50 block">
                          Fields
                        </span>
                        <span className="font-mono">
                          {dex.fieldCount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Permissions */}
            {activeTab === "permissions" && (
              <div className="p-2 space-y-0.5">
                {analysis.permissions.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/50 text-center py-4">
                    No permissions declared
                  </p>
                ) : (
                  analysis.permissions.map((perm) => {
                    const isDangerous =
                      perm.includes("CAMERA") ||
                      perm.includes("LOCATION") ||
                      perm.includes("CONTACTS") ||
                      perm.includes("STORAGE") ||
                      perm.includes("MICROPHONE") ||
                      perm.includes("PHONE") ||
                      perm.includes("SMS");
                    return (
                      <div
                        key={perm}
                        className="flex items-center gap-1.5 py-1 px-2 rounded hover:bg-muted/20"
                      >
                        <Shield
                          className={`w-3 h-3 shrink-0 ${
                            isDangerous
                              ? "text-orange-400"
                              : "text-muted-foreground/50"
                          }`}
                        />
                        <span className="text-[10px] font-mono truncate">
                          {perm}
                        </span>
                        {isDangerous && (
                          <span className="text-[8px] bg-orange-400/20 text-orange-400 px-1 py-0.5 rounded shrink-0">
                            dangerous
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Signing info */}
            {activeTab === "signing" && (
              <div className="p-3">
                {analysis.signingInfo ? (
                  <div className="space-y-2">
                    {(
                      [
                        ["Scheme", analysis.signingInfo.version],
                        ["Issuer", analysis.signingInfo.issuer],
                        ["Algorithm", analysis.signingInfo.algorithm],
                        ["Valid From", analysis.signingInfo.validFrom],
                        ["Valid To", analysis.signingInfo.validTo],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label}>
                        <span className="text-[9px] text-muted-foreground/50 block">
                          {label}
                        </span>
                        <span className="text-[11px] font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground/50 text-center py-4">
                    Build a release APK to see signing information
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
