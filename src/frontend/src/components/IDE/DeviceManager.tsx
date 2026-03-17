import { Button } from "@/components/ui/button";
import {
  Monitor,
  Phone,
  Play,
  Plus,
  Power,
  RefreshCw,
  RotateCcw,
  Settings,
  Smartphone,
  Square,
  Tablet,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import React, { useState } from "react";

// ── Device types ────────────────────────────────────────────────────────────
export type DeviceStatus = "online" | "offline" | "booting" | "unauthorized";
export type DeviceType = "emulator" | "physical";

export interface AndroidDevice {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  apiLevel: number;
  model: string;
  screenSize: string;
  isRunning: boolean;
}

export interface EmulatorTemplate {
  id: string;
  name: string;
  apiLevel: number;
  screenSize: string;
  abi: string;
  icon: "phone" | "tablet";
}

interface DeviceManagerProps {
  devices: AndroidDevice[];
  emulatorTemplates: EmulatorTemplate[];
  onStartDevice: (id: string) => void;
  onStopDevice: (id: string) => void;
  onDeleteDevice: (id: string) => void;
  onCreateEmulator: (template: EmulatorTemplate) => void;
  onRefresh: () => void;
  onInstallApk: (deviceId: string) => void;
}

// ── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: DeviceStatus }) {
  const config = {
    online: { color: "bg-green-400", label: "Online" },
    offline: { color: "bg-gray-500", label: "Offline" },
    booting: { color: "bg-yellow-400 animate-pulse", label: "Booting" },
    unauthorized: { color: "bg-red-400", label: "Unauthorized" },
  }[status];

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
      <span className="text-[9px] text-muted-foreground">{config.label}</span>
    </div>
  );
}

// ── Device card ─────────────────────────────────────────────────────────────
function DeviceCard({
  device,
  onStart,
  onStop,
  onDelete,
  onInstallApk,
}: {
  device: AndroidDevice;
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
  onInstallApk: () => void;
}) {
  const DeviceIcon = device.type === "emulator" ? Monitor : Smartphone;
  const isOnline = device.status === "online";

  return (
    <div className="flex items-center gap-3 px-3 py-2 hover:bg-muted/20 rounded-md transition-colors group">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isOnline
            ? "bg-green-400/10 text-green-400"
            : "bg-muted/30 text-muted-foreground/40"
        }`}
      >
        <DeviceIcon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-foreground/80 truncate">
            {device.name}
          </span>
          <StatusBadge status={device.status} />
        </div>
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground/50">
          <span>API {device.apiLevel}</span>
          <span>{device.model}</span>
          <span>{device.screenSize}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {device.isRunning ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onStop}
            className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
            title="Stop device"
          >
            <Square className="w-3 h-3" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onStart}
            className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
            title="Start device"
          >
            <Play className="w-3 h-3" />
          </Button>
        )}
        {isOnline && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onInstallApk}
            className="h-6 w-6 p-0"
            title="Install APK"
          >
            <Plus className="w-3 h-3" />
          </Button>
        )}
        {device.type === "emulator" && !device.isRunning && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-6 w-6 p-0 text-destructive/60 hover:text-destructive"
            title="Delete emulator"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Emulator template card ──────────────────────────────────────────────────
function TemplateCard({
  template,
  onCreate,
}: {
  template: EmulatorTemplate;
  onCreate: () => void;
}) {
  const Icon = template.icon === "tablet" ? Tablet : Phone;

  return (
    <button
      type="button"
      onClick={onCreate}
      className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted/20 rounded-md transition-colors text-left"
    >
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-medium text-foreground/70">
          {template.name}
        </div>
        <div className="text-[9px] text-muted-foreground/40">
          API {template.apiLevel} | {template.screenSize} | {template.abi}
        </div>
      </div>
      <Plus className="w-3 h-3 text-muted-foreground/30" />
    </button>
  );
}

export function DeviceManager({
  devices,
  emulatorTemplates,
  onStartDevice,
  onStopDevice,
  onDeleteDevice,
  onCreateEmulator,
  onRefresh,
  onInstallApk,
}: DeviceManagerProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  const onlineDevices = devices.filter((d) => d.status === "online");
  const offlineDevices = devices.filter((d) => d.status !== "online");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Smartphone className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">
            Devices
          </span>
          <span className="text-[9px] text-muted-foreground/50">
            {onlineDevices.length} connected
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
            className="h-5 px-1.5 text-[10px]"
          >
            <Plus className="w-3 h-3 mr-0.5" />
            AVD
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

      <div className="flex-1 overflow-y-auto">
        {/* Connected devices */}
        {onlineDevices.length > 0 && (
          <div className="p-1">
            <div className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-green-400/60 flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              Connected
            </div>
            {onlineDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onStart={() => onStartDevice(device.id)}
                onStop={() => onStopDevice(device.id)}
                onDelete={() => onDeleteDevice(device.id)}
                onInstallApk={() => onInstallApk(device.id)}
              />
            ))}
          </div>
        )}

        {/* Offline devices */}
        {offlineDevices.length > 0 && (
          <div className="p-1">
            <div className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/40 flex items-center gap-1">
              <WifiOff className="w-3 h-3" />
              Available
            </div>
            {offlineDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onStart={() => onStartDevice(device.id)}
                onStop={() => onStopDevice(device.id)}
                onDelete={() => onDeleteDevice(device.id)}
                onInstallApk={() => onInstallApk(device.id)}
              />
            ))}
          </div>
        )}

        {/* No devices */}
        {devices.length === 0 && !showTemplates && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Smartphone className="w-8 h-8 text-muted-foreground/20 mb-2" />
            <p className="text-[11px] text-muted-foreground/50">
              No devices found
            </p>
            <p className="text-[9px] text-muted-foreground/30 mt-1">
              Connect an Android device or create an emulator
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(true)}
              className="mt-3 h-7 text-[10px]"
            >
              <Plus className="w-3 h-3 mr-1" />
              Create Emulator
            </Button>
          </div>
        )}

        {/* Emulator templates */}
        {showTemplates && (
          <div className="p-1 border-t border-border/30">
            <div className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-primary/60 flex items-center gap-1">
              <Settings className="w-3 h-3" />
              Create New Emulator
            </div>
            {emulatorTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onCreate={() => {
                  onCreateEmulator(template);
                  setShowTemplates(false);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
