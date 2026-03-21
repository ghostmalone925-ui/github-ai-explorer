import { Button } from "@/components/ui/button";
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  Wifi,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ── Performance types ───────────────────────────────────────────────────────

export interface ResourceSnapshot {
  timestamp: number;
  cpu: number;
  memory: number;
  network: { rx: number; tx: number };
  fps: number;
  threads: number;
}

export interface StorageInfo {
  used: number;
  total: number;
  breakdown: { label: string; size: number; color: string }[];
}

interface PerformanceMonitorProps {
  snapshots: ResourceSnapshot[];
  storage: StorageInfo;
  isMonitoring: boolean;
  onToggleMonitoring: () => void;
  onClear: () => void;
  hasProject: boolean;
}

// ── Gauge component ─────────────────────────────────────────────────────────

function CircularGauge({
  value,
  max,
  label,
  unit,
  color,
  size,
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
  size?: number;
}) {
  const s = size ?? 72;
  const strokeWidth = 5;
  const radius = (s - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const offset = circumference * (1 - percentage);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: s, height: s }}>
        <svg width={s} height={s} className="-rotate-90">
          <circle
            cx={s / 2}
            cy={s / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          <circle
            cx={s / 2}
            cy={s / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[13px] font-mono font-bold leading-none">
            {typeof value === "number" && value % 1 !== 0
              ? value.toFixed(1)
              : value}
          </span>
          <span className="text-[8px] text-muted-foreground/60">{unit}</span>
        </div>
      </div>
      <span className="text-[9px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ── Mini sparkline chart ────────────────────────────────────────────────────

function Sparkline({
  data,
  color,
  height,
  maxValue,
}: {
  data: number[];
  color: string;
  height: number;
  maxValue: number;
}) {
  if (data.length < 2) return null;

  const width = 200;
  const points = data
    .slice(-60)
    .map((v, i, arr) => {
      const x = (i / (arr.length - 1)) * width;
      const y = height - (v / maxValue) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full"
    >
      <polygon points={areaPoints} fill={color} opacity="0.1" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Storage bar ─────────────────────────────────────────────────────────────

function StorageBar({ storage }: { storage: StorageInfo }) {
  const usedPercentage = (storage.used / storage.total) * 100;

  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <HardDrive className="w-3 h-3" />
          Storage
        </span>
        <span className="text-[10px] font-mono">
          {(storage.used / (1024 * 1024)).toFixed(0)} /{" "}
          {(storage.total / (1024 * 1024)).toFixed(0)} MB
        </span>
      </div>
      <div className="w-full h-3 bg-muted/30 rounded-full overflow-hidden flex">
        {storage.breakdown.map((item) => {
          const pct = (item.size / storage.total) * 100;
          return (
            <div
              key={item.label}
              style={{ width: `${pct}%`, background: item.color }}
              className="h-full first:rounded-l-full last:rounded-r-full"
              title={`${item.label}: ${(item.size / (1024 * 1024)).toFixed(1)} MB`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
        {storage.breakdown.map((item) => (
          <span
            key={item.label}
            className="flex items-center gap-1 text-[9px] text-muted-foreground/60"
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: item.color }}
            />
            {item.label} ({(item.size / (1024 * 1024)).toFixed(1)} MB)
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function PerformanceMonitor({
  snapshots,
  storage,
  isMonitoring,
  onToggleMonitoring,
  onClear,
  hasProject,
}: PerformanceMonitorProps) {
  const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const cpuData = useMemo(() => snapshots.map((s) => s.cpu), [snapshots]);
  const memData = useMemo(() => snapshots.map((s) => s.memory), [snapshots]);
  const fpsData = useMemo(() => snapshots.map((s) => s.fps), [snapshots]);
  const netData = useMemo(
    () => snapshots.map((s) => s.network.rx + s.network.tx),
    [snapshots],
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/30 shrink-0">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-medium">Performance</span>
          {isMonitoring && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMonitoring}
            disabled={!hasProject}
            className="h-6 w-6 p-0"
            title={isMonitoring ? "Pause monitoring" : "Start monitoring"}
          >
            {isMonitoring ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 w-6 p-0"
            title="Clear data"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {!hasProject ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <Activity className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-[11px] text-muted-foreground/50">
            Create a project and run it to monitor performance
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {/* Gauges */}
          <div className="flex items-center justify-around py-3 border-b border-border/20">
            <CircularGauge
              value={latest?.cpu ?? 0}
              max={100}
              label="CPU"
              unit="%"
              color={
                (latest?.cpu ?? 0) > 80
                  ? "#ef4444"
                  : (latest?.cpu ?? 0) > 50
                    ? "#eab308"
                    : "#22c55e"
              }
            />
            <CircularGauge
              value={latest?.memory ?? 0}
              max={512}
              label="Memory"
              unit="MB"
              color={
                (latest?.memory ?? 0) > 400
                  ? "#ef4444"
                  : (latest?.memory ?? 0) > 256
                    ? "#eab308"
                    : "#3b82f6"
              }
            />
            <CircularGauge
              value={latest?.fps ?? 0}
              max={60}
              label="FPS"
              unit="fps"
              color={
                (latest?.fps ?? 0) < 30
                  ? "#ef4444"
                  : (latest?.fps ?? 0) < 50
                    ? "#eab308"
                    : "#22c55e"
              }
            />
          </div>

          {/* Sparklines */}
          <div className="px-3 py-2 space-y-2 border-b border-border/20">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                  <Cpu className="w-2.5 h-2.5" />
                  CPU Usage
                </span>
                <span className="text-[9px] font-mono text-muted-foreground">
                  {latest?.cpu.toFixed(1) ?? "0"}%
                </span>
              </div>
              <Sparkline
                data={cpuData}
                color="#22c55e"
                height={28}
                maxValue={100}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                  <MemoryStick className="w-2.5 h-2.5" />
                  Memory
                </span>
                <span className="text-[9px] font-mono text-muted-foreground">
                  {latest?.memory.toFixed(0) ?? "0"} MB
                </span>
              </div>
              <Sparkline
                data={memData}
                color="#3b82f6"
                height={28}
                maxValue={512}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                  <Wifi className="w-2.5 h-2.5" />
                  Network I/O
                </span>
                <span className="text-[9px] font-mono text-muted-foreground">
                  {latest
                    ? `${(latest.network.rx / 1024).toFixed(1)}/${(latest.network.tx / 1024).toFixed(1)} KB/s`
                    : "0/0 KB/s"}
                </span>
              </div>
              <Sparkline
                data={netData}
                color="#a78bfa"
                height={28}
                maxValue={Math.max(...netData, 1024)}
              />
            </div>
          </div>

          {/* Runtime info */}
          <div className="px-3 py-2 border-b border-border/20">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-muted-foreground/50 block">Threads</span>
                <span className="font-mono">{latest?.threads ?? 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground/50 block">Samples</span>
                <span className="font-mono">{snapshots.length}</span>
              </div>
            </div>
          </div>

          {/* Storage */}
          <StorageBar storage={storage} />
        </div>
      )}
    </div>
  );
}
