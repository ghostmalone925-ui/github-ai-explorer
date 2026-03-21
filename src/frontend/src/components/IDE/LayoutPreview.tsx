import { Button } from "@/components/ui/button";
import {
  Eye,
  Maximize2,
  Minimize2,
  Monitor,
  Moon,
  RotateCcw,
  Smartphone,
  Sun,
  Tablet,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

// ── Layout element types ────────────────────────────────────────────────────

export interface LayoutElement {
  tag: string;
  attributes: Record<string, string>;
  children: LayoutElement[];
  text?: string;
}

type PreviewDevice = "phone" | "tablet" | "foldable";
type PreviewOrientation = "portrait" | "landscape";
type PreviewTheme = "light" | "dark";

interface LayoutPreviewProps {
  xmlContent: string | null;
  fileName: string | null;
}

// ── Device dimensions ───────────────────────────────────────────────────────

const DEVICE_DIMENSIONS: Record<
  PreviewDevice,
  Record<PreviewOrientation, { width: number; height: number }>
> = {
  phone: {
    portrait: { width: 360, height: 640 },
    landscape: { width: 640, height: 360 },
  },
  tablet: {
    portrait: { width: 600, height: 960 },
    landscape: { width: 960, height: 600 },
  },
  foldable: {
    portrait: { width: 280, height: 640 },
    landscape: { width: 640, height: 280 },
  },
};

// ── Minimal XML parser for Android layouts ──────────────────────────────────

function parseXmlLayout(xml: string): LayoutElement | null {
  try {
    // Strip XML declaration
    const stripped = xml.replace(/<\?xml[^?]*\?>/g, "").trim();
    if (!stripped) return null;

    const elements: LayoutElement[] = [];
    const stack: LayoutElement[] = [];

    // Simple regex-based XML parser for layout files
    const tagRegex =
      /<\/?([a-zA-Z0-9_.]+)(\s[^>]*)?\s*\/?>|([^<]+)/g;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(stripped)) !== null) {
      const fullMatch = match[0];
      const tagName = match[1];
      const attrs = match[2] || "";
      const textContent = match[3];

      if (textContent) {
        const trimmed = textContent.trim();
        if (trimmed && stack.length > 0) {
          stack[stack.length - 1].text = trimmed;
        }
        continue;
      }

      if (!tagName) continue;

      if (fullMatch.startsWith("</")) {
        // Closing tag
        const el = stack.pop();
        if (el) {
          if (stack.length > 0) {
            stack[stack.length - 1].children.push(el);
          } else {
            elements.push(el);
          }
        }
      } else {
        // Opening tag
        const attributes: Record<string, string> = {};
        const attrRegex = /([a-zA-Z0-9_:]+)\s*=\s*"([^"]*)"/g;
        let attrMatch: RegExpExecArray | null;
        while ((attrMatch = attrRegex.exec(attrs)) !== null) {
          attributes[attrMatch[1]] = attrMatch[2];
        }

        const element: LayoutElement = {
          tag: tagName,
          attributes,
          children: [],
        };

        if (fullMatch.endsWith("/>")) {
          // Self-closing
          if (stack.length > 0) {
            stack[stack.length - 1].children.push(element);
          } else {
            elements.push(element);
          }
        } else {
          stack.push(element);
        }
      }
    }

    // Handle remaining unclosed tags
    while (stack.length > 1) {
      const el = stack.pop()!;
      stack[stack.length - 1].children.push(el);
    }
    if (stack.length === 1) {
      elements.push(stack[0]);
    }

    return elements[0] || null;
  } catch {
    return null;
  }
}

// ── Render a layout element to simulated UI ─────────────────────────────────

function getAttr(el: LayoutElement, name: string): string | undefined {
  return (
    el.attributes[`android:${name}`] ||
    el.attributes[`app:${name}`] ||
    el.attributes[name]
  );
}

function dimensionToStyle(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value === "match_parent" || value === "0dp") return "100%";
  if (value === "wrap_content") return "auto";
  const dp = Number.parseInt(value.replace("dp", "").replace("px", ""), 10);
  if (!Number.isNaN(dp)) return `${dp}px`;
  return undefined;
}

