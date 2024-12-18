import { useMemo } from "react";
import type { DiffResult } from "../types";
import { Palette } from "@phosphor-icons/react";

interface DiffTableViewProps {
  diffContent: string | null;
  loadingDiff: boolean;
}

interface DiffLine {
  type: "header" | "added" | "removed";
  path?: string;
  value?: string;
  content?: string;
  isColor?: boolean;
  valueType?: "COLOR" | "STRING" | "NUMBER" | "BOOLEAN";
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

function extractColorFromSpan(line: string): string | null {
  const match = line.match(/background-color: (#[A-Fa-f0-9]{6})/);
  return match ? match[1] : null;
}

export function DiffTableView({
  diffContent,
  loadingDiff,
}: DiffTableViewProps) {
  const diffLines = useMemo(() => {
    if (!diffContent) return [];

    return diffContent.split("\n").reduce((acc: DiffLine[], line) => {
      // Skip empty lines
      if (!line.trim()) return acc;

      // Handle headers
      if (line.startsWith("@")) {
        const path = line.slice(2).trim();
        acc.push({ type: "header", content: path });
        return acc;
      }

      // Handle value changes
      if (line.includes("<span")) {
        const cleanLine = stripHtml(line);
        const color = extractColorFromSpan(line);

        if (
          cleanLine.startsWith("- value:") ||
          cleanLine.startsWith("+ value:")
        ) {
          const type = cleanLine.startsWith("- ") ? "removed" : "added";
          const value = color || cleanLine.split(":")[1].trim();
          const currentPath = acc.find((l) => l.type === "header")?.content;

          acc.push({
            type,
            path: currentPath,
            value,
            isColor: !!color,
          });
        }
      }

      return acc;
    }, []);
  }, [diffContent]);

  console.log("Processed diff lines:", diffLines); // Debug

  if (loadingDiff) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-stone-300 border-t-stone-600" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="sticky top-0 left-0 z-50 p-3 text-xs font-normal border border-figma-border w-[50px] bg-figma-bg text-left">
              Type
            </th>
            <th className="sticky top-0 z-40 p-3 text-xs font-normal border border-figma-border bg-figma-bg text-left">
              Path
            </th>
            <th className="sticky top-0 z-40 p-3 text-xs font-normal border border-figma-border bg-figma-bg text-left">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {diffLines.map((line, index) => {
            if (line.type === "header") {
              return (
                <tr key={index} className="bg-figma-bg-secondary">
                  <td
                    colSpan={3}
                    className="p-3 text-xs border border-figma-border text-figma-text-secondary"
                  >
                    {line.content}
                  </td>
                </tr>
              );
            }

            return (
              <tr
                key={index}
                className={`
                  ${line.type === "added" ? "bg-green-50/10" : ""}
                  ${line.type === "removed" ? "bg-red-50/10" : ""}
                  hover:bg-figma-border/20
                `}
              >
                <td className="p-3 text-xs border border-figma-border">
                  <span
                    className={
                      line.type === "added" ? "text-green-500" : "text-red-500"
                    }
                  >
                    {line.type === "added" ? "+" : "-"}
                  </span>
                </td>
                <td className="p-3 text-xs border border-figma-border">
                  {line.path}
                </td>
                <td className="p-3 text-xs border border-figma-border font-mono">
                  <div className="flex items-center gap-2">
                    {line.isColor && (
                      <div
                        className="w-4 h-4 rounded-sm border border-figma-border"
                        style={{ backgroundColor: line.value }}
                      />
                    )}
                    {line.value}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
