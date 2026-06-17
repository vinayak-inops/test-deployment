import React, { useState } from "react";
import ChatChart from "./chat-chart";
import PdfDownloadCard from "./pdf-download-card";
import { ChartConfig, PdfConfig } from "@/type/ai-conversation/report";

interface RichTextRendererProps {
  content: string;
}

interface PaginatedTableProps {
  headers: string[];
  rows: string[][];
}

function PaginatedTable({ headers, rows }: PaginatedTableProps) {
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const visibleRows = rows.slice(start, start + PAGE_SIZE);

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-3 py-2 font-semibold text-gray-700 whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50/70">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > PAGE_SIZE && (
        <div className="border-t border-gray-200 bg-gray-50 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-gray-600">
              Showing {start + 1}-{Math.min(start + PAGE_SIZE, rows.length)} of {rows.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-[11px] text-gray-700 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-[11px] text-gray-600">
                Page {page}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-[11px] text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-blue-700">
            Need more data? Try prompts: <strong>"show next 10 rows"</strong>,{" "}
            <strong>"show previous 10 rows"</strong>, <strong>"show full table"</strong>.
          </p>
        </div>
      )}
    </div>
  );
}

function RichTextRenderer({ content }: RichTextRendererProps) {
  if (!content) return null;

  const renderInline = (text: string) => {
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }

      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        const before = part.substring(0, linkMatch.index);
        const after = part.substring((linkMatch.index || 0) + linkMatch[0].length);
        return (
          <React.Fragment key={index}>
            {before}
            <a href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {linkMatch[1]}
            </a>
            {after}
          </React.Fragment>
        );
      }

      return part;
    });
  };

  const elements: React.ReactNode[] = [];
  const lines = content.split("\n");

  let tableBuffer: string[] = [];
  let inTable = false;

  let chartBuffer: string[] = [];
  let inChart = false;

  let pdfBuffer: string[] = [];
  let inPdf = false;

  let codeBuffer: string[] = [];
  let inCodeBlock = false;
  let codeLanguage = "";

  const flushTable = (keyPrefix: number) => {
    if (tableBuffer.length === 0) return null;

    const headers = tableBuffer[0]
      .split("|")
      .map((h) => h.trim())
      .filter(Boolean);

    const rows = tableBuffer.slice(2).map((line) =>
      line
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell !== "")
    );

    const plainRows = rows.map((r) => r.map((c) => (typeof c === "string" ? c : String(c))));
    return <PaginatedTable key={`table-${keyPrefix}`} headers={headers} rows={plainRows} />;
  };

  const flushChart = (keyPrefix: number) => {
    if (chartBuffer.length === 0) return null;
    try {
      const parsed = JSON.parse(chartBuffer.join("\n")) as ChartConfig;
      return <ChatChart key={`chart-${keyPrefix}`} config={parsed} />;
    } catch (error) {
      console.error("Invalid chart config:", error);
      return (
        <div key={`chart-error-${keyPrefix}`} className="my-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600">
          Failed to render chart configuration.
        </div>
      );
    }
  };

  const flushPdf = (keyPrefix: number) => {
    if (pdfBuffer.length === 0) return null;
    try {
      const parsed = JSON.parse(pdfBuffer.join("\n")) as PdfConfig;
      return <PdfDownloadCard key={`pdf-${keyPrefix}`} config={parsed} />;
    } catch (error) {
      console.error("Invalid PDF config:", error);
      return (
        <div key={`pdf-error-${keyPrefix}`} className="my-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600">
          Failed to parse PDF configuration.
        </div>
      );
    }
  };

  const flushCode = (keyPrefix: number) => {
    if (codeBuffer.length === 0) return null;
    return (
      <div key={`code-${keyPrefix}`} className="my-2 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        <div className="border-b border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-600">
          {codeLanguage || "code"}
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap break-words p-3 text-[12px] text-gray-800">
          {codeBuffer.join("\n")}
        </pre>
      </div>
    );
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("```json-chart")) {
      inChart = true;
      return;
    }
    if (inChart && trimmed.startsWith("```")) {
      inChart = false;
      elements.push(flushChart(index));
      chartBuffer = [];
      return;
    }
    if (inChart) {
      chartBuffer.push(line);
      return;
    }

    if (trimmed.startsWith("```json-pdf")) {
      inPdf = true;
      return;
    }
    if (inPdf && trimmed.startsWith("```")) {
      inPdf = false;
      elements.push(flushPdf(index));
      pdfBuffer = [];
      return;
    }
    if (inPdf) {
      pdfBuffer.push(line);
      return;
    }

    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(flushCode(index));
        codeBuffer = [];
        codeLanguage = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLanguage = trimmed.replace("```", "").trim().toLowerCase();
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    if (trimmed.startsWith("|")) {
      if (!inTable) inTable = true;
      tableBuffer.push(trimmed);
      return;
    }

    if (inTable) {
      elements.push(flushTable(index));
      tableBuffer = [];
      inTable = false;
    }

    if (!trimmed) return;

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={index} className="mb-1 mt-2 text-sm font-semibold text-gray-900">
          {trimmed.replace("### ", "")}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={index} className="mb-1 mt-2 text-base font-semibold text-gray-900">
          {trimmed.replace("## ", "")}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith("- ")) {
      elements.push(
        <div key={index} className="flex gap-2 text-[13px] text-gray-800">
          <span className="text-blue-600">•</span>
          <span>{renderInline(trimmed.replace("- ", ""))}</span>
        </div>
      );
      return;
    }

    elements.push(
      <p key={index} className="text-[13px] leading-relaxed text-gray-800">
        {renderInline(trimmed)}
      </p>
    );
  });

  if (inTable) {
    elements.push(flushTable(lines.length));
  }
  if (inChart) {
    elements.push(flushChart(lines.length + 1));
  }
  if (inPdf) {
    elements.push(flushPdf(lines.length + 2));
  }
  if (inCodeBlock) {
    elements.push(flushCode(lines.length + 3));
  }

  return <div className="space-y-1">{elements}</div>;
}

export default RichTextRenderer;
