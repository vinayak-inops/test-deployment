"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Check, FileText, AlertCircle } from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Button } from "@repo/ui/components/ui/button";
import { Separator } from "@repo/ui/components/ui/separator";
import {
  emailTemplateSchema,
  type EmailTemplateFormData,
  EMAIL_TEMPLATE_DEFAULT,
} from "./email-template-schema";

interface EmailTemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmailTemplateFormData) => Promise<void>;
  initialData?: {
    _id?: string;
    templateName?: string;
    subject?: string;
    body?: string;
    isActive?: boolean;
  };
  mode?: "add" | "edit" | "view";
  isSubmitting?: boolean;
}

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900";
const LABEL_CLASS =
  "block text-xs font-medium text-gray-700 uppercase tracking-wide";
const DISABLED_CLASS = "bg-gray-100 cursor-not-allowed";

// ─── Token definitions ────────────────────────────────────────────────────────
const INSERT_TOKENS = [
  { label: "Contact First name",       value: "@@contact.firstName@@" },
  { label: "Contact Last name",        value: "@@contact.lastName@@" },
  { label: "Contact Email",            value: "@@contact.email@@" },
  { label: "Contact Phone",            value: "@@contact.phone@@" },
  { label: "Scheduling Service name",  value: "@@scheduling.serviceName@@" },
  { label: "Scheduling Service date",  value: "@@scheduling.serviceDate@@" },
  { label: "Scheduling Start time",    value: "@@scheduling.startTime@@" },
  { label: "Scheduling End time",      value: "@@scheduling.endTime@@" },
];

const SIGNATURE_TOKENS = [
  { label: "My Signature",      value: "@@signature.mine@@" },
  { label: "Company Signature", value: "@@signature.company@@" },
];

const ALL_TOKENS = [...INSERT_TOKENS, ...SIGNATURE_TOKENS];

function tokenBg(value: string) {
  if (value.startsWith("@@contact"))    return "#d1fae5";
  if (value.startsWith("@@scheduling")) return "#dbeafe";
  if (value.startsWith("@@signature"))  return "#ede9fe";
  return "#f3f4f6";
}
function tokenColor(value: string) {
  if (value.startsWith("@@contact"))    return "#065f46";
  if (value.startsWith("@@scheduling")) return "#1e40af";
  if (value.startsWith("@@signature"))  return "#5b21b6";
  return "#374151";
}

function buildTokenHTML(value: string, label: string) {
  const bg    = tokenBg(value);
  const color = tokenColor(value);
  return (
    `<span ` +
    `contenteditable="false" ` +
    `data-token="${value}" ` +
    `style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:4px;` +
    `font-size:12px;font-weight:500;cursor:default;user-select:none;` +
    `background:${bg};color:${color};white-space:nowrap;line-height:1.6;" ` +
    `>${label}</span>`
  );
}

// Convert @@value@@ literals in stored HTML → chip spans for display
function parseTokensInHTML(html: string): string {
  return html.replace(/@@([^@]+)@@/g, (match) => {
    const found = ALL_TOKENS.find((t) => t.value === match);
    return buildTokenHTML(match, found?.label ?? match);
  });
}

