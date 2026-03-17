import { Button } from "@/components/ui/button";
import {
  Check,
  ChevronRight,
  Code,
  FolderPlus,
  Layers,
  Package,
  Smartphone,
  X,
} from "lucide-react";
import React, { useCallback, useState } from "react";

// ── Project templates ───────────────────────────────────────────────────────
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: "empty" | "compose" | "views" | "multimodule";
  language: "kotlin" | "java";
  features: string[];
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "empty-compose",
    name: "Empty Compose Activity",
    description:
      "A blank project with a single Compose activity and Material 3 theme",
    icon: "compose",
    language: "kotlin",
    features: ["Jetpack Compose", "Material 3", "Navigation", "Kotlin DSL"],
  },
  {
    id: "empty-views",
    name: "Empty Views Activity",
    description:
      "A blank project with a single Activity using XML layouts and ViewBinding",
    icon: "views",
    language: "kotlin",
    features: ["XML Layouts", "ViewBinding", "AppCompat", "Material Design"],
  },
  {
    id: "mvvm-compose",
    name: "MVVM + Compose",
    description:
      "Full-featured project with MVVM architecture, Hilt DI, Room, and Retrofit",
    icon: "compose",
    language: "kotlin",
    features: [
      "Jetpack Compose",
      "Hilt",
      "Room",
      "Retrofit",
      "ViewModel",
      "Coroutines",
    ],
  },
  {
    id: "multimodule",
    name: "Multi-Module Project",
    description:
      "Scalable multi-module setup with app, core, data, and feature modules",
    icon: "multimodule",
    language: "kotlin",
    features: [
      "Multi-module",
      "Convention Plugins",
      "Hilt",
      "Compose",
      "Modularization",
    ],
  },
  {
    id: "empty-java",
    name: "Empty Java Activity",
    description: "Basic Android project using Java with XML layouts",
    icon: "empty",
    language: "java",
    features: ["Java", "XML Layouts", "AppCompat", "Gradle Groovy"],
  },
];

// ── Template icon ───────────────────────────────────────────────────────────
function TemplateIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "compose":
      return (
        <div className="w-10 h-10 rounded-lg bg-green-400/10 flex items-center justify-center">
          <Code className="w-5 h-5 text-green-400" />
        </div>
      );
    case "views":
      return (
        <div className="w-10 h-10 rounded-lg bg-blue-400/10 flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-blue-400" />
        </div>
      );
    case "multimodule":
      return (
        <div className="w-10 h-10 rounded-lg bg-purple-400/10 flex items-center justify-center">
          <Layers className="w-5 h-5 text-purple-400" />
        </div>
      );
    default:
      return (
        <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center">
          <Package className="w-5 h-5 text-muted-foreground" />
        </div>
      );
  }
}

// ── New project form ────────────────────────────────────────────────────────
interface NewProjectFormProps {
  template: ProjectTemplate;
  onBack: () => void;
  onCreate: (config: ProjectConfig) => void;
}

export interface ProjectConfig {
  templateId: string;
  name: string;
  packageName: string;
  minSdk: number;
  targetSdk: number;
  language: "kotlin" | "java";
  useCompose: boolean;
}