function RenderElement({
  element,
  theme,
  depth,
}: {
  element: LayoutElement;
  theme: PreviewTheme;
  depth: number;
}) {
  const isDark = theme === "dark";
  const tag = element.tag.split(".").pop() || element.tag;

  const width = dimensionToStyle(getAttr(element, "layout_width"));
  const height = dimensionToStyle(getAttr(element, "layout_height"));
  const padding = dimensionToStyle(getAttr(element, "padding"));
  const margin = dimensionToStyle(getAttr(element, "layout_margin"));
  const marginTop = dimensionToStyle(getAttr(element, "layout_marginTop"));
  const marginBottom = dimensionToStyle(
    getAttr(element, "layout_marginBottom"),
  );
  const bg = getAttr(element, "background");
  const textVal =
    getAttr(element, "text") || getAttr(element, "hint") || element.text;
  const textSize = getAttr(element, "textSize");
  const gravity = getAttr(element, "gravity");
  const orientation = getAttr(element, "orientation");

  const baseStyle: React.CSSProperties = {
    width: width || "100%",
    height: height === "auto" ? undefined : height,
    padding: padding || undefined,
    margin: margin || undefined,
    marginTop: marginTop || undefined,
    marginBottom: marginBottom || undefined,
    boxSizing: "border-box",
  };

  // Layout containers
  if (
    tag.includes("LinearLayout") ||
    tag.includes("FrameLayout") ||
    tag.includes("RelativeLayout") ||
    tag.includes("ConstraintLayout") ||
    tag.includes("CoordinatorLayout") ||
    tag.includes("ScrollView") ||
    tag.includes("NestedScrollView")
  ) {
    const isVertical = orientation !== "horizontal";
    return (
      <div
        style={{
          ...baseStyle,
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          alignItems: tag.includes("FrameLayout") ? "stretch" : undefined,
          overflow: tag.includes("ScrollView") ? "auto" : undefined,
        }}
      >
        {element.children.map((child, i) => (
          <RenderElement
            key={`${depth}-${i}`}
            element={child}
            theme={theme}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }

  // Scaffold / AppBarLayout
  if (tag.includes("Scaffold") || tag.includes("AppBarLayout")) {
    return (
      <div
        style={{
          ...baseStyle,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {element.children.map((child, i) => (
          <RenderElement
            key={`${depth}-${i}`}
            element={child}
            theme={theme}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }

  // Toolbar / MaterialToolbar
  if (tag.includes("Toolbar") || tag.includes("ActionBar")) {
    const title = getAttr(element, "title") || "Toolbar";
    return (
      <div
        style={{
          ...baseStyle,
          height: "48px",
          display: "flex",
          alignItems: "center",
          paddingLeft: "16px",
          background: isDark ? "#1f1f1f" : "#6200ee",
          color: "#fff",
          fontSize: "16px",
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {title.startsWith("@string/") ? title.replace("@string/", "") : title}
      </div>
    );
  }

  // TextView
  if (tag === "TextView" || tag === "MaterialTextView") {
    const size = textSize
      ? `${Number.parseInt(textSize, 10)}px`
      : "14px";
    return (
      <div
        style={{
          ...baseStyle,
          fontSize: size,
          color: isDark ? "#e0e0e0" : "#212121",
          textAlign: gravity?.includes("center") ? "center" : undefined,
          padding: padding || "4px 0",
        }}
      >
        {textVal?.startsWith("@string/")
          ? textVal.replace("@string/", "")
          : textVal || "TextView"}
      </div>
    );
  }

  // Button
  if (tag === "Button" || tag.includes("Button")) {
    return (
      <div
        style={{
          ...baseStyle,
          height: height || "36px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDark ? "#bb86fc" : "#6200ee",
          color: "#fff",
          borderRadius: "4px",
          fontSize: "14px",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          padding: "0 16px",
          cursor: "pointer",
        }}
      >
        {textVal?.startsWith("@string/")
          ? textVal.replace("@string/", "")
          : textVal || "BUTTON"}
      </div>
    );
  }

  // EditText / TextInputEditText
  if (tag.includes("EditText") || tag.includes("TextInput")) {
    const hint =
      getAttr(element, "hint") || getAttr(element, "text") || "Input field";
    return (
      <div
        style={{
          ...baseStyle,
          height: height || "48px",
          display: "flex",
          alignItems: "center",
          borderBottom: `2px solid ${isDark ? "#bb86fc" : "#6200ee"}`,
          fontSize: "14px",
          color: isDark ? "#888" : "#999",
          padding: "0 4px",
        }}
      >
        {hint.startsWith("@string/") ? hint.replace("@string/", "") : hint}
      </div>
    );
  }

  // ImageView
  if (tag === "ImageView") {
    const src = getAttr(element, "src") || "";
    return (
      <div
        style={{
          ...baseStyle,
          height: height || "120px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDark ? "#2a2a2a" : "#f0f0f0",
          borderRadius: "4px",
          color: isDark ? "#666" : "#aaa",
          fontSize: "11px",
        }}
      >
        {src ? `[${src.split("/").pop()}]` : "[Image]"}
      </div>
    );
  }

  // RecyclerView / ListView
  if (tag.includes("RecyclerView") || tag.includes("ListView")) {
    return (
      <div
        style={{
          ...baseStyle,
          display: "flex",
          flexDirection: "column",
          gap: "1px",
          overflow: "auto",
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: "56px",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              background: isDark ? "#2a2a2a" : "#fafafa",
              borderBottom: `1px solid ${isDark ? "#333" : "#eee"}`,
              fontSize: "14px",
              color: isDark ? "#ccc" : "#333",
            }}
          >
            List item {i}
          </div>
        ))}
      </div>
    );
  }

  // CardView
  if (tag.includes("CardView")) {
    return (
      <div
        style={{
          ...baseStyle,
          background: isDark ? "#2a2a2a" : "#fff",
          borderRadius: "8px",
          boxShadow: isDark
            ? "0 1px 3px rgba(0,0,0,0.4)"
            : "0 1px 3px rgba(0,0,0,0.12)",
          overflow: "hidden",
          padding: padding || "16px",
        }}
      >
        {element.children.map((child, i) => (
          <RenderElement
            key={`${depth}-${i}`}
            element={child}
            theme={theme}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }

  // FloatingActionButton
  if (tag.includes("FloatingActionButton")) {
    return (
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          right: "16px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: isDark ? "#bb86fc" : "#6200ee",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          color: "#fff",
          fontSize: "24px",
        }}
      >
        +
      </div>
    );
  }

  // Switch / CheckBox
  if (tag === "Switch" || tag === "CheckBox") {
    return (
      <div
        style={{
          ...baseStyle,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 0",
        }}
      >
        <div
          style={{
            width: tag === "Switch" ? "36px" : "18px",
            height: "18px",
            borderRadius: tag === "Switch" ? "9px" : "2px",
            background: isDark ? "#bb86fc" : "#6200ee",
          }}
        />
        <span
          style={{
            fontSize: "14px",
            color: isDark ? "#ccc" : "#333",
          }}
        >
          {textVal || tag}
        </span>
      </div>
    );
  }

  // ProgressBar
  if (tag === "ProgressBar") {
    return (
      <div
        style={{
          ...baseStyle,
          height: "4px",
          background: isDark ? "#333" : "#e0e0e0",
          borderRadius: "2px",
          overflow: "hidden",
          margin: "8px 0",
        }}
      >
        <div
          style={{
            width: "60%",
            height: "100%",
            background: isDark ? "#bb86fc" : "#6200ee",
            borderRadius: "2px",
          }}
        />
      </div>
    );
  }

  // Divider / View used as divider
  if (tag === "View" && height === "1px") {
    return (
      <div
        style={{
          ...baseStyle,
          height: "1px",
          background: isDark ? "#333" : "#e0e0e0",
        }}
      />
    );
  }

  // Space
  if (tag === "Space") {
    return <div style={baseStyle} />;
  }

  // Default: generic container with children
  if (element.children.length > 0) {
    return (
      <div
        style={{
          ...baseStyle,
          display: "flex",
          flexDirection: "column",
          background: bg
            ? isDark
              ? "#2a2a2a"
              : "#fafafa"
            : undefined,
        }}
      >
        {element.children.map((child, i) => (
          <RenderElement
            key={`${depth}-${i}`}
            element={child}
            theme={theme}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }

  // Unknown leaf element
  return (
    <div
      style={{
        ...baseStyle,
        padding: "4px 8px",
        fontSize: "11px",
        color: isDark ? "#666" : "#999",
        border: `1px dashed ${isDark ? "#444" : "#ddd"}`,
        borderRadius: "2px",
      }}
    >
      &lt;{tag} /&gt;
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function LayoutPreview({ xmlContent, fileName }: LayoutPreviewProps) {
  const [device, setDevice] = useState<PreviewDevice>("phone");
  const [orientation, setOrientation] = useState<PreviewOrientation>("portrait");
  const [theme, setTheme] = useState<PreviewTheme>("light");
  const [zoom, setZoom] = useState(0.55);

  const parsedLayout = useMemo(
    () => (xmlContent ? parseXmlLayout(xmlContent) : null),
    [xmlContent],
  );

  const dims = DEVICE_DIMENSIONS[device][orientation];

  const handleZoomIn = useCallback(
    () => setZoom((z) => Math.min(z + 0.1, 1.5)),
    [],
  );
  const handleZoomOut = useCallback(
    () => setZoom((z) => Math.max(z - 0.1, 0.2)),
    [],
  );
  const handleResetZoom = useCallback(() => setZoom(0.55), []);

  const isDark = theme === "dark";

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/30 shrink-0">
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-medium">Layout Preview</span>
          {fileName && (
            <span className="text-[10px] text-muted-foreground ml-1">
              {fileName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          {/* Device selector */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDevice("phone")}
            className={`h-6 w-6 p-0 ${device === "phone" ? "bg-muted text-primary" : ""}`}
            title="Phone"
          >
            <Smartphone className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDevice("tablet")}
            className={`h-6 w-6 p-0 ${device === "tablet" ? "bg-muted text-primary" : ""}`}
            title="Tablet"
          >
            <Tablet className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDevice("foldable")}
            className={`h-6 w-6 p-0 ${device === "foldable" ? "bg-muted text-primary" : ""}`}
            title="Foldable"
          >
            <Monitor className="w-3 h-3" />
          </Button>

          <div className="w-px h-3 bg-border/50 mx-1" />

          {/* Orientation */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setOrientation((o) =>
                o === "portrait" ? "landscape" : "portrait",
              )
            }
            className="h-6 w-6 p-0"
            title="Toggle orientation"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>

          {/* Theme */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setTheme((t) => (t === "light" ? "dark" : "light"))
            }
            className="h-6 w-6 p-0"
            title="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="w-3 h-3" />
            ) : (
              <Sun className="w-3 h-3" />
            )}
          </Button>

          <div className="w-px h-3 bg-border/50 mx-1" />

          {/* Zoom */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="h-6 w-6 p-0"
            title="Zoom out"
          >
            <ZoomOut className="w-3 h-3" />
          </Button>
          <span className="text-[10px] text-muted-foreground w-8 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="h-6 w-6 p-0"
            title="Zoom in"
          >
            <ZoomIn className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetZoom}
            className="h-6 w-6 p-0"
            title="Reset zoom"
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-[repeating-conic-gradient(#80808012_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
        {!xmlContent ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Eye className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-[11px] text-muted-foreground/50">
              Open an XML layout file to preview
            </p>
            <p className="text-[10px] text-muted-foreground/30 mt-1">
              Supports LinearLayout, ConstraintLayout, and common widgets
            </p>
          </div>
        ) : !parsedLayout ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Eye className="w-8 h-8 text-destructive/30 mb-2" />
            <p className="text-[11px] text-destructive/70">
              Failed to parse layout XML
            </p>
            <p className="text-[10px] text-muted-foreground/30 mt-1">
              Check your XML syntax and try again
            </p>
          </div>
        ) : (
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
            }}
          >
            {/* Phone frame */}
            <div
              style={{
                width: dims.width + 24,
                borderRadius: "28px",
                border: "3px solid #555",
                background: "#222",
                padding: "32px 12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              {/* Status bar */}
              <div
                style={{
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 12px",
                  background: isDark ? "#121212" : "#fff",
                  borderRadius: "2px 2px 0 0",
                  fontSize: "10px",
                  color: isDark ? "#999" : "#666",
                }}
              >
                <span>9:41</span>
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <span style={{ fontSize: "9px" }}>LTE</span>
                  <div
                    style={{
                      width: "16px",
                      height: "8px",
                      border: `1px solid ${isDark ? "#666" : "#999"}`,
                      borderRadius: "2px",
                      padding: "1px",
                    }}
                  >
                    <div
                      style={{
                        width: "70%",
                        height: "100%",
                        background: isDark ? "#666" : "#333",
                        borderRadius: "1px",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Layout content */}
              <div
                style={{
                  width: dims.width,
                  height: dims.height - 24,
                  background: isDark ? "#121212" : "#ffffff",
                  overflow: "auto",
                  position: "relative",
                }}
              >
                <RenderElement
                  element={parsedLayout}
                  theme={theme}
                  depth={0}
                />
              </div>

              {/* Navigation bar */}
              <div
                style={{
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "48px",
                  background: isDark ? "#121212" : "#fff",
                  borderRadius: "0 0 2px 2px",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    border: `1.5px solid ${isDark ? "#666" : "#999"}`,
                  }}
                />
                <div
                  style={{
                    width: "28px",
                    height: "3px",
                    borderRadius: "2px",
                    background: isDark ? "#666" : "#ccc",
                  }}
                />
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    border: `1.5px solid ${isDark ? "#666" : "#999"}`,
                    borderRadius: "2px",
                  }}
                />
              </div>
            </div>

            {/* Device info */}
            <div className="text-center mt-2">
              <span className="text-[10px] text-muted-foreground/50">
                {dims.width} x {dims.height} dp
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