// Convert chip spans back to @@value@@ for storage
function extractCleanHTML(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  div.querySelectorAll("[data-token]").forEach((el) => {
    const val = el.getAttribute("data-token") ?? "";
    el.replaceWith(document.createTextNode(val));
  });
  return div.innerHTML;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const I = {
  Bold:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 11.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 7.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>,
  Italic:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>,
  Under:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>,
  Strike:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M10 19h4v-3h-4v3zM5 4v3h6v3h2V7h6V4H5zM3 14h18v-2H3v2z"/></svg>,
  UList:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>,
  OList:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-8v2h14V3H7zm0 18h14v-2H7v2zm0-7h14v-2H7v2z"/></svg>,
  Remove:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3.27 5L2 6.27l6.97 6.97L6.5 19h3l1.57-3.97L16.73 21 18 19.73 3.27 5zM6 5v.18L8.82 8H11l-.55 1.39 1.45 1.45L13.27 8H21V5H6z"/></svg>,
  Link:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>,
  Image:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>,
  Code:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>,
  AlignL:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>,
  AlignC:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/></svg>,
  AlignR:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/></svg>,
  Indent:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 9h10v-2H11v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"/></svg>,
  Outdent: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M11 17h10v-2H11v2zM3 12l4 4V8l-4 4zm-3 9h21v-2H0v2zM0 3v2h21V3H0zm11 6h10V7H11v2zm0 4h10v-2H11v2z"/></svg>,
  Quote:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>,
  Undo:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>,
  Redo:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>,
  Chev:    () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>,
};

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function Dropdown({
  label, items, onSelect, disabled, minWidth = 160,
}: {
  label: React.ReactNode;
  items: { label: string; value: string; render?: React.ReactNode }[];
  onSelect: (value: string, label: string) => void;
  disabled?: boolean;
  minWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        className="inline-flex items-center gap-1 h-7 px-2 text-xs font-medium rounded
          border border-gray-300 bg-white text-gray-700 hover:bg-gray-50
          disabled:opacity-40 disabled:cursor-not-allowed select-none whitespace-nowrap"
      >
        {label}
        <I.Chev />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200
            rounded-lg shadow-xl py-1 overflow-y-auto max-h-60"
          style={{ minWidth }}
        >
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item.value, item.label);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
            >
              {item.render ?? item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Toolbar button ───────────────────────────────────────────────────────────
function TbBtn({ title, onClick, children, disabled }: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className="inline-flex items-center justify-center h-7 w-7 rounded transition-colors
        text-gray-600 hover:bg-gray-200 hover:text-gray-900
        disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

const Sep = () => (
  <div className="w-px h-5 bg-gray-200 mx-0.5 self-center flex-shrink-0" />
);

// Font & size options
const FONT_FAMILIES = [
  { label: "Sans-serif",    value: "sans-serif" },
  { label: "Serif",         value: "Georgia, serif" },
  { label: "Monospace",     value: "monospace" },
  { label: "Arial",         value: "Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New",   value: "'Courier New', monospace" },
  { label: "Verdana",       value: "Verdana, sans-serif" },
  { label: "Tahoma",        value: "Tahoma, sans-serif" },
];
const FONT_SIZES = [
  { label: "Small",  value: "1" },
  { label: "Normal", value: "3" },
  { label: "Large",  value: "5" },
  { label: "Huge",   value: "7" },
];

// ─── Rich Text Editor ─────────────────────────────────────────────────────────
function RichTextEditor({
  value, onChange, disabled, hasError,
}: {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}) {
  const editorRef  = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const isInternal = useRef(false);
  const lastEmittedHtml = useRef("");
  const txtColorRef = useRef<HTMLInputElement>(null);
  const bgColorRef  = useRef<HTMLInputElement>(null);
  const [fontLabel, setFontLabel] = useState("Sans-serif");
  const [sizeLabel, setSizeLabel] = useState("Normal");

  // Sync value → editor on initial load or external change
  useEffect(() => {
    if (!editorRef.current || isInternal.current) return;
    const incomingHtml = value || "";
    if (incomingHtml === lastEmittedHtml.current) return;

    const parsed = parseTokensInHTML(incomingHtml);
    if (editorRef.current.innerHTML !== parsed) editorRef.current.innerHTML = parsed;
  }, [value]);

  const saveRange = useCallback(() => {
    const sel = window.getSelection();
    if (sel?.rangeCount && editorRef.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreRange = useCallback(() => {
    if (!savedRange.current || !editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(savedRange.current);
  }, []);

  const emit = useCallback(() => {
    isInternal.current = true;
    const cleanHtml = extractCleanHTML(editorRef.current?.innerHTML ?? "");
    lastEmittedHtml.current = cleanHtml;
    onChange(cleanHtml);
    isInternal.current = false;
  }, [onChange]);

  const exec = useCallback((cmd: string, val?: string) => {
    restoreRange();
    document.execCommand(cmd, false, val);
    emit();
  }, [restoreRange, emit]);

  const insertToken = useCallback((tokenValue: string, tokenLabel: string) => {
    restoreRange();
    const chip = buildTokenHTML(tokenValue, tokenLabel);
    document.execCommand("insertHTML", false, chip + "&nbsp;");
    emit();
  }, [restoreRange, emit]);

  // ── Prevent editing inside token chips ──
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let el: Node | null = sel.anchorNode;
    while (el && el !== editorRef.current) {
      if (el instanceof HTMLElement && el.hasAttribute("data-token")) {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Tab"].includes(e.key)) {
          e.preventDefault();
        }
        return;
      }
      el = el.parentNode;
    }
  }, []);

  // ── Move cursor past chip on click ──
  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { saveRange(); return; }
    let el: Node | null = sel.anchorNode;
    while (el && el !== editorRef.current) {
      if (el instanceof HTMLElement && el.hasAttribute("data-token")) {
        const range = document.createRange();
        range.setStartAfter(el);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        savedRange.current = range.cloneRange();
        return;
      }
      el = el.parentNode;
    }
    saveRange();
  }, [saveRange]);

  const tokenDropItems = (tokens: typeof INSERT_TOKENS) =>
    tokens.map((t) => ({
      label: t.label,
      value: t.value,
      render: (
        <span
          style={{
            display: "inline-flex", alignItems: "center",
            padding: "2px 8px", borderRadius: 4,
            fontSize: 12, fontWeight: 500,
            background: tokenBg(t.value), color: tokenColor(t.value),
          }}
        >
          {t.label}
        </span>
      ),
    }));

  return (
    <div
      className={`border rounded-md overflow-hidden bg-white
        ${hasError ? "border-red-400" : "border-gray-300"}
        ${disabled ? "opacity-60" : ""}`}
    >
      {/* ── TOOLBAR ─────────────────────────────────────────────────── */}
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50 select-none">

        {/* Font family */}
        <Dropdown
          label={<span className="text-xs max-w-[70px] truncate">{fontLabel}</span>}
          items={FONT_FAMILIES.map((f) => ({
            ...f,
            render: <span style={{ fontFamily: f.value, fontSize: 13 }}>{f.label}</span>,
          }))}
          onSelect={(val, lbl) => { setFontLabel(lbl); exec("fontName", val); }}
          disabled={disabled}
          minWidth={160}
        />

        {/* Font size */}
        <Dropdown
          label={<span className="text-xs">{sizeLabel}</span>}
          items={FONT_SIZES}
          onSelect={(val, lbl) => { setSizeLabel(lbl); exec("fontSize", val); }}
          disabled={disabled}
          minWidth={100}
        />

        <Sep />

        {/* B I U S */}
        <TbBtn title="Bold (Ctrl+B)"      onClick={() => exec("bold")}          disabled={disabled}><I.Bold /></TbBtn>
        <TbBtn title="Italic (Ctrl+I)"    onClick={() => exec("italic")}        disabled={disabled}><I.Italic /></TbBtn>
        <TbBtn title="Underline (Ctrl+U)" onClick={() => exec("underline")}     disabled={disabled}><I.Under /></TbBtn>
        <TbBtn title="Strikethrough"      onClick={() => exec("strikeThrough")} disabled={disabled}><I.Strike /></TbBtn>

        <Sep />

        {/* Text colour */}
        <div className="inline-flex flex-col items-center gap-0">
          <TbBtn title="Text color" onClick={() => { saveRange(); txtColorRef.current?.click(); }} disabled={disabled}>
            <span className="font-bold text-xs">A</span>
          </TbBtn>
          <div className="h-[3px] w-5 rounded-sm -mt-0.5" style={{ background: "#e24b4a" }} />
          <input ref={txtColorRef} type="color" defaultValue="#e24b4a"
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
            onChange={(e) => exec("foreColor", e.target.value)} />
        </div>

        {/* Highlight colour */}
        <div className="inline-flex flex-col items-center gap-0">
          <TbBtn title="Highlight color" onClick={() => { saveRange(); bgColorRef.current?.click(); }} disabled={disabled}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15a1.49 1.49 0 000 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"/>
            </svg>
          </TbBtn>
          <div className="h-[3px] w-5 rounded-sm -mt-0.5" style={{ background: "#fbbf24" }} />
          <input ref={bgColorRef} type="color" defaultValue="#fef08a"
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
            onChange={(e) => exec("hiliteColor", e.target.value)} />
        </div>

        <Sep />

        {/* Alignment */}
        <TbBtn title="Align left"   onClick={() => exec("justifyLeft")}   disabled={disabled}><I.AlignL /></TbBtn>
        <TbBtn title="Align center" onClick={() => exec("justifyCenter")} disabled={disabled}><I.AlignC /></TbBtn>
        <TbBtn title="Align right"  onClick={() => exec("justifyRight")}  disabled={disabled}><I.AlignR /></TbBtn>

        <Sep />

        {/* Lists + indent */}
        <TbBtn title="Bullet list"   onClick={() => exec("insertUnorderedList")} disabled={disabled}><I.UList /></TbBtn>
        <TbBtn title="Numbered list" onClick={() => exec("insertOrderedList")}   disabled={disabled}><I.OList /></TbBtn>
        <TbBtn title="Indent"        onClick={() => exec("indent")}              disabled={disabled}><I.Indent /></TbBtn>
        <TbBtn title="Outdent"       onClick={() => exec("outdent")}             disabled={disabled}><I.Outdent /></TbBtn>

        <Sep />

        {/* Blockquote */}
        <TbBtn
          title="Blockquote"
          onClick={() =>
            exec("insertHTML",
              `<blockquote style="border-left:3px solid #d1d5db;margin:6px 0;padding:4px 12px;color:#6b7280;font-style:italic;"><br></blockquote>`)
          }
          disabled={disabled}
        ><I.Quote /></TbBtn>

        {/* Remove formatting */}
        <TbBtn title="Remove formatting" onClick={() => exec("removeFormat")} disabled={disabled}><I.Remove /></TbBtn>

        <Sep />

        {/* Link */}
        <TbBtn
          title="Insert link"
          onClick={() => {
            saveRange();
            const url = prompt("Enter URL:", "https://");
            if (url) exec("createLink", url);
          }}
          disabled={disabled}
        ><I.Link /></TbBtn>

        {/* Horizontal rule */}
        <TbBtn
          title="Horizontal rule"
          onClick={() => exec("insertHorizontalRule")}
          disabled={disabled}
        >
          <span className="text-gray-500 text-xs font-bold leading-none">—</span>
        </TbBtn>

        {/* Image */}
        <TbBtn
          title="Insert image"
          onClick={() => {
            saveRange();
            const url = prompt("Image URL:");
            if (url)
              exec("insertHTML",
                `<img src="${url}" alt="" style="max-width:100%;height:auto;display:block;margin:4px 0;" />`);
          }}
          disabled={disabled}
        ><I.Image /></TbBtn>

        {/* Code block */}
        <TbBtn
          title="Code block"
          onClick={() =>
            exec("insertHTML",
              `<pre style="background:#f3f4f6;border-radius:4px;padding:8px 12px;font-family:monospace;font-size:12px;overflow-x:auto;margin:4px 0;"><code>code here</code></pre>`)
          }
          disabled={disabled}
        ><I.Code /></TbBtn>

        <Sep />

        {/* Undo / Redo */}
        <TbBtn title="Undo (Ctrl+Z)" onClick={() => exec("undo")} disabled={disabled}><I.Undo /></TbBtn>
        <TbBtn title="Redo (Ctrl+Y)" onClick={() => exec("redo")} disabled={disabled}><I.Redo /></TbBtn>

        <Sep />

        {/* INSERT TOKEN */}
        {/* <Dropdown
          label={<span className="font-semibold tracking-wide text-[11px]">INSERT TOKEN</span>}
          items={tokenDropItems(INSERT_TOKENS)}
          onSelect={(val, lbl) => insertToken(val, lbl)}
          disabled={disabled}
          minWidth={220}
        /> */}

        {/* SIGNATURES */}
        {/* <Dropdown
          label={<span className="font-semibold tracking-wide text-[11px]">SIGNATURES</span>}
          items={tokenDropItems(SIGNATURE_TOKENS)}
          onSelect={(val, lbl) => insertToken(val, lbl)}
          disabled={disabled}
          minWidth={180}
        /> */}
      </div>

      {/* ── EDITABLE AREA ─────────────────────────────────────────────── */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={() => emit()}
        onKeyDown={handleKeyDown}
        onKeyUp={saveRange}
        onMouseUp={handleMouseUp}
        onFocus={saveRange}
        className="min-h-[260px] max-h-[420px] overflow-y-auto p-4 text-sm text-gray-800
          leading-relaxed outline-none focus:ring-0"
        style={{
          fontFamily: "inherit",
          cursor: disabled ? "not-allowed" : "text",
          caretColor: "#111827",
        }}
        data-placeholder="Write your email here, or use INSERT TOKEN ▾ to add dynamic values…"
      />

      <style>{`
        [data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [data-token] { cursor: default !important; }
        [data-token] * { user-select: none !important; }
      `}</style>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export function EmailTemplateForm({
  isOpen, onClose, onSubmit, initialData, mode = "add", isSubmitting = false,
}: EmailTemplateFormProps) {
  const isViewMode = mode === "view";

  const {
    register, handleSubmit,
    formState: { errors },
    reset, setValue, watch, trigger,
  } = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: EMAIL_TEMPLATE_DEFAULT,
  });

  const bodyValue = watch("body");
  const isActiveValue = watch("isActive");

  useEffect(() => {
    if (isOpen) {
      if (initialData && (mode === "edit" || mode === "view")) {
        reset({
          templateName: initialData.templateName || "",
          subject:      initialData.subject      || "",
          body:         initialData.body          || "",
          isActive:     initialData.isActive      ?? true,
        });
      } else if (mode === "add") {
        reset(EMAIL_TEMPLATE_DEFAULT);
      }
    }
  }, [isOpen, initialData, mode, reset]);

  useEffect(() => {
    if (!isOpen) reset(EMAIL_TEMPLATE_DEFAULT);
  }, [isOpen, reset]);

  const handleBodyChange = (val: string) => {
    setValue("body", val, { shouldValidate: true });
    trigger("body");
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) onClose(); };
    if (isOpen) {
      document.addEventListener("keydown", fn);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", fn);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm">
      <div className="bg-white shadow-xl border-l border-gray-200 w-full max-w-5xl h-full overflow-hidden flex flex-col rounded-l-lg">

        {/* Header */}
        <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <FileText className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-700">
                {mode === "add" ? "Create Email Template" :
                  mode === "edit" ? "Edit Email Template" : "View Email Template"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Email template details, content, and variables
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scroll-smooth bg-white
            [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100
            [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">

            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-gray-100 rounded-lg">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <h4 className="text-sm font-semibold text-gray-700">Basic Information</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>
                    Template Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("templateName")}
                    placeholder="Enter template name"
                    className={`${INPUT_CLASS} ${isViewMode ? DISABLED_CLASS : ""}`}
                    disabled={isViewMode}
                  />
                  {errors.templateName && (
                    <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.templateName.message}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>Status</Label>
                  <div className="h-9 flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3">
                    <input
                      type="checkbox"
                      checked={isActiveValue}
                      disabled={isViewMode}
                      onChange={(e) => { if (!isViewMode) setValue("isActive", e.target.checked); }}
                      className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600
                        focus:ring-2 focus:ring-blue-600 focus:ring-offset-0
                        disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Label className="text-sm text-gray-700 cursor-pointer">
                      {isActiveValue ? "Active" : "Inactive"}
                    </Label>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className={LABEL_CLASS}>
                    Subject <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("subject")}
                    placeholder="Enter email subject"
                    className={`${INPUT_CLASS} ${isViewMode ? DISABLED_CLASS : ""}`}
                    disabled={isViewMode}
                  />
                  {errors.subject && (
                    <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.subject.message}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Email Content */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-gray-100 rounded-lg">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <h4 className="text-sm font-semibold text-gray-700">Email Content</h4>
              </div>

              <div className="space-y-1.5">
                <RichTextEditor
                  value={bodyValue || ""}
                  onChange={handleBodyChange}
                  disabled={isViewMode}
                  hasError={!!errors.body}
                />
                {errors.body && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.body.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
          <Button
            variant="outline" size="sm"
            className="bg-white hover:bg-gray-50"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSubmit(async (data) => { await onSubmit(data); })}
              disabled={isSubmitting}
            >
              <Check className="h-4 w-4 mr-1" />
              {isSubmitting ? "Saving..." : mode === "edit" ? "Update Template" : "Create Template"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