function NewProjectForm({ template, onBack, onCreate }: NewProjectFormProps) {
  const [name, setName] = useState("MyApplication");
  const [packageName, setPackageName] = useState("com.example.myapplication");
  const [minSdk, setMinSdk] = useState(24);
  const [targetSdk, setTargetSdk] = useState(35);

  const isValid = name.trim().length > 0 && packageName.trim().length > 0;

  const handleCreate = useCallback(() => {
    if (!isValid) return;
    onCreate({
      templateId: template.id,
      name: name.trim(),
      packageName: packageName.trim(),
      minSdk,
      targetSdk,
      language: template.language,
      useCompose: template.id.includes("compose"),
    });
  }, [isValid, template, name, packageName, minSdk, targetSdk, onCreate]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
        <TemplateIcon icon={template.icon} />
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {template.name}
          </h3>
          <p className="text-[10px] text-muted-foreground">
            {template.description}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Project name */}
        <div className="space-y-1.5">
          <label
            htmlFor="project-name"
            className="text-[11px] font-medium text-foreground/80"
          >
            Project Name
          </label>
          <input
            id="project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-background/50 border border-border/50 rounded-md px-3 py-2 text-sm font-mono outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Package name */}
        <div className="space-y-1.5">
          <label
            htmlFor="package-name"
            className="text-[11px] font-medium text-foreground/80"
          >
            Package Name
          </label>
          <input
            id="package-name"
            type="text"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            className="w-full bg-background/50 border border-border/50 rounded-md px-3 py-2 text-sm font-mono outline-none focus:border-primary/50 transition-colors"
          />
          <p className="text-[9px] text-muted-foreground/50">
            e.g., com.yourcompany.appname
          </p>
        </div>

        {/* SDK versions */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="min-sdk"
              className="text-[11px] font-medium text-foreground/80"
            >
              Min SDK
            </label>
            <select
              id="min-sdk"
              value={minSdk}
              onChange={(e) => setMinSdk(Number(e.target.value))}
              className="w-full bg-background/50 border border-border/50 rounded-md px-3 py-2 text-sm font-mono outline-none focus:border-primary/50"
            >
              <option value={21}>API 21 (Lollipop)</option>
              <option value={23}>API 23 (Marshmallow)</option>
              <option value={24}>API 24 (Nougat)</option>
              <option value={26}>API 26 (Oreo)</option>
              <option value={28}>API 28 (Pie)</option>
              <option value={29}>API 29 (Android 10)</option>
              <option value={30}>API 30 (Android 11)</option>
              <option value={31}>API 31 (Android 12)</option>
              <option value={33}>API 33 (Android 13)</option>
              <option value={34}>API 34 (Android 14)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="target-sdk"
              className="text-[11px] font-medium text-foreground/80"
            >
              Target SDK
            </label>
            <select
              id="target-sdk"
              value={targetSdk}
              onChange={(e) => setTargetSdk(Number(e.target.value))}
              className="w-full bg-background/50 border border-border/50 rounded-md px-3 py-2 text-sm font-mono outline-none focus:border-primary/50"
            >
              <option value={33}>API 33 (Android 13)</option>
              <option value={34}>API 34 (Android 14)</option>
              <option value={35}>API 35 (Android 15)</option>
            </select>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-1.5">
          {/* biome-ignore lint/a11y/noLabelWithoutControl: display-only label */}
          <label className="text-[11px] font-medium text-foreground/80">
            Included Features
          </label>
          <div className="flex flex-wrap gap-1.5">
            {template.features.map((feature) => (
              <span
                key={feature}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-medium"
              >
                <Check className="w-2.5 h-2.5" />
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="space-y-1.5">
          {/* biome-ignore lint/a11y/noLabelWithoutControl: display-only label */}
          <label className="text-[11px] font-medium text-foreground/80">
            Language
          </label>
          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <Code className="w-4 h-4 text-primary" />
            {template.language === "kotlin" ? "Kotlin" : "Java"}
          </div>
        </div>
      </div>

      {/* Create button */}
      <div className="px-4 py-3 border-t border-border/30">
        <Button
          onClick={handleCreate}
          disabled={!isValid}
          className="w-full gap-2"
        >
          <FolderPlus className="w-4 h-4" />
          Create Project
        </Button>
      </div>
    </div>
  );
}

// ── Main ProjectManager ─────────────────────────────────────────────────────
interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (config: ProjectConfig) => void;
}

export function ProjectManager({
  isOpen,
  onClose,
  onCreateProject,
}: ProjectManagerProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<ProjectTemplate | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[80vh] bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {selectedTemplate ? (
          <NewProjectForm
            template={selectedTemplate}
            onBack={() => setSelectedTemplate(null)}
            onCreate={(config) => {
              onCreateProject(config);
              onClose();
            }}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  New Android Project
                </h2>
                <p className="text-[10px] text-muted-foreground">
                  Choose a project template to get started
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Templates */}
            <div className="flex-1 overflow-y-auto p-2">
              {PROJECT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template)}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/20 transition-colors text-left"
                >
                  <TemplateIcon icon={template.icon} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-foreground/80">
                        {template.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                        {template.language === "kotlin" ? "Kotlin" : "Java"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {template.features.slice(0, 4).map((f) => (
                        <span
                          key={f}
                          className="text-[8px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/60"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
