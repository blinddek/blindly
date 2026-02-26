"use client";

import { useRef, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Bold,
  Italic,
  Underline,
  Link,
  List,
  ListOrdered,
  Type,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  Minus,
  Code,
} from "lucide-react";

const DEFAULT_VARIABLE_CHIPS: VariableChip[] = [
  { key: "firstName", label: "First Name", description: "Client\u2019s first name (falls back to \u2018there\u2019)" },
  { key: "unsubscribeUrl", label: "Unsubscribe URL", description: "One-click unsubscribe link" },
  { key: "passwordResetUrl", label: "Set Password Link", description: "Generates a unique login/password setup link per client. Use in CTA URL or body." },
];

export interface VariableChip {
  key: string;
  label: string;
  description?: string;
}

interface ToolbarButton {
  icon: React.ReactNode;
  command: string;
  value?: string;
  title: string;
}

interface ToolbarGroup {
  label: string;
  buttons: ToolbarButton[];
}

const TOOLBAR_GROUPS: ToolbarGroup[] = [
  {
    label: "Text",
    buttons: [
      { icon: <Type className="h-3.5 w-3.5" />, command: "formatBlock", value: "p", title: "Paragraph" },
      { icon: <Heading2 className="h-3.5 w-3.5" />, command: "formatBlock", value: "h2", title: "Heading 2" },
      { icon: <Heading3 className="h-3.5 w-3.5" />, command: "formatBlock", value: "h3", title: "Heading 3" },
    ],
  },
  {
    label: "Format",
    buttons: [
      { icon: <Bold className="h-3.5 w-3.5" />, command: "bold", title: "Bold" },
      { icon: <Italic className="h-3.5 w-3.5" />, command: "italic", title: "Italic" },
      { icon: <Underline className="h-3.5 w-3.5" />, command: "underline", title: "Underline" },
    ],
  },
  {
    label: "Insert",
    buttons: [
      { icon: <Link className="h-3.5 w-3.5" />, command: "insertLink", title: "Insert Link" },
      { icon: <List className="h-3.5 w-3.5" />, command: "insertUnorderedList", title: "Bullet List" },
      { icon: <ListOrdered className="h-3.5 w-3.5" />, command: "insertOrderedList", title: "Numbered List" },
      { icon: <Minus className="h-3.5 w-3.5" />, command: "insertHorizontalRule", title: "Horizontal Rule" },
    ],
  },
  {
    label: "Align",
    buttons: [
      { icon: <AlignLeft className="h-3.5 w-3.5" />, command: "justifyLeft", title: "Align Left" },
      { icon: <AlignCenter className="h-3.5 w-3.5" />, command: "justifyCenter", title: "Align Center" },
    ],
  },
];

interface RichTextEditorProps {
  readonly value: string;
  readonly onChange: (html: string) => void;
  readonly placeholder?: string;
  readonly minHeight?: string;
  readonly variables?: VariableChip[];
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing your email content...",
  minHeight = "240px",
  variables = DEFAULT_VARIABLE_CHIPS,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCommand = useCallback((command: string, val?: string) => {
    if (command === "insertLink") {
      const url = prompt("Enter URL:", "https://");
      if (url) {
        document.execCommand("createLink", false, url); // NOSONAR — no modern alternative for contentEditable
        editorRef.current?.focus();
        handleInput();
      }
      return;
    }
    document.execCommand(command, false, val); // NOSONAR — no modern alternative for contentEditable
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const insertVariable = useCallback((variable: string) => {
    const html = `<span style="background: var(--primary-muted, #f0f4f0); color: var(--primary, #555); padding: 1px 6px; border-radius: 4px; font-size: 13px; font-family: monospace;">{{${variable}}}</span>&nbsp;`;
    document.execCommand("insertHTML", false, html); // NOSONAR — no modern alternative for contentEditable
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const toggleSource = useCallback(() => {
    if (!editorRef.current) return;
    const el = editorRef.current;
    if (el.dataset.source === "true") {
      el.innerHTML = el.innerText;
      delete el.dataset.source;
      el.style.fontFamily = "";
      el.style.fontSize = "";
      el.style.whiteSpace = "";
    } else {
      el.innerText = el.innerHTML;
      el.dataset.source = "true";
      el.style.fontFamily = "monospace";
      el.style.fontSize = "12px";
      el.style.whiteSpace = "pre-wrap";
    }
  }, []);

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-input bg-muted/30 p-1.5">
        {TOOLBAR_GROUPS.map((group, gi) => (
          <div key={group.label} className="flex items-center">
            {gi > 0 && <div className="mx-1 h-5 w-px bg-border" />}
            {group.buttons.map((btn) => (
              <button
                key={btn.title}
                type="button"
                onClick={() => execCommand(btn.command, btn.value)}
                title={btn.title}
                className="rounded p-1.5 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
              >
                {btn.icon}
              </button>
            ))}
          </div>
        ))}

        <div className="mx-1 h-5 w-px bg-border" />
        <button
          type="button"
          onClick={toggleSource}
          title="Toggle HTML Source"
          className="rounded p-1.5 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
        >
          <Code className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Variables bar */}
      <div className="flex flex-wrap items-center gap-1.5 px-1">
        <span className="text-xs text-muted-foreground">Insert variable:</span>
        {variables.map((v) => (
          <Badge
            key={v.key}
            variant="outline"
            className="cursor-pointer text-xs hover:bg-primary/10 hover:border-primary/40 transition-colors"
            onClick={() => insertVariable(v.key)}
            title={v.description}
          >
            {`{{${v.key}}}`}
          </Badge>
        ))}
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className="rounded-md border border-input bg-background px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground/50"
        style={{ minHeight, lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: value }}
        suppressContentEditableWarning
      />
    </div>
  );
}
