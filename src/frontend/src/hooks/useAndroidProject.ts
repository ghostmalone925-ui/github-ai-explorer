import { useCallback, useState } from "react";
import type {
  BuildOutput,
  BuildStatus,
  BuildTask,
} from "../components/IDE/BuildPanel";
import type { EditorTab } from "../components/IDE/CodeEditor";
import { detectLanguage } from "../components/IDE/CodeEditor";
import type {
  AndroidDevice,
  EmulatorTemplate,
} from "../components/IDE/DeviceManager";
import type { ProjectFile } from "../components/IDE/FileExplorer";
import type { TerminalLine, TerminalTab } from "../components/IDE/IDETerminal";
import type { LogEntry, LogLevel } from "../components/IDE/LogcatViewer";
import type { ProjectConfig } from "../components/IDE/ProjectManager";

// ── Android project template generators ─────────────────────────────────────

function generateMainActivityKt(
  packageName: string,
  useCompose: boolean,
): string {
  if (useCompose) {
    return `package ${packageName}

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import ${packageName}.ui.theme.AppTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AppTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    Greeting(
                        name = "Android",
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(
        text = "Hello $name!",
        modifier = modifier
    )
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    AppTheme {
        Greeting("Android")
    }
}
`;
  }
  return `package ${packageName}

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import ${packageName}.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
    }
}
`;
}

function generateBuildGradleApp(config: ProjectConfig): string {
  const composeBlock = config.useCompose
    ? `
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.10"
    }`
    : `
    buildFeatures {
        viewBinding = true
    }`;

  return `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")${config.useCompose ? '\n    id("org.jetbrains.kotlin.plugin.compose")' : ""}
}

android {
    namespace = "${config.packageName}"
    compileSdk = ${config.targetSdk}

    defaultConfig {
        applicationId = "${config.packageName}"
        minSdk = ${config.minSdk}
        targetSdk = ${config.targetSdk}
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }${composeBlock}
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")${
      config.useCompose
        ? `
    implementation("androidx.activity:activity-compose:1.9.1")
    implementation(platform("androidx.compose:compose-bom:2024.08.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")`
        : `
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")`
    }
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}
`;
}

function generateAndroidManifest(_packageName: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.App"
        tools:targetApi="35">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.App">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`;
}

function generateSettingsGradle(name: string): string {
  return `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolution {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "${name}"
include(":app")
`;
}

function generateBuildGradleRoot(): string {
  return `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.5.1" apply false
    id("org.jetbrains.kotlin.android") version "2.0.0" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.0" apply false
}
`;
}

function generateStringsXml(name: string): string {
  return `<resources>
    <string name="app_name">${name}</string>
</resources>
`;
}

function generateActivityMainXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Hello World!"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
`;
}

function generateGradleProperties(): string {
  return `# Project-wide Gradle settings.
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`;
}

function generateProguardRules(): string {
  return `# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Uncomment this to preserve the line number information for debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to hide the original source file name.
