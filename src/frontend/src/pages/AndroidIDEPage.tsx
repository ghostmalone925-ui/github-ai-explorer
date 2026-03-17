import { Button } from "@/components/ui/button";
import {
  Bug,
  Code,
  FolderPlus,
  Hammer,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Smartphone,
  Terminal,
} from "lucide-react";
import React, { useState } from "react";

import { BuildPanel } from "../components/IDE/BuildPanel";
import { CodeEditor } from "../components/IDE/CodeEditor";
import { DeviceManager } from "../components/IDE/DeviceManager";
import { FileExplorer } from "../components/IDE/FileExplorer";
import { IDETerminal } from "../components/IDE/IDETerminal";
import { LogcatViewer } from "../components/IDE/LogcatViewer";
import {
  type ProjectConfig,
  ProjectManager,
} from "../components/IDE/ProjectManager";

import { useAndroidProject } from "../hooks/useAndroidProject";

type RightPanel = "build" | "logcat" | "devices" | null;

export default function AndroidIDEPage() {
  const project = useAndroidProject();

  const [showProjectManager, setShowProjectManager] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [showTerminal, setShowTerminal] = useState(true);
  const [terminalExpanded, setTerminalExpanded] = useState(false);

  const toggleRightPanel = (panel: RightPanel) => {
    setRightPanel((prev) => (prev === panel ? null : panel));
  };

  const handleCreateProject = (config: ProjectConfig) => {
    project.createProject(config);
    setShowProjectManager(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-border/50 bg-muted/20 shrink-0">
        <div className="flex items-center gap-1">
          {/* File explorer toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFileExplorer(!showFileExplorer)}
            className="h-7 px-2 text-[11px] gap-1.5"
          >
            {showFileExplorer ? (
              <PanelLeftClose className="w-3.5 h-3.5" />
            ) : (
              <PanelLeftOpen className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Explorer</span>
          </Button>

          <div className="w-px h-4 bg-border/50 mx-1" />

          {/* New project */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProjectManager(true)}
            className="h-7 px-2 text-[11px] gap-1.5"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Project</span>
          </Button>

          {/* Project name */}
          {project.hasProject && (
            <div className="flex items-center gap-1.5 ml-2 text-[11px] text-muted-foreground">
              <Smartphone className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium text-foreground/80">
                {project.projectConfig?.name}
              </span>
              <span className="text-muted-foreground/50">|</span>
              <span className="text-muted-foreground/50">
                {project.projectConfig?.language === "kotlin"
                  ? "Kotlin"
                  : "Java"}
              </span>
              <span className="text-muted-foreground/50">|</span>
              <span className="text-muted-foreground/50">
                API {project.projectConfig?.minSdk}+
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Quick actions */}
          {project.hasProject && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  project.runBuildTask({
                    id: "assemble-debug",
                    name: "Build Debug",
                    command: "./gradlew assembleDebug",
                    description: "Build debug APK",
                  })
                }
                disabled={project.buildStatus === "running"}
                className="h-7 px-2 text-[11px] gap-1.5 text-green-400 hover:text-green-300"
              >
                <Play className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Run</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  project.runBuildTask({
                    id: "assemble-debug",
                    name: "Build Debug",
                    command: "./gradlew assembleDebug",
                    description: "Build debug APK",
                  })
                }
                disabled={project.buildStatus === "running"}
                className="h-7 px-2 text-[11px] gap-1.5"
              >
                <Hammer className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Build</span>
              </Button>

              <div className="w-px h-4 bg-border/50 mx-1" />
            </>
          )}

          {/* Right panel toggles */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleRightPanel("build")}
            className={`h-7 px-2 text-[11px] gap-1.5 ${rightPanel === "build" ? "bg-muted text-primary" : ""}`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Build</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleRightPanel("logcat")}
            className={`h-7 px-2 text-[11px] gap-1.5 ${rightPanel === "logcat" ? "bg-muted text-primary" : ""}`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Logcat</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleRightPanel("devices")}
            className={`h-7 px-2 text-[11px] gap-1.5 ${rightPanel === "devices" ? "bg-muted text-primary" : ""}`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Devices</span>
          </Button>

          <div className="w-px h-4 bg-border/50 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTerminal(!showTerminal)}
            className={`h-7 px-2 text-[11px] gap-1.5 ${showTerminal ? "bg-muted text-primary" : ""}`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Terminal</span>
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: File explorer */}
        {showFileExplorer && (
          <div className="w-56 lg:w-64 shrink-0 overflow-hidden">
            <FileExplorer
              files={project.projectFiles}
              onFileSelect={project.openFile}
              onCreateFile={project.createFile}
              onCreateFolder={project.createFolder}
              onDeleteFile={project.deleteFile}
              onRefresh={project.refreshFiles}
              selectedFilePath={project.activeTabId}
              projectName={project.projectConfig?.name ?? ""}
            />
          </div>
        )}

        {/* Center: Code editor + terminal */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Editor */}
          <div className="flex-1 min-h-0 overflow-hidden flex">
            <CodeEditor
              tabs={project.editorTabs}
              activeTabId={project.activeTabId}
              onTabSelect={project.setActiveTabId}
              onTabClose={project.closeTab}
              onContentChange={project.updateContent}
              onSave={project.saveFile}
            />
          </div>

          {/* Terminal */}
          {showTerminal && (
            <IDETerminal
              tabs={project.terminalTabs}
              activeTabId={project.activeTerminalId}
              onAddTab={project.addTerminalTab}
              onCloseTab={project.closeTerminalTab}
              onSelectTab={project.setActiveTerminalId}
              onExecuteCommand={project.executeTerminalCommand}
              onClear={project.clearTerminal}
              isExpanded={terminalExpanded}
              onToggleExpand={() => setTerminalExpanded(!terminalExpanded)}
            />
          )}
        </div>

        {/* Right panel */}
        {rightPanel && (
          <div className="w-72 lg:w-80 shrink-0 border-l border-border/50 overflow-hidden">
            {rightPanel === "build" && (
              <BuildPanel
                buildStatus={project.buildStatus}
                buildOutput={project.buildOutput}
                onRunTask={project.runBuildTask}
                onStopBuild={project.stopBuild}
                onClearOutput={project.clearBuildOutput}
                projectType={project.projectConfig?.language ?? "kotlin"}
                hasProject={project.hasProject}
              />
            )}
            {rightPanel === "logcat" && (
              <LogcatViewer
                logs={project.logs}
                isStreaming={project.isLogStreaming}
                onToggleStream={project.toggleLogStreaming}
                onClear={project.clearLogs}
              />
            )}
            {rightPanel === "devices" && (
              <DeviceManager
                devices={project.devices}
                emulatorTemplates={project.emulatorTemplates}
                onStartDevice={project.startDevice}
                onStopDevice={project.stopDevice}
                onDeleteDevice={project.deleteDevice}
                onCreateEmulator={project.createEmulator}
                onRefresh={project.refreshDevices}
                onInstallApk={project.installApk}
              />
            )}
          </div>
        )}
      </div>

      {/* Project Manager Modal */}
      <ProjectManager
        isOpen={showProjectManager}
        onClose={() => setShowProjectManager(false)}
        onCreateProject={handleCreateProject}
      />

      {/* Welcome screen when no project */}
      {!project.hasProject && project.editorTabs.length === 0 && (
        <div className="absolute inset-0 top-[calc(64px+36px)] flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-6 pointer-events-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Code className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                Android Mobile IDE
              </h2>
              <p className="text-sm text-muted-foreground max-w-md">
                A full-featured development environment for building Android
                applications with Kotlin and Java
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Button
                onClick={() => setShowProjectManager(true)}
                className="gap-2"
                size="lg"
              >
                <FolderPlus className="w-4 h-4" />
                Create New Project
              </Button>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground/50">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  Compose & Views
                </span>
                <span className="flex items-center gap-1">
                  <Hammer className="w-3 h-3" />
                  Gradle Build
                </span>
                <span className="flex items-center gap-1">
                  <Terminal className="w-3 h-3" />
                  Integrated Terminal
                </span>
                <span className="flex items-center gap-1">
                  <Bug className="w-3 h-3" />
                  Logcat
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
