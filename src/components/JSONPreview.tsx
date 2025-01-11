import { useState } from "react";
import { Code, Copy } from "@phosphor-icons/react";
import { copyToClipboard } from "../utils";
import { Button } from "./Button";

interface JSONPreviewProps {
  content: string;
  expanded?: boolean;
}

/**
 * Component for previewing and copying JSON content
 * @param content - JSON string to display
 * @param expanded - Whether the preview should be expanded by default
 */
export function JSONPreview({ content, expanded = false }: JSONPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyToClipboard(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="border border-black/10 dark:border-white/10 rounded-sm">
      <div className="flex items-center justify-between p-2 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Code size={14} className="opacity-70" />
          <span className="text-xs font-medium">JSON Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="!py-1"
            onClick={handleCopy}
            icon={<Copy size={14} weight={copied ? "fill" : "regular"} />}
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            variant="secondary"
            className="!py-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </div>
      <div
        className={`overflow-auto transition-all ${
          isExpanded ? "max-h-96" : "max-h-32"
        }`}
      >
        <pre className="p-3 text-xs font-mono whitespace-pre overflow-x-auto">
          {content}
        </pre>
      </div>
    </div>
  );
}