#-renameSourceFileAttribute SourceFile
`;
}

// ── Build project file tree from config ─────────────────────────────────────

function buildProjectFiles(config: ProjectConfig): ProjectFile[] {
  const pkgPath = config.packageName.replace(/\./g, "/");

  const mainKotlinFiles: ProjectFile[] = [
    {
      name: "MainActivity.kt",
      path: `app/src/main/java/${pkgPath}/MainActivity.kt`,
      type: "file",
    },
  ];

  const resFiles: ProjectFile[] = config.useCompose
    ? [
        {
          name: "values",
          path: "app/src/main/res/values",
          type: "directory",
          children: [
            {
              name: "strings.xml",
              path: "app/src/main/res/values/strings.xml",
              type: "file",
            },
          ],
        },
      ]
    : [
        {
          name: "layout",
          path: "app/src/main/res/layout",
          type: "directory",
          children: [
            {
              name: "activity_main.xml",
              path: "app/src/main/res/layout/activity_main.xml",
              type: "file",
            },
          ],
        },
        {
          name: "values",
          path: "app/src/main/res/values",
          type: "directory",
          children: [
            {
              name: "strings.xml",
              path: "app/src/main/res/values/strings.xml",
              type: "file",
            },
          ],
        },
      ];

  return [
    {
      name: config.name,
      path: "/",
      type: "directory",
      children: [
        {
          name: "app",
          path: "app",
          type: "directory",
          children: [
            {
              name: "src",
              path: "app/src",
              type: "directory",
              children: [
                {
                  name: "main",
                  path: "app/src/main",
                  type: "directory",
                  children: [
                    {
                      name: "java",
                      path: "app/src/main/java",
                      type: "directory",
                      children: [
                        {
                          name: config.packageName.split(".")[0],
                          path: `app/src/main/java/${config.packageName.split(".")[0]}`,
                          type: "directory",
                          children: [
                            {
                              name:
                                config.packageName.split(".")[1] ?? "example",
                              path: `app/src/main/java/${config.packageName.split(".").slice(0, 2).join("/")}`,
                              type: "directory",
                              children: [
                                {
                                  name:
                                    config.packageName.split(".")[2] ?? "app",
                                  path: `app/src/main/java/${pkgPath}`,
                                  type: "directory",
                                  children: mainKotlinFiles,
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      name: "res",
                      path: "app/src/main/res",
                      type: "directory",
                      children: resFiles,
                    },
                    {
                      name: "AndroidManifest.xml",
                      path: "app/src/main/AndroidManifest.xml",
                      type: "file",
                    },
                  ],
                },
                {
                  name: "test",
                  path: "app/src/test",
                  type: "directory",
                  children: [],
                },
                {
                  name: "androidTest",
                  path: "app/src/androidTest",
                  type: "directory",
                  children: [],
                },
              ],
            },
            {
              name: "build.gradle.kts",
              path: "app/build.gradle.kts",
              type: "file",
            },
            {
              name: "proguard-rules.pro",
              path: "app/proguard-rules.pro",
              type: "file",
            },
          ],
        },
        {
          name: "build.gradle.kts",
          path: "build.gradle.kts",
          type: "file",
        },
        {
          name: "settings.gradle.kts",
          path: "settings.gradle.kts",
          type: "file",
        },
        {
          name: "gradle.properties",
          path: "gradle.properties",
          type: "file",
        },
      ],
    },
  ];
}

// ── File content map ────────────────────────────────────────────────────────

function buildFileContents(config: ProjectConfig): Record<string, string> {
  const pkgPath = config.packageName.replace(/\./g, "/");
  const contents: Record<string, string> = {
    [`app/src/main/java/${pkgPath}/MainActivity.kt`]: generateMainActivityKt(
      config.packageName,
      config.useCompose,
    ),
    "app/build.gradle.kts": generateBuildGradleApp(config),
    "app/src/main/AndroidManifest.xml": generateAndroidManifest(
      config.packageName,
    ),
    "build.gradle.kts": generateBuildGradleRoot(),
    "settings.gradle.kts": generateSettingsGradle(config.name),
    "gradle.properties": generateGradleProperties(),
    "app/proguard-rules.pro": generateProguardRules(),
    "app/src/main/res/values/strings.xml": generateStringsXml(config.name),
  };

  if (!config.useCompose) {
    contents["app/src/main/res/layout/activity_main.xml"] =
      generateActivityMainXml();
  }

  return contents;
}

// ── Default emulator templates ──────────────────────────────────────────────

const DEFAULT_EMULATOR_TEMPLATES: EmulatorTemplate[] = [
  {
    id: "pixel-8",
    name: "Pixel 8",
    apiLevel: 34,
    screenSize: "6.2 inch",
    abi: "x86_64",
    icon: "phone",
  },
  {
    id: "pixel-7a",
    name: "Pixel 7a",
    apiLevel: 33,
    screenSize: "6.1 inch",
    abi: "x86_64",
    icon: "phone",
  },
  {
    id: "pixel-tablet",
    name: "Pixel Tablet",
    apiLevel: 34,
    screenSize: "10.95 inch",
    abi: "x86_64",
    icon: "tablet",
  },
  {
    id: "medium-phone",
    name: "Medium Phone",
    apiLevel: 35,
    screenSize: "6.4 inch",
    abi: "x86_64",
    icon: "phone",
  },
  {
    id: "small-phone",
    name: "Small Phone",
    apiLevel: 30,
    screenSize: "5.4 inch",
    abi: "x86_64",
    icon: "phone",
  },
];

// ── Demo logcat entries ─────────────────────────────────────────────────────

function generateDemoLogs(): LogEntry[] {
  const tags = [
    "ActivityManager",
    "WindowManager",
    "System.out",
    "GC",
    "ViewRootImpl",
    "InputMethodManager",
    "Choreographer",
    "MainActivity",
    "AppCompatDelegate",
    "Resources",
  ];
  const levels: LogLevel[] = ["V", "D", "I", "W", "E"];
  const messages = [
    "Activity resumed",
    "Window focus changed",
    "Skipped 2 frames! The application may be doing too much work on its main thread.",
    "GC freed 2415 objects",
    "Surface created",
    "Input connection established",
    "Layout pass completed",
    "onCreate called",
    "Theme applied successfully",
    "Configuration changed: density=440",
  ];

  return Array.from({ length: 50 }, (_, i) => ({
    id: `log-${i}`,
    timestamp: `12:${String(Math.floor(i / 60)).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}.${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`,
    pid: String(1000 + Math.floor(Math.random() * 9000)),
    tid: String(1000 + Math.floor(Math.random() * 9000)),
    level: levels[Math.floor(Math.random() * levels.length)],
    tag: tags[Math.floor(Math.random() * tags.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
  }));
}

// ── Main hook ───────────────────────────────────────────────────────────────

export function useAndroidProject() {
  // Project state
  const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(
    null,
  );
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});

  // Editor state
  const [editorTabs, setEditorTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Build state
  const [buildStatus, setBuildStatus] = useState<BuildStatus>("idle");
  const [buildOutput, setBuildOutput] = useState<BuildOutput[]>([]);

  // Logcat state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLogStreaming, setIsLogStreaming] = useState(false);

  // Device state
  const [devices, setDevices] = useState<AndroidDevice[]>([]);

  // Terminal state
  const [terminalTabs, setTerminalTabs] = useState<TerminalTab[]>([
    {
      id: "term-1",
      name: "Terminal 1",
      lines: [
        {
          id: "sys-0",
          text: "Android IDE Terminal - Ready",
          type: "system",
        },
      ],
      workingDirectory: "~/AndroidProjects",
      isRunning: false,
    },
  ]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(
    "term-1",
  );

  // ── Project creation ────────────────────────────────────────────────────
  const createProject = useCallback((config: ProjectConfig) => {
    const files = buildProjectFiles(config);
    const contents = buildFileContents(config);
    setProjectConfig(config);
    setProjectFiles(files);
    setFileContents(contents);
    setEditorTabs([]);
    setActiveTabId(null);
    setBuildOutput([]);
    setBuildStatus("idle");

    // Open the main activity file automatically
    const pkgPath = config.packageName.replace(/\./g, "/");
    const mainFile = `app/src/main/java/${pkgPath}/MainActivity.kt`;
    if (contents[mainFile]) {
      const tab: EditorTab = {
        id: mainFile,
        filename: "MainActivity.kt",
        filepath: mainFile,
        content: contents[mainFile],
        language: detectLanguage("MainActivity.kt"),
        isDirty: false,
      };
      setEditorTabs([tab]);
      setActiveTabId(tab.id);
    }
  }, []);

  // ── File operations ─────────────────────────────────────────────────────
  const openFile = useCallback(
    (file: ProjectFile) => {
      if (file.type === "directory") return;

      // Check if already open
      const existing = editorTabs.find((t) => t.id === file.path);
      if (existing) {
        setActiveTabId(existing.id);
        return;
      }

      const content = fileContents[file.path] ?? "";
      const tab: EditorTab = {
        id: file.path,
        filename: file.name,
        filepath: file.path,
        content,
        language: detectLanguage(file.name),
        isDirty: false,
      };
      setEditorTabs((prev) => [...prev, tab]);
      setActiveTabId(tab.id);
    },
    [editorTabs, fileContents],
  );

  const closeTab = useCallback(
    (id: string) => {
      setEditorTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        const next = prev.filter((t) => t.id !== id);
        if (id === activeTabId && next.length > 0) {
          const newIdx = Math.min(idx, next.length - 1);
          setActiveTabId(next[newIdx].id);
        } else if (next.length === 0) {
          setActiveTabId(null);
        }
        return next;
      });
    },
    [activeTabId],
  );

  const updateContent = useCallback((id: string, content: string) => {
    setEditorTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, content, isDirty: true } : t)),
    );
  }, []);

  const saveFile = useCallback(
    (id: string) => {
      const tab = editorTabs.find((t) => t.id === id);
      if (!tab) return;
      setFileContents((prev) => ({ ...prev, [tab.filepath]: tab.content }));
      setEditorTabs((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isDirty: false } : t)),
      );
    },
    [editorTabs],
  );

  const createFile = useCallback((parentPath: string, name: string) => {
    const newPath = parentPath === "/" ? name : `${parentPath}/${name}`;
    setFileContents((prev) => ({ ...prev, [newPath]: "" }));
    // Add to file tree (simplified - adds to root level)
    const newFile: ProjectFile = { name, path: newPath, type: "file" };
    setProjectFiles((prev) => {
      const addToTree = (nodes: ProjectFile[]): ProjectFile[] =>
        nodes.map((node) => {
          if (node.path === parentPath && node.type === "directory") {
            return {
              ...node,
              children: [...(node.children ?? []), newFile],
            };
          }
          if (node.children) {
            return { ...node, children: addToTree(node.children) };
          }
          return node;
        });
      return addToTree(prev);
    });
  }, []);

  const createFolder = useCallback((parentPath: string, name: string) => {
    const newPath = parentPath === "/" ? name : `${parentPath}/${name}`;
    const newFolder: ProjectFile = {
      name,
      path: newPath,
      type: "directory",
      children: [],
    };
    setProjectFiles((prev) => {
      const addToTree = (nodes: ProjectFile[]): ProjectFile[] =>
        nodes.map((node) => {
          if (node.path === parentPath && node.type === "directory") {
            return {
              ...node,
              children: [...(node.children ?? []), newFolder],
            };
          }
          if (node.children) {
            return { ...node, children: addToTree(node.children) };
          }
          return node;
        });
      return addToTree(prev);
    });
  }, []);

  const deleteFile = useCallback((path: string) => {
    setProjectFiles((prev) => {
      const removeFromTree = (nodes: ProjectFile[]): ProjectFile[] =>
        nodes
          .filter((n) => n.path !== path)
          .map((n) =>
            n.children ? { ...n, children: removeFromTree(n.children) } : n,
          );
      return removeFromTree(prev);
    });
    setFileContents((prev) => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
    setEditorTabs((prev) => prev.filter((t) => t.filepath !== path));
  }, []);

  // ── Build operations ────────────────────────────────────────────────────
  const runBuildTask = useCallback(
    (task: BuildTask) => {
      if (!projectConfig) return;
      setBuildStatus("running");
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

      setBuildOutput((prev) => [
        ...prev,
        {
          timestamp,
          message: `> Executing: ${task.command}`,
          type: "info",
        },
      ]);

      // Simulate build process
      const steps = [
        { delay: 500, msg: "> Configure project :app", type: "info" as const },
        {
          delay: 1200,
          msg: `> Task :app:${task.id.includes("clean") ? "clean" : "compileKotlin"}`,
          type: "info" as const,
        },
        {
          delay: 2000,
          msg: "> Task :app:processResources",
          type: "info" as const,
        },
        {
          delay: 2800,
          msg: task.id.includes("lint")
            ? "Warning: Missing contentDescription attribute on image"
            : "> Task :app:mergeDebugResources",
          type: task.id.includes("lint")
            ? ("warning" as const)
            : ("info" as const),
        },
        {
          delay: 3500,
          msg: task.id.includes("test")
            ? "Tests passed: 12, Failed: 0, Skipped: 0"
            : `> Task :app:${task.id.includes("assemble") ? "assembleDebug" : "processDebugManifest"}`,
          type: "info" as const,
        },
        {
          delay: 4200,
          msg: `BUILD SUCCESSFUL in ${Math.floor(Math.random() * 10 + 5)}s`,
          type: "success" as const,
        },
      ];

      for (const step of steps) {
        setTimeout(() => {
          const t = new Date();
          const ts = `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}:${t.getSeconds().toString().padStart(2, "0")}`;
          setBuildOutput((prev) => [
            ...prev,
            { timestamp: ts, message: step.msg, type: step.type },
          ]);
        }, step.delay);
      }

      setTimeout(() => {
        setBuildStatus("success");
      }, 4500);
    },
    [projectConfig],
  );

  const stopBuild = useCallback(() => {
    setBuildStatus("idle");
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setBuildOutput((prev) => [
      ...prev,
      { timestamp, message: "Build cancelled by user", type: "warning" },
    ]);
  }, []);

  const clearBuildOutput = useCallback(() => {
    setBuildOutput([]);
    setBuildStatus("idle");
  }, []);

  // ── Logcat operations ───────────────────────────────────────────────────
  const toggleLogStreaming = useCallback(() => {
    setIsLogStreaming((prev) => {
      if (!prev) {
        // Start generating demo logs
        setLogs(generateDemoLogs());
      }
      return !prev;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // ── Device operations ───────────────────────────────────────────────────
  const startDevice = useCallback((id: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: "booting" as const, isRunning: true } : d,
      ),
    );
    setTimeout(() => {
      setDevices((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: "online" as const } : d,
        ),
      );
    }, 3000);
  }, []);

  const stopDevice = useCallback((id: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: "offline" as const, isRunning: false }
          : d,
      ),
    );
  }, []);

  const deleteDevice = useCallback((id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const createEmulator = useCallback((template: EmulatorTemplate) => {
    const newDevice: AndroidDevice = {
      id: `emu-${Date.now()}`,
      name: template.name,
      type: "emulator",
      status: "offline",
      apiLevel: template.apiLevel,
      model: template.name,
      screenSize: template.screenSize,
      isRunning: false,
    };
    setDevices((prev) => [...prev, newDevice]);
  }, []);

  const refreshDevices = useCallback(() => {
    // In a real app, this would query ADB
  }, []);

  const installApk = useCallback((_deviceId: string) => {
    // In a real app, this would install via ADB
  }, []);

  // ── Terminal operations ─────────────────────────────────────────────────
  const addTerminalTab = useCallback(() => {
    const id = `term-${Date.now()}`;
    const newTab: TerminalTab = {
      id,
      name: `Terminal ${terminalTabs.length + 1}`,
      lines: [
        {
          id: `sys-${Date.now()}`,
          text: "Android IDE Terminal - Ready",
          type: "system",
        },
      ],
      workingDirectory: projectConfig
        ? `~/${projectConfig.name}`
        : "~/AndroidProjects",
      isRunning: false,
    };
    setTerminalTabs((prev) => [...prev, newTab]);
    setActiveTerminalId(id);
  }, [terminalTabs.length, projectConfig]);

  const closeTerminalTab = useCallback(
    (id: string) => {
      setTerminalTabs((prev) => {
        const next = prev.filter((t) => t.id !== id);
        if (id === activeTerminalId && next.length > 0) {
          setActiveTerminalId(next[0].id);
        } else if (next.length === 0) {
          setActiveTerminalId(null);
        }
        return next;
      });
    },
    [activeTerminalId],
  );

  const executeTerminalCommand = useCallback(
    (tabId: string, command: string) => {
      // Add input line
      const inputLine: TerminalLine = {
        id: `in-${Date.now()}`,
        text: `$ ${command}`,
        type: "input",
      };

      // Simulate command output
      let outputLines: TerminalLine[] = [];

      if (command.startsWith("./gradlew")) {
        outputLines = [
          {
            id: `out-${Date.now()}-1`,
            text: "Starting Gradle Daemon...",
            type: "output",
          },
          {
            id: `out-${Date.now()}-2`,
            text: "> Configure project :app",
            type: "output",
          },
          {
            id: `out-${Date.now()}-3`,
            text: "BUILD SUCCESSFUL in 8s",
            type: "output",
          },
        ];
      } else if (command === "adb devices") {
        const deviceList = devices
          .filter((d) => d.status === "online")
          .map((d) => `${d.id}\tdevice`)
          .join("\n");
        outputLines = [
          {
            id: `out-${Date.now()}-1`,
            text: `List of devices attached\n${deviceList || "(no devices)"}`,
            type: "output",
          },
        ];
      } else if (command === "ls" || command === "ls -la") {
        outputLines = [
          {
            id: `out-${Date.now()}-1`,
            text: "app/  build.gradle.kts  settings.gradle.kts  gradle.properties  gradlew  gradlew.bat",
            type: "output",
          },
        ];
      } else if (command === "pwd") {
        outputLines = [
          {
            id: `out-${Date.now()}-1`,
            text: projectConfig
              ? `/home/user/${projectConfig.name}`
              : "/home/user/AndroidProjects",
            type: "output",
          },
        ];
      } else if (command === "clear") {
        setTerminalTabs((prev) =>
          prev.map((t) =>
            t.id === tabId
              ? {
                  ...t,
                  lines: [
                    {
                      id: `sys-${Date.now()}`,
                      text: "Terminal cleared",
                      type: "system" as const,
                    },
                  ],
                }
              : t,
          ),
        );
        return;
      } else if (command === "help") {
        outputLines = [
          {
            id: `out-${Date.now()}-1`,
            text: `Available commands:
  ./gradlew <task>  - Run Gradle tasks
  adb devices       - List connected devices
  adb install       - Install APK on device
  ls, pwd, clear    - Basic shell commands
  help              - Show this help`,
            type: "system",
          },
        ];
      } else {
        outputLines = [
          {
            id: `out-${Date.now()}-1`,
            text: `Command simulated: ${command}`,
            type: "output",
          },
        ];
      }

      setTerminalTabs((prev) =>
        prev.map((t) =>
          t.id === tabId
            ? { ...t, lines: [...t.lines, inputLine, ...outputLines] }
            : t,
        ),
      );
    },
    [devices, projectConfig],
  );

  const clearTerminal = useCallback((tabId: string) => {
    setTerminalTabs((prev) =>
      prev.map((t) =>
        t.id === tabId
          ? {
              ...t,
              lines: [
                {
                  id: `sys-${Date.now()}`,
                  text: "Terminal cleared",
                  type: "system" as const,
                },
              ],
            }
          : t,
      ),
    );
  }, []);

  return {
    // Project
    projectConfig,
    projectFiles,
    createProject,
    hasProject: projectConfig !== null,

    // Editor
    editorTabs,
    activeTabId,
    setActiveTabId,
    openFile,
    closeTab,
    updateContent,
    saveFile,

    // File operations
    createFile,
    createFolder,
    deleteFile,
    refreshFiles: () => {},

    // Build
    buildStatus,
    buildOutput,
    runBuildTask,
    stopBuild,
    clearBuildOutput,

    // Logcat
    logs,
    isLogStreaming,
    toggleLogStreaming,
    clearLogs,

    // Devices
    devices,
    emulatorTemplates: DEFAULT_EMULATOR_TEMPLATES,
    startDevice,
    stopDevice,
    deleteDevice,
    createEmulator,
    refreshDevices,
    installApk,

    // Terminal
    terminalTabs,
    activeTerminalId,
    setActiveTerminalId,
    addTerminalTab,
    closeTerminalTab,
    executeTerminalCommand,
    clearTerminal,
  };
}
